#!/usr/bin/env python3
"""Play a local media file from the terminal with single-key seeking."""

from __future__ import annotations

import argparse
import fcntl
import os
import re
import select
import shutil
import signal
import subprocess
import sys
import termios
import time
import tty
from pathlib import Path
from typing import Optional, Sequence


SEEK_SECONDS = 5
PROGRESS_REFRESH_SECONDS = 0.25
QUERY_TIMEOUT_SECONDS = 0.15


class RawTerminal:
    def __enter__(self) -> "RawTerminal":
        self._fd = sys.stdin.fileno()
        self._old_settings = termios.tcgetattr(self._fd)
        tty.setcbreak(self._fd)
        return self

    def __exit__(self, exc_type: object, exc: object, tb: object) -> None:
        termios.tcsetattr(self._fd, termios.TCSADRAIN, self._old_settings)


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Play a media file and control seeking from the terminal. "
            "Press 6 to seek forward 5 seconds, 4 to seek backward 5 seconds."
        )
    )
    parser.add_argument("file", help="Path to an mp3, mp4, wav, or other VLC-supported file.")
    return parser.parse_args(argv)


def find_vlc_command() -> list[str]:
    cvlc = shutil.which("cvlc")
    if cvlc:
        return [cvlc]

    vlc = shutil.which("vlc")
    if vlc:
        return [vlc, "-I", "rc"]

    raise RuntimeError(
        "VLC was not found. Install VLC first, then run this script again."
    )


def start_player(file_path: Path) -> subprocess.Popen[str]:
    command = [
        *find_vlc_command(),
        "--intf",
        "rc",
        "--rc-fake-tty",
        "--no-video",
        "--play-and-pause",
        str(file_path),
    ]
    return subprocess.Popen(
        command,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True,
        start_new_session=True,
    )


def make_stdout_nonblocking(player: subprocess.Popen[str]) -> None:
    if player.stdout is None:
        return
    flags = fcntl.fcntl(player.stdout.fileno(), fcntl.F_GETFL)
    fcntl.fcntl(player.stdout.fileno(), fcntl.F_SETFL, flags | os.O_NONBLOCK)


def send_command(player: subprocess.Popen[str], command: str) -> None:
    if player.stdin is None or player.poll() is not None:
        return
    try:
        player.stdin.write(f"{command}\n")
        player.stdin.flush()
    except BrokenPipeError:
        return


def read_player_output(player: subprocess.Popen[str]) -> str:
    if player.stdout is None:
        return ""

    chunks: list[str] = []
    while True:
        try:
            chunk = player.stdout.read()
        except (BlockingIOError, TypeError):
            break
        if not chunk:
            break
        chunks.append(chunk)
    return "".join(chunks)


def query_player_seconds(player: subprocess.Popen[str], command: str) -> Optional[int]:
    read_player_output(player)
    send_command(player, command)

    deadline = time.monotonic() + QUERY_TIMEOUT_SECONDS
    output = ""
    while time.monotonic() < deadline and player.poll() is None:
        output += read_player_output(player)
        matches = re.findall(r"(?:^|[>\n]\s*)(\d+)(?=\s*(?:\n|>|$))", output)
        if matches:
            return int(matches[-1])
        time.sleep(0.01)

    return None


def print_controls(file_path: Path) -> None:
    print(f"Playing: {file_path}")
    print("Controls: 6 = forward 5s | 4 = back 5s | space = pause/resume | q = quit")
    print("When playback reaches the end, press 4 to replay the last 5 seconds.")
    print("Keep this terminal focused while controlling playback.")


