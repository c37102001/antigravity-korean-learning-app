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
    explanation: string;
    examples: Example[];
}

export interface LessonContent {
    grammar: GrammarPoint[];
    examples: Example[]; // General examples for the day
    supplementary: string; // Markdown or text
    exercises: Exercise[];
}

export interface Day {
    id: string;
    title: string;
    description: string;
    content: LessonContent;
}

export interface Week {
    id: string;
    title: string;
    description: string;
    days: Day[];
}

export interface Curriculum {
    weeks: Week[];
}
