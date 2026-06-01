#!/usr/bin/env python3
"""Terminal interface for personal flashcard practice."""

from __future__ import annotations

import curses
import getpass
import json
import os
import random
import re
import textwrap
import unicodedata
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
from urllib import error, parse, request


API_KEY = "AIzaSyB-jfMNzQBoBjf-Rabl2-V1bdI9btfAUEM"
PROJECT_ID = "ko-learning-app"


@dataclass
class AuthSession:
    email: str
    uid: str
    id_token: str
    refresh_token: str


@dataclass
class Folder:
    id: str
    name: str
    tags: List[str]


@dataclass
class Card:
    id: str
    korean: str
    chinese: str
    order: Optional[int]
    created_at: str
    is_starred: bool = False


@dataclass
class PartialCheckResult:
    all_correct_prefix: bool
    wrong_raw_indices: set[int]
    missing_space_before_raw_indices: set[int]


class FirebaseClient:
    def __init__(self, api_key: str, project_id: str) -> None:
        self.api_key = api_key
        self.project_id = project_id

    def sign_in(self, email: str, password: str) -> AuthSession:
        url = (
            "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
            f"?key={self.api_key}"
        )
        payload = {
            "email": email,
            "password": password,
            "returnSecureToken": True,
        }
        data = self._request_json("POST", url, payload=payload)
        return AuthSession(
            email=data.get("email", email),
            uid=data["localId"],
            id_token=data["idToken"],
            refresh_token=data["refreshToken"],
        )

    def list_folders(self, session: AuthSession) -> List[Folder]:
        docs = self._list_documents(["users", session.uid, "folders"], session=session)
        folders: List[Folder] = []
        for doc in docs:
            fields = _parse_firestore_fields(doc.get("fields", {}))
            folder_name = str(fields.get("name", "")).strip() or "(untitled folder)"
            tags_raw = fields.get("tags", [])
            tags = [str(tag) for tag in tags_raw] if isinstance(tags_raw, list) else []
            folders.append(
                Folder(
                    id=_doc_id(doc.get("name", "")),
                    name=folder_name,
                    tags=tags,
                )
            )
        folders.sort(key=lambda f: f.name.lower())
        return folders

    def list_cards(self, session: AuthSession, folder_id: str) -> List[Card]:
        docs = self._list_documents(
            ["users", session.uid, "folders", folder_id, "cards"], session=session
        )
        cards: List[Card] = []
        for doc in docs:
            fields = _parse_firestore_fields(doc.get("fields", {}))
            korean = str(fields.get("korean", "")).strip()
            chinese = str(fields.get("chinese", "")).strip()
            order_value = fields.get("order")
            order_num = int(order_value) if isinstance(order_value, int) else None
            created_at = str(fields.get("createdAt", ""))
            is_starred = bool(fields.get("isStarred", False))
            cards.append(
                Card(
                    id=_doc_id(doc.get("name", "")),
                    korean=korean,
                    chinese=chinese,
                    order=order_num,
                    created_at=created_at,
                    is_starred=is_starred,
                )
            )
        cards.sort(
            key=lambda c: (
                c.order is None,
                c.order if c.order is not None else 10**9,
                c.created_at,
            )
        )
        return cards

    def update_card_star(self, session: AuthSession, folder_id: str, card_id: str, is_starred: bool) -> None:
        url = (
            f"https://firestore.googleapis.com/v1/projects/{self.project_id}"
            f"/databases/(default)/documents/users/{session.uid}/folders/{folder_id}/cards/{card_id}"
            "?updateMask.fieldPaths=isStarred"
        )
        payload = {
            "fields": {
                "isStarred": {"booleanValue": is_starred}
            }
        }
        self._request_json("PATCH", url, payload=payload, session=session)

    def _list_documents(self, segments: List[str], session: AuthSession) -> List[Dict[str, Any]]:
        base_url = (
            f"https://firestore.googleapis.com/v1/projects/{self.project_id}"
            "/databases/(default)/documents"
        )
        path = "/".join(parse.quote(part, safe="") for part in segments)
        docs: List[Dict[str, Any]] = []
        next_page_token: Optional[str] = None

        while True:
            query: Dict[str, str] = {"pageSize": "200"}
            if next_page_token:
                query["pageToken"] = next_page_token
            url = f"{base_url}/{path}?{parse.urlencode(query)}"
            response = self._request_json("GET", url, session=session)
            docs.extend(response.get("documents", []))
            next_page_token = response.get("nextPageToken")
            if not next_page_token:
                break
        return docs

    def _refresh_session_token(self, session: AuthSession) -> None:
        url = f"https://securetoken.googleapis.com/v1/token?key={self.api_key}"
        payload = {
            "grant_type": "refresh_token",
            "refresh_token": session.refresh_token,
        }
        data = self._request_json("POST", url, payload=payload, _retry=False)
        if "id_token" in data:
            session.id_token = data["id_token"]
        if "refresh_token" in data:
            session.refresh_token = data["refresh_token"]

    def _request_json(
        self,
        method: str,
        url: str,
        payload: Optional[Dict[str, Any]] = None,
        session: Optional[AuthSession] = None,
        _retry: bool = True,
    ) -> Dict[str, Any]:
        headers = {"Content-Type": "application/json"}
        if session and session.id_token:
            headers["Authorization"] = f"Bearer {session.id_token}"

        data = None
        if payload is not None:
            data = json.dumps(payload).encode("utf-8")

        req = request.Request(url, method=method, headers=headers, data=data)
        try:
            with request.urlopen(req, timeout=25) as resp:
                body = resp.read().decode("utf-8")
                return json.loads(body) if body else {}
        except error.HTTPError as exc:
            if exc.code == 401 and session and session.refresh_token and _retry:
                self._refresh_session_token(session)
                return self._request_json(method, url, payload=payload, session=session, _retry=False)

            details = exc.read().decode("utf-8", errors="replace")
            message = _extract_http_error_message(details) or details or str(exc)
            raise RuntimeError(f"HTTP {exc.code}: {message}") from exc
        except error.URLError as exc:
            raise RuntimeError(f"Network error: {exc.reason}") from exc


