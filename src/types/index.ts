export interface Exercise {
    id: string;
    question: string;
    answer: string; // The expected correct answer
    hint?: string;
}

export interface Example {
    korean: string;
    chinese: string;
    audio?: string; // Placeholder for audio file path or ID
}

export interface GrammarPoint {
    title: string;
    explanation: string | string[];
    examples?: Example[];
}

export interface TranscriptLine {
    start: string; // "00:00:00.000"
    end: string;   // "00:00:02.140"
    korean: string;
    chinese: string;
}

export interface LessonContent {
    grammar?: GrammarPoint[];
    examples?: Example[]; // Examples used for Unit Review
    supplementary?: string; // Markdown or text
    video_link?: string;
    transcript?: TranscriptLine[];
}

export interface Lesson {
    id: string;
    title: string;
    description: string;
    content: LessonContent;
}

export interface Folder {
    id: string;
    title: string;
    description: string;
    lessons: Lesson[];
}

export interface Curriculum {
    folders: Folder[];
}

export interface ReviewItem {
    id: string;
    front: string;
    back: string;
    audio: string;
}