def format_seconds(seconds: Optional[int]) -> str:
    if seconds is None or seconds < 0:
        return "--:--"

    hours, remainder = divmod(seconds, 3600)
    minutes, secs = divmod(remainder, 60)
    if hours:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def progress_line(
    current_seconds: Optional[int],
    duration_seconds: Optional[int],
    status: str = "",
) -> str:
    width = shutil.get_terminal_size((80, 20)).columns
    time_label = f"  {format_seconds(current_seconds)}/{format_seconds(duration_seconds)}"
    status_label = f"  {status}" if status else ""
    bar_width = max(10, min(44, width - len(time_label) - len(status_label) - 3))

    if current_seconds is None or not duration_seconds:
        marker_index = 0
    else:
        ratio = max(0.0, min(1.0, current_seconds / duration_seconds))
        marker_index = min(bar_width - 1, round(ratio * (bar_width - 1)))

    bar = "-" * marker_index + "*" + " " * (bar_width - marker_index - 1)
    return f"|{bar}|{time_label}{status_label}"


def draw_progress(
    current_seconds: Optional[int],
    duration_seconds: Optional[int],
    status: str = "",
) -> None:
    print(f"\r\033[K{progress_line(current_seconds, duration_seconds, status)}", end="", flush=True)


def stop_player(player: subprocess.Popen[str]) -> None:
    if player.poll() is not None:
        return

    send_command(player, "quit")
    try:
        player.wait(timeout=2)
        return
    except subprocess.TimeoutExpired:
        pass

    try:
        os.killpg(player.pid, signal.SIGTERM)
        player.wait(timeout=2)
    except (ProcessLookupError, subprocess.TimeoutExpired):
        if player.poll() is None:
            player.kill()


def run(file_path: Path) -> int:
    player = start_player(file_path)
    make_stdout_nonblocking(player)
    print_controls(file_path)

    current_seconds: Optional[int] = None
    duration_seconds: Optional[int] = None
    last_progress_at = 0.0
    last_duration_query_at = 0.0
    status = ""
    status_until = 0.0

    try:
        with RawTerminal():
            while player.poll() is None:
                now = time.monotonic()
                readable, _, _ = select.select([sys.stdin], [], [], 0.1)
                if readable:
                    key = sys.stdin.read(1)
                    if key == "6":
                        send_command(player, f"seek +{SEEK_SECONDS}")
                        if current_seconds is not None:
                            current_seconds = current_seconds + SEEK_SECONDS
                            if duration_seconds is not None:
                                current_seconds = min(current_seconds, duration_seconds)
                        status = f"+{SEEK_SECONDS}s"
                        status_until = now + 0.8
                    elif key == "4":
                        was_at_end = (
                            current_seconds is not None
                            and duration_seconds is not None
                            and current_seconds >= duration_seconds - 1
                        )
                        send_command(player, f"seek -{SEEK_SECONDS}")
                        if was_at_end:
                            send_command(player, "play")
                        if current_seconds is not None:
                            current_seconds = max(0, current_seconds - SEEK_SECONDS)
                        status = f"-{SEEK_SECONDS}s replay" if was_at_end else f"-{SEEK_SECONDS}s"
                        status_until = now + 0.8
                    elif key == " ":
                        send_command(player, "pause")
                        status = "pause/resume"
                        status_until = now + 0.8
                    elif key.lower() == "q":
                        break

                if duration_seconds is None or now - last_duration_query_at >= 2:
                    queried_duration = query_player_seconds(player, "get_length")
                    if queried_duration and queried_duration > 0:
                        duration_seconds = queried_duration
                    last_duration_query_at = now

                if now - last_progress_at >= PROGRESS_REFRESH_SECONDS:
                    queried_time = query_player_seconds(player, "get_time")
                    if queried_time is not None:
                        current_seconds = queried_time
                    if status and now >= status_until:
                        status = ""
                    draw_progress(current_seconds, duration_seconds, status)
                    last_progress_at = now
    finally:
        stop_player(player)
        print("\nStopped.")

    return 0


def main(argv: Sequence[str]) -> int:
    args = parse_args(argv)
    file_path = Path(args.file).expanduser().resolve()

    if not file_path.exists():
        print(f"File not found: {file_path}", file=sys.stderr)
        return 1
    if not file_path.is_file():
        print(f"Not a file: {file_path}", file=sys.stderr)
        return 1
    if not sys.stdin.isatty():
        print("This script must be run from an interactive terminal.", file=sys.stderr)
        return 1

    try:
        return run(file_path)
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