def _extract_http_error_message(body: str) -> str:
    try:
        obj = json.loads(body)
    except json.JSONDecodeError:
        return body
    if "error" in obj:
        err = obj["error"]
        if isinstance(err, dict):
            return str(err.get("message", body))
    return body


def _doc_id(doc_name: str) -> str:
    return doc_name.rsplit("/", 1)[-1] if doc_name else ""


def _parse_firestore_fields(fields: Dict[str, Any]) -> Dict[str, Any]:
    parsed: Dict[str, Any] = {}
    for key, value in fields.items():
        parsed[key] = _parse_firestore_value(value)
    return parsed


def _parse_firestore_value(value: Dict[str, Any]) -> Any:
    if "stringValue" in value:
        return value["stringValue"]
    if "integerValue" in value:
        return int(value["integerValue"])
    if "doubleValue" in value:
        return float(value["doubleValue"])
    if "booleanValue" in value:
        return bool(value["booleanValue"])
    if "timestampValue" in value:
        return value["timestampValue"]
    if "nullValue" in value:
        return None
    if "arrayValue" in value:
        raw_items = value.get("arrayValue", {}).get("values", [])
        return [_parse_firestore_value(item) for item in raw_items]
    if "mapValue" in value:
        raw_fields = value.get("mapValue", {}).get("fields", {})
        return _parse_firestore_fields(raw_fields)
    return None


def normalize_text(text: str) -> str:
    # Ignore punctuation, but keep spaces exactly as entered.
    return "".join(ch for ch in text if not unicodedata.category(ch).startswith("P")).lower()


def _cell_width(ch: str) -> int:
    if not ch:
        return 0
    if unicodedata.combining(ch):
        return 0
    return 2 if unicodedata.east_asian_width(ch) in ("W", "F") else 1


def _text_cell_width(text: str) -> int:
    return sum(_cell_width(ch) for ch in text)


def _filtered_chars_with_raw_map(text: str) -> Tuple[List[str], List[int]]:
    chars: List[str] = []
    raw_indices: List[int] = []
    for raw_idx, ch in enumerate(text):
        if unicodedata.category(ch).startswith("P"):
            continue
        chars.append(ch.lower())
        raw_indices.append(raw_idx)
    return chars, raw_indices


