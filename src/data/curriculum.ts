import type { Curriculum, Folder, Lesson, LessonContent } from '../types';
import foldersData from './folders.json';

// 1. Load all JSON files under ./lessons/
const lessonModules = import.meta.glob('./lessons/**/*.json', { eager: true });

// 2. Helper to find the content for a given file path
const getLessonContent = (filePath: string): LessonContent => {
    // The key in lessonModules will be relative to this file, e.g., "./lessons/week1/day1.json"
    // The value is the module, which has a default export with the JSON content
    const key = `./lessons/${filePath}`;
    const module = lessonModules[key] as { default: LessonContent } | undefined;

    if (!module) {
        console.error(`Lesson file not found: ${key}`);
        return {
            grammar: [],
            examples: [],
            supplementary: 'Content not found',
            exercises: []
        };
    }
    return module.default;
};

// 3. Construct the full curriculum object
const folders: Folder[] = foldersData.map((folderRaw) => {
    const lessons: Lesson[] = folderRaw.lessons.map((lessonRaw) => {
        return {
            id: lessonRaw.id,
            title: lessonRaw.title,
            description: lessonRaw.description,
            content: getLessonContent(lessonRaw.file)
        };
    });

    return {
        id: folderRaw.id,
        title: folderRaw.title,
        description: folderRaw.description,
        lessons
    };
});

export const curriculum: Curriculum = {
    folders
};
