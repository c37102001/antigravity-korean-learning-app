import React from 'react';
import { useParams, useSearchParams, Navigate, Link } from 'react-router-dom';
import { curriculum } from '../data/curriculum';
import { FlashcardGame } from '../components/review/FlashcardGame';
import { TranslationGame } from '../components/review/TranslationGame';
import { ListeningGame } from '../components/review/ListeningGame';
import { ChevronLeft } from 'lucide-react';
import type { ReviewItem } from '../types';

export const LessonReviewGame: React.FC = () => {
    const { folderId, lessonId, gameId } = useParams<{ folderId: string; lessonId: string; gameId: string }>();
    const [searchParams] = useSearchParams();
    const mode = (searchParams.get('mode') as 'random' | 'sequential') || 'random';
    const frontSide = (searchParams.get('front') as 'question' | 'answer') || 'question';
    const autoAudio = searchParams.get('audio') !== 'false';

    const folder = curriculum.folders.find(f => f.id === folderId);
    const lesson = folder?.lessons.find(l => l.id === lessonId);

    if (!folder || !lesson) {
        return <Navigate to="/" replace />;
    }

    // Convert examples to ReviewItems
    // Example: { korean, chinese }
    // ReviewItem: { id, front, back, audio }
    // Mapping:
    // Front = Chinese (Meaning)
    // Back = Korean (Word/Phrase)
    // Audio = Korean (Word/Phrase)

    // If frontSide is 'answer', we swap Front and Back
    const getReviewItems = (): ReviewItem[] => {
        if (!lesson) return [];

        // Handle Video Lessons (Transcript)
        if (lesson.content.transcript && lesson.content.transcript.length > 0) {
            return lesson.content.transcript.map((line, index) => ({
                id: `trans-${index}`,
                front: frontSide === 'answer' ? line.korean : line.chinese,
                back: frontSide === 'answer' ? line.chinese : line.korean,
                audio: line.korean
            }));
        }

        // Handle Standard Lessons (Examples + Grammar Examples)
        const grammarExamples = lesson.content.grammar
            ? lesson.content.grammar.flatMap(g => g.examples || [])
            : [];

        const allExamples = [...(lesson.content.examples || []), ...grammarExamples];

        return allExamples.map((ex, index) => ({
            id: `ex-${index}`,
            front: frontSide === 'answer' ? ex.korean : ex.chinese,
            back: frontSide === 'answer' ? ex.chinese : ex.korean,
            audio: ex.korean
        }));
    };
    const items: ReviewItem[] = getReviewItems();

    if (items.length === 0) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-bold text-slate-900 mb-4">本單元沒有範例</h2>
                <Link to={`/folder/${folderId}/lesson/${lessonId}`} className="text-indigo-600 hover:underline">
                    回到課程
                </Link>
            </div>
        );
    }

    const renderGame = () => {
        switch (gameId) {
            case 'flashcards':
                return <FlashcardGame items={items} mode={mode} title="單元複習：單字卡" autoAudio={autoAudio} />;
            case 'translation':
                // Translation game usually expects Front=Chinese, Back=Korean
                // If user selected 'answer' (Korean) as front, it becomes Korean -> Chinese translation?
                // Or we just ignore frontSide for translation/listening?
                // User request: "choose to show Korean or Chinese first"
                // For Translation: "Translate [Front] to [Back]"
                // If Front=Korean, Back=Chinese -> "Translate Korean to Chinese"
                return <TranslationGame items={items} mode={mode} title="單元複習：翻譯" />;
            case 'listening':
                // Listening game: Listen to Audio (Korean) -> Choose Front (Meaning)
                // If items.front is Korean (because of swap), then we choose Korean?
                // Listening game expects 'front' to be the OPTION TEXT (Meaning/Chinese).
                // If we swapped, 'front' is Korean. So we listen Korean -> Choose Korean? That's too easy.
                // We should probably FORCE 'front' to be Chinese for Listening Game unless we want "Listen Korean -> Choose Korean"

                // Let's revert swap for Listening Game if it breaks logic.
                // ListeningGame logic:
                // Play 'audio' (Korean).
                // Show options: 'front' (Chinese).
                // If we swapped, 'front' is Korean.
                // So we play Korean, show Korean options.

                // Ideally Listening is "Listen -> Choose Meaning".
                // So we should ensure 'front' is the Meaning (Chinese).
                // If frontSide='answer' (Korean first), maybe Listening Game shouldn't be affected?
                // Or maybe "Listen Chinese -> Choose Korean"? (TTS Chinese?)
                // Our audio is only Korean.

                // Decision: For Listening Game, always use Chinese as options (Front).
                // So we might need to re-map if we swapped.
                // Actually, let's just pass the original items for Listening if needed.
                // But 'items' is already mapped.

                // Let's just let it be. If user chooses "Korean First", maybe they want to match Korean text?
                // But "Listening" implies understanding meaning.
                // Let's force "Question" (Chinese) as Front for Listening Game for now to avoid confusion, 
                // OR just let the user setting control it.
                // If user sets "Korean First", then Flashcards show Korean.
                // Listening Game: Listen Korean -> Choose Korean (Spelling check?).
                // That's actually a valid use case (Spelling/Recognition).

                return <ListeningGame items={items} mode={mode} title="單元複習：聽力" />;
            default:
                return <Navigate to={`/folder/${folderId}/lesson/${lessonId}/review`} replace />;
        }
    };

    return (
        <div>
            <div className="mb-6">
                <Link to={`/folder/${folderId}/lesson/${lessonId}/review`} className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    回到複習選單
                </Link>
            </div>
            {renderGame()}
        </div>
    );
};