def partial_check_input(user_input: str, answer: str) -> PartialCheckResult:
    user_chars, user_raw_map = _filtered_chars_with_raw_map(user_input)
    answer_chars, _ = _filtered_chars_with_raw_map(answer)

    n = len(user_chars)
    m = len(answer_chars)
    if n == 0:
        return PartialCheckResult(True, set(), set())

    inf = 10**9
    dp = [[inf] * (m + 1) for _ in range(n + 1)]
    parent: List[List[Optional[Tuple[int, int, str]]]] = [
        [None] * (m + 1) for _ in range(n + 1)
    ]
    dp[0][0] = 0

    def transition(
        i: int,
        j: int,
        ni: int,
        nj: int,
        cost: int,
        op: str,
        priority: int,
    ) -> None:
        new_cost = dp[i][j] + cost
        if new_cost < dp[ni][nj]:
            dp[ni][nj] = new_cost
            parent[ni][nj] = (i, j, op)
            return
        if new_cost == dp[ni][nj]:
            existing = parent[ni][nj]
            existing_priority = 999 if existing is None else int(existing[2].split("|", 1)[0])
            if priority < existing_priority:
                dp[ni][nj] = new_cost
                parent[ni][nj] = (i, j, op)

    for i in range(n + 1):
        for j in range(m + 1):
            if dp[i][j] >= inf:
                continue
            if i < n and j < m:
                same = user_chars[i] == answer_chars[j]
                if same:
                    transition(i, j, i + 1, j + 1, 0, "0|match", 0)
                else:
                    # Prefer insert/delete around spaces so we can mark missing/extra spaces precisely.
                    sub_cost = 2 if (user_chars[i] == " " or answer_chars[j] == " ") else 1
                    transition(i, j, i + 1, j + 1, sub_cost, "3|sub", 3)
            if i < n:
                transition(i, j, i + 1, j, 1, "2|del_user", 2)
            if j < m:
                transition(i, j, i, j + 1, 1, "1|ins_answer", 1)

    best_j = 0
    best_cost = dp[n][0]
    for j in range(1, m + 1):
        if dp[n][j] < best_cost:
            best_cost = dp[n][j]
            best_j = j
        elif dp[n][j] == best_cost and j > best_j:
            best_j = j

    wrong_raw_indices: set[int] = set()
    missing_space_before_raw_indices: set[int] = set()

    i, j = n, best_j
    while i > 0 or j > 0:
        step = parent[i][j]
        if step is None:
            break
        pi, pj, op_raw = step
        op = op_raw.split("|", 1)[1]

        if op == "sub":
            wrong_raw_indices.add(user_raw_map[i - 1])
        elif op == "del_user":
            wrong_raw_indices.add(user_raw_map[i - 1])
        elif op == "ins_answer":
            missing_char = answer_chars[j - 1]
            if pi < n:
                if missing_char == " ":
                    missing_space_before_raw_indices.add(user_raw_map[pi])
                else:
                    wrong_raw_indices.add(user_raw_map[pi])

        i, j = pi, pj

    all_correct_prefix = not wrong_raw_indices and not missing_space_before_raw_indices
    return PartialCheckResult(
        all_correct_prefix=all_correct_prefix,
        wrong_raw_indices=wrong_raw_indices,
        missing_space_before_raw_indices=missing_space_before_raw_indices,
    )


def draw_answer_with_feedback(
    stdscr: curses.window,
    y: int,
    x: int,
    prefix: str,
    user_input: str,
    feedback: Optional[PartialCheckResult],
    ok_attr: int,
    wrong_attr: int,
) -> List[int]:
    draw_line(stdscr, y, x, prefix)
    cursor_x = x + _text_cell_width(prefix)
    cursor_positions = [cursor_x]

    if feedback is None:
        draw_line(stdscr, y, cursor_x, user_input)
        for ch in user_input:
            cursor_x += _cell_width(ch)
            cursor_positions.append(cursor_x)
        return cursor_positions

    all_ok = feedback.all_correct_prefix and bool(user_input)
    for raw_idx, ch in enumerate(user_input):
        if raw_idx in feedback.missing_space_before_raw_indices:
            draw_line(stdscr, y, cursor_x, "|", wrong_attr)
            cursor_x += 1

        attr = ok_attr if all_ok else (wrong_attr if raw_idx in feedback.wrong_raw_indices else 0)
        draw_line(stdscr, y, cursor_x, ch, attr)
        cursor_x += _cell_width(ch)
        cursor_positions.append(cursor_x)

    return cursor_positions


def load_local_env(file_path: str = ".env") -> None:
    if not os.path.exists(file_path):
        return

    with open(file_path, "r", encoding="utf-8") as f:
        for raw_line in f:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip()
            if (value.startswith('"') and value.endswith('"')) or (
                value.startswith("'") and value.endswith("'")
            ):
                value = value[1:-1]
            os.environ.setdefault(key, value)


def draw_line(stdscr: curses.window, y: int, x: int, text: str, attr: int = 0) -> None:
    height, width = stdscr.getmaxyx()
    if y < 0 or y >= height:
        return
    if x >= width:
        return
    if x < 0:
        x = 0
    max_len = max(0, width - x - 1)
    stdscr.addstr(y, x, text[:max_len], attr)


def draw_wrapped(
    stdscr: curses.window, y: int, x: int, width: int, text: str, attr: int = 0
) -> int:
    lines = textwrap.wrap(text, max(1, width)) or [""]
    for line in lines:
        draw_line(stdscr, y, x, line, attr)
        y += 1
    return y


def wait_message(stdscr: curses.window, title: str, message: str) -> None:
    stdscr.clear()
    curses.curs_set(0)
    draw_line(stdscr, 1, 2, title, curses.A_BOLD)
    y = draw_wrapped(stdscr, 3, 2, stdscr.getmaxyx()[1] - 4, message)
    draw_line(stdscr, y + 1, 2, "Press any key to continue...", curses.A_DIM)
    stdscr.refresh()
    stdscr.getch()


def clear_plain_screen() -> None:
    print("\033[2J\033[H", end="")


def prompt_search_query(stdscr: curses.window, initial_query: str = "") -> Optional[str]:
    query = initial_query
    stdscr.keypad(True)
    curses.curs_set(1)

    while True:
        stdscr.clear()
        draw_line(stdscr, 1, 2, "Folder Search", curses.A_BOLD)
        draw_line(stdscr, 2, 2, "Type keyword, Enter=apply, Esc=cancel", curses.A_DIM)
        draw_line(stdscr, 3, 2, f"Query: {query}")
        stdscr.move(3, min(stdscr.getmaxyx()[1] - 1, 9 + len(query)))
        stdscr.refresh()

        key = stdscr.get_wch()
        if key == curses.KEY_RESIZE:
            continue
        if key == "\x1b":
            curses.curs_set(0)
            return None
        if key in ("\n", "\r") or key in (curses.KEY_ENTER, 10, 13):
            curses.curs_set(0)
            return query.strip()
        if key in (curses.KEY_BACKSPACE, "\b", "\x7f"):
            query = query[:-1]
            continue
        if isinstance(key, str) and key.isprintable():
            query += key


def folder_menu(stdscr: curses.window, email: str, folders: List[Folder]) -> Tuple[str, int]:
    selected = 0
    search_query = ""
    stdscr.keypad(True)
    curses.curs_set(0)

    while True:
        filtered_pairs = [
            (idx, folder)
            for idx, folder in enumerate(folders)
            if not search_query or search_query.lower() in folder.name.lower()
        ]
        filtered_folders = [folder for _, folder in filtered_pairs]
        if filtered_folders:
            selected %= len(filtered_folders)
        else:
            selected = 0

        stdscr.clear()
        draw_line(
            stdscr,
            1,
            2,
            f"Folders ({len(filtered_folders)}/{len(folders)}) | {email}",
            curses.A_BOLD,
        )
        draw_line(
            stdscr,
            2,
            2,
            "Arrows=move Enter=open F=search Shift+R=refresh Shift+Q/Esc=quit",
            curses.A_DIM,
        )
        if search_query:
            draw_line(stdscr, 3, 2, f"Search: {search_query}", curses.A_BOLD)

        if not folders:
            draw_line(stdscr, 3, 2, "No folders found.", curses.A_BOLD)
            draw_line(stdscr, 4, 2, "Press Shift+R to refresh.", curses.A_DIM)
            stdscr.refresh()
            key = stdscr.getch()
            if key in (ord("Q"), 27):
                return ("quit", -1)
            if key == ord("R"):
                return ("refresh", -1)
            if key in (ord("f"), ord("F")):
                next_query = prompt_search_query(stdscr, search_query)
                if next_query is not None:
                    search_query = next_query
                continue
            continue

        if not filtered_folders:
            draw_line(stdscr, 4, 2, "No matching folders.", curses.A_BOLD)
            draw_line(stdscr, 5, 2, "Press F to search again or clear query.", curses.A_DIM)
            stdscr.refresh()
            key = stdscr.getch()
            if key in (ord("Q"), 27):
                return ("quit", -1)
            if key == ord("R"):
                return ("refresh", -1)
            if key in (ord("f"), ord("F")):
                next_query = prompt_search_query(stdscr, search_query)
                if next_query is not None:
                    search_query = next_query
                continue
            continue

        visible_rows = 3
        start = max(0, selected - 1)
        if start + visible_rows > len(filtered_folders):
            start = max(0, len(filtered_folders) - visible_rows)
        end = min(len(filtered_folders), start + visible_rows)

        for idx in range(start, end):
            folder = filtered_folders[idx]
            prefix = ">> " if idx == selected else "   "
            tags = f" [{', '.join(folder.tags)}]" if folder.tags else ""
            attr = curses.A_REVERSE if idx == selected else curses.A_NORMAL
            row_y = 4 if search_query else 3
            draw_line(stdscr, row_y + (idx - start), 2, f"{prefix}{folder.name}{tags}", attr)

        stdscr.refresh()
        key = stdscr.getch()
        if key in (ord("Q"), 27):
            return ("quit", -1)
        if key == ord("R"):
            return ("refresh", -1)
        if key in (ord("f"), ord("F")):
            next_query = prompt_search_query(stdscr, search_query)
            if next_query is not None:
                search_query = next_query
            continue
        if key in (curses.KEY_UP, curses.KEY_LEFT):
            selected = (selected - 1) % len(filtered_folders)
            continue
        if key in (curses.KEY_DOWN, curses.KEY_RIGHT):
            selected = (selected + 1) % len(filtered_folders)
            continue
        if key in (curses.KEY_ENTER, 10, 13):
            return ("open", filtered_pairs[selected][0])


def options_menu(stdscr: curses.window, folder_name: str) -> Optional[Tuple[str, str]]:
    order_modes = ["sequential", "random"]
    front_modes = ["zh", "ko"]
    order_idx = 0
    front_idx = 0
    selected_row = 0
    curses.curs_set(0)
    stdscr.keypad(True)

    while True:
        stdscr.clear()
        draw_line(stdscr, 1, 2, f"Practice Setup | {folder_name}", curses.A_BOLD)
        draw_line(stdscr, 2, 2, "Esc=back Arrows=change Enter=start", curses.A_DIM)

        order_label = "Sequential" if order_modes[order_idx] == "sequential" else "Random"
        front_label = "Show Chinese first" if front_modes[front_idx] == "zh" else "Show Korean first"

        order_attr = curses.A_REVERSE if selected_row == 0 else curses.A_NORMAL
        front_attr = curses.A_REVERSE if selected_row == 1 else curses.A_NORMAL
        draw_line(stdscr, 3, 2, f"A) Order : {order_label}", order_attr)
        draw_line(stdscr, 4, 2, f"B) Prompt: {front_label}", front_attr)

        answer_target = "Korean" if front_modes[front_idx] == "zh" else "Chinese"
        draw_line(stdscr, 5, 2, f"Type target: {answer_target}", curses.A_BOLD)

        stdscr.refresh()
        key = stdscr.getch()
        if key == 27:
            return None
        if key in (curses.KEY_UP,):
            selected_row = (selected_row - 1) % 2
            continue
        if key in (curses.KEY_DOWN,):
            selected_row = (selected_row + 1) % 2
            continue
        if key in (curses.KEY_LEFT, curses.KEY_RIGHT):
            if selected_row == 0:
                order_idx = 1 - order_idx
            else:
                front_idx = 1 - front_idx
            continue
        if key in (curses.KEY_ENTER, 10, 13):
            return (order_modes[order_idx], front_modes[front_idx])


def mode_menu(stdscr: curses.window, folder_name: str) -> Optional[str]:
    options = [("study", "學習模式 (Study)"), ("practice", "練習模式 (Practice)")]
    selected = 0
    curses.curs_set(0)
    stdscr.keypad(True)

    while True:
        stdscr.clear()
        draw_line(stdscr, 1, 2, f"Mode Select | {folder_name}", curses.A_BOLD)
        draw_line(stdscr, 2, 2, "Arrows=move Enter=open Esc=back", curses.A_DIM)

        for idx, (_, label) in enumerate(options):
            attr = curses.A_REVERSE if idx == selected else curses.A_NORMAL
            prefix = ">> " if idx == selected else "   "
            draw_line(stdscr, 3 + idx, 2, f"{prefix}{label}", attr)

        stdscr.refresh()
        key = stdscr.getch()
        if key == 27:
            return None
        if key in (curses.KEY_UP, curses.KEY_LEFT):
            selected = (selected - 1) % len(options)
            continue
        if key in (curses.KEY_DOWN, curses.KEY_RIGHT):
            selected = (selected + 1) % len(options)
            continue
        if key in (curses.KEY_ENTER, 10, 13):
            return options[selected][0]


def only_starred_menu(stdscr: curses.window, folder_name: str) -> Optional[bool]:
    options = [(False, "全部卡片 (All Cards)"), (True, "只有星星 (Only Starred)")]
    selected = 0
    curses.curs_set(0)
    stdscr.keypad(True)

    while True:
        stdscr.clear()
        draw_line(stdscr, 1, 2, f"Filter Select | {folder_name}", curses.A_BOLD)
        draw_line(stdscr, 2, 2, "Arrows=move Enter=select Esc=back", curses.A_DIM)

        for idx, (val, label) in enumerate(options):
            attr = curses.A_REVERSE if idx == selected else curses.A_NORMAL
            prefix = ">> " if idx == selected else "   "
            draw_line(stdscr, 3 + idx, 2, f"{prefix}{label}", attr)

        stdscr.refresh()
        key = stdscr.getch()
        if key == 27:
            return None
        if key in (curses.KEY_UP, curses.KEY_LEFT):
            selected = (selected - 1) % len(options)
            continue
        if key in (curses.KEY_DOWN, curses.KEY_RIGHT):
            selected = (selected + 1) % len(options)
            continue
        if key in (curses.KEY_ENTER, 10, 13):
            return options[selected][0]


def run_study_mode(
    stdscr: curses.window,
    folder_name: str,
    folder_id: str,
    cards: List[Card],
    only_starred_mode: bool,
    client: FirebaseClient,
    session: AuthSession,
) -> None:
    idx = 0
    message = ""
    curses.curs_set(0)
    stdscr.keypad(True)

    while True:
        if not cards:
            wait_message(stdscr, "Study Complete", "No more cards available.")
            return

        card = cards[idx]
        stdscr.clear()
        star_indicator = "[★] " if card.is_starred else "[ ] "
        draw_line(
            stdscr,
            1,
            2,
            (
                f"Study | Card {idx + 1}/{len(cards)}, "
                "Esc=back  4=prev  6=next  0=star"
            ),
            curses.A_BOLD,
        )
        draw_line(stdscr, 2, 2, f"{star_indicator}KO:{card.korean}")
        draw_line(stdscr, 3, 2, f"    ZH:{card.chinese}")
        if message:
            draw_line(stdscr, 4, 2, message, curses.A_BOLD)
        stdscr.refresh()

        key = stdscr.get_wch()
        if key == "\x1b":
            return
        if isinstance(key, str):
            if key == "0":
                card.is_starred = not card.is_starred
                try:
                    client.update_card_star(session, folder_id, card.id, card.is_starred)
                    if only_starred_mode and not card.is_starred:
                        del cards[idx]
                        if idx >= len(cards):
                            idx = max(0, len(cards) - 1)
                        message = "Card unstarred and removed from session."
                    else:
                        message = "Card starred." if card.is_starred else "Card unstarred."
                except RuntimeError as exc:
                    card.is_starred = not card.is_starred # rollback
                    message = f"Failed to update star: {exc}"
                continue
            if key == "4":
                if idx > 0:
                    idx -= 1
                    message = "Moved to previous card."
                else:
                    message = "Already at first card."
                continue
            if key == "6":
                if idx < len(cards) - 1:
                    idx += 1
                    message = "Moved to next card."
                else:
                    message = "Already at last card."
                continue


def run_practice(
    stdscr: curses.window,
    folder_name: str,
    folder_id: str,
    cards: List[Card],
    order_mode: str,
    front_mode: str,
    only_starred_mode: bool,
    client: FirebaseClient,
    session: AuthSession,
) -> None:
    if order_mode == "random":
        random.shuffle(cards)

    idx = 0
    user_input = ""
    input_cursor = 0
    show_hint = False
    message = ""
    partial_check: Optional[PartialCheckResult] = None

    stdscr.keypad(True)
    curses.curs_set(1)
    ok_attr = curses.A_BOLD
    wrong_attr = curses.A_REVERSE
    if curses.has_colors():
        curses.start_color()
        try:
            curses.use_default_colors()
        except curses.error:
            pass
        try:
            curses.init_pair(1, curses.COLOR_GREEN, -1)
            curses.init_pair(2, curses.COLOR_BLACK, curses.COLOR_RED)
            ok_attr = curses.color_pair(1) | curses.A_BOLD
            wrong_attr = curses.color_pair(2)
        except curses.error:
            ok_attr = curses.A_BOLD
            wrong_attr = curses.A_REVERSE

    while True:
        if not cards:
            wait_message(stdscr, "Practice Complete", "No more cards available.")
            return

        card = cards[idx]
        star_indicator = "[★] " if card.is_starred else "[ ] "
        prompt = card.chinese if front_mode == "zh" else card.korean
        answer = card.korean if front_mode == "zh" else card.chinese
        answer_prefix = "Answer:"

        stdscr.clear()
        height, width = stdscr.getmaxyx()
        draw_line(
            stdscr,
            1,
            2,
            (
                f"Mode: {order_mode} | Card {idx + 1}/{len(cards)},   "
                "Esc=back  8=hint  4=prev  +=check  6=next  <-/->=move  0=star"
            ),
            curses.A_BOLD,
        )
        draw_line(stdscr, 2, 2, f"{star_indicator}Prompt:{prompt}")
        hint_text = f"Hint  : {answer}" if show_hint else "Hint  : hidden (press 8)"
        draw_line(stdscr, 3, 2, hint_text)
        cursor_x = draw_answer_with_feedback(
            stdscr,
            4,
            2,
            answer_prefix,
            user_input,
            partial_check,
            ok_attr=ok_attr,
            wrong_attr=wrong_attr,
        )
        if input_cursor < 0:
            input_cursor = 0
        if input_cursor > len(user_input):
            input_cursor = len(user_input)

        if message:
            draw_line(stdscr, 6, 2, message, curses.A_BOLD)

        cursor_y = min(height - 1, 4)
        cursor_screen_x = cursor_x[input_cursor] if input_cursor < len(cursor_x) else cursor_x[-1]
        stdscr.move(cursor_y, min(width - 1, cursor_screen_x))
        stdscr.refresh()

        key = stdscr.get_wch()
        if key == curses.KEY_RESIZE:
            continue

        if key == "\x1b":
            curses.curs_set(0)
            return

        if key in ("\n", "\r") or key in (curses.KEY_ENTER, 10, 13):
            if normalize_text(user_input) == normalize_text(answer):
                if idx == len(cards) - 1:
                    wait_message(
                        stdscr,
                        "Practice Complete",
                        "Nice work. You completed all cards in this folder.",
                    )
                    curses.curs_set(0)
                    return
                idx += 1
                user_input = ""
                input_cursor = 0
                show_hint = False
                partial_check = None
                message = "Correct. Moved to next card."
            else:
                partial_check = None
                message = "Incorrect. Try again, use hint (8), or skip (6)."
            continue

        if key in (curses.KEY_BACKSPACE, "\b", "\x7f"):
            if input_cursor > 0:
                user_input = user_input[: input_cursor - 1] + user_input[input_cursor:]
                input_cursor -= 1
            partial_check = None
            continue

        if key == curses.KEY_DC:
            if input_cursor < len(user_input):
                user_input = user_input[:input_cursor] + user_input[input_cursor + 1 :]
            partial_check = None
            continue

        if key == curses.KEY_LEFT:
            if input_cursor > 0:
                input_cursor -= 1
            continue

        if key == curses.KEY_RIGHT:
            if input_cursor < len(user_input):
                input_cursor += 1
            continue

        if key == curses.KEY_HOME:
            input_cursor = 0
            continue

        if key == curses.KEY_END:
            input_cursor = len(user_input)
            continue

        if isinstance(key, str):
            if key == "0":
                card.is_starred = not card.is_starred
                try:
                    client.update_card_star(session, folder_id, card.id, card.is_starred)
                    if only_starred_mode and not card.is_starred:
                        del cards[idx]
                        if idx >= len(cards):
                            idx = max(0, len(cards) - 1)
                        user_input = ""
                        input_cursor = 0
                        show_hint = False
                        partial_check = None
                        message = "Card unstarred and removed from session."
                    else:
                        message = "Card starred." if card.is_starred else "Card unstarred."
                except RuntimeError as exc:
                    card.is_starred = not card.is_starred # rollback
                    message = f"Failed to update star: {exc}"
                continue
            if key == "8":
                show_hint = not show_hint
                message = "Hint shown." if show_hint else "Hint hidden."
                continue
            if key == "4":
                if idx > 0:
                    idx -= 1
                    user_input = ""
                    input_cursor = 0
                    show_hint = False
                    partial_check = None
                    message = "Moved to previous card."
                else:
                    message = "Already at first card."
                continue
            if key == "+":
                partial_check = partial_check_input(user_input, answer)
                if not user_input:
                    message = "No input yet."
                elif partial_check.all_correct_prefix:
                    message = "Prefix check passed."
                else:
                    message = "Prefix check found mistakes."
                continue
            if key == "6":
                if idx < len(cards) - 1:
                    idx += 1
                    user_input = ""
                    input_cursor = 0
                    show_hint = False
                    partial_check = None
                    message = "Skipped to next card."
                else:
                    message = "Already at last card."
                continue
            if key.isprintable():
                user_input = user_input[:input_cursor] + key + user_input[input_cursor:]
                input_cursor += 1
                partial_check = None
                continue


def run_terminal_ui(stdscr: curses.window, client: FirebaseClient, session: AuthSession) -> None:
    while True:
        try:
            folders = client.list_folders(session)
        except RuntimeError as exc:
            wait_message(stdscr, "Error", f"Failed to load folders:\n{exc}")
            return

        action, idx = folder_menu(stdscr, session.email, folders)
        if action == "quit":
            return
        if action == "refresh":
            continue
        if action != "open" or idx < 0 or idx >= len(folders):
            continue

        folder = folders[idx]

        try:
            cards = client.list_cards(session, folder.id)
        except RuntimeError as exc:
            wait_message(stdscr, "Error", f"Failed to load cards:\n{exc}")
            continue

        if not cards:
            wait_message(stdscr, "No Cards", "This folder does not contain cards.")
            continue

        while True:
            selected_mode = mode_menu(stdscr, folder.name)
            if selected_mode is None:
                break

            only_starred_mode = only_starred_menu(stdscr, folder.name)
            if only_starred_mode is None:
                continue

            active_cards = [c for c in cards if c.is_starred] if only_starred_mode else list(cards)
            if not active_cards:
                wait_message(stdscr, "No Cards", "No starred cards found in this folder.")
                continue

            if selected_mode == "study":
                run_study_mode(
                    stdscr, folder.name, folder.id, active_cards,
                    only_starred_mode, client, session
                )
                continue

            if selected_mode == "practice":
                options = options_menu(stdscr, folder.name)
                if not options:
                    continue
                order_mode, front_mode = options
                run_practice(
                    stdscr,
                    folder.name,
                    folder.id,
                    active_cards,
                    order_mode=order_mode,
                    front_mode=front_mode,
                    only_starred_mode=only_starred_mode,
                    client=client,
                    session=session,
                )


def prompt_login(client: FirebaseClient) -> AuthSession:
    default_email = os.getenv("TERMINAL_PRACTICE_EMAIL", "").strip()
    default_password = os.getenv("TERMINAL_PRACTICE_PASSWORD", "")

    while True:
        clear_plain_screen()
        print("Login | Personal Flashcard Terminal")
        print("Use .env defaults by pressing Enter.")
        email_prompt = f"Email [{default_email}]: " if default_email else "Email: "
        email_input = input(email_prompt).strip()
        email = email_input or default_email
        if not email:
            print("Email is required. Press Enter to retry.")
            input()
            continue

        if default_password:
            password_input = getpass.getpass("Password [Enter to use .env default]: ")
            password = password_input or default_password
        else:
            password = getpass.getpass("Password: ")

        if not password:
            print("Password is required. Press Enter to retry.")
            input()
            continue

        try:
            return client.sign_in(email, password)
        except RuntimeError as exc:
            print(f"Login failed: {exc}")
            retry = input("Try again? (y/n): ").strip().lower()
            if retry != "y":
                raise SystemExit(1)


def main() -> None:
    load_local_env()
    client = FirebaseClient(api_key=API_KEY, project_id=PROJECT_ID)
    session = prompt_login(client)
    curses.wrapper(run_terminal_ui, client, session)


if __name__ == "__main__":
    main()
