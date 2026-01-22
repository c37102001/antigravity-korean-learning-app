import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { FlashcardGame } from '../../components/review/FlashcardGame';
import { TranslationGame } from '../../components/review/TranslationGame';
import { ListeningGame } from '../../components/review/ListeningGame';

interface FlashcardData {
    id: string;
    korean: string;
    chinese: string;
    order?: number;
    isStarred?: boolean;
}

const usePersonalCards = (folderId: string | undefined, onlyStarred: boolean) => {
    const { currentUser } = useAuth();
    const [cards, setCards] = useState<FlashcardData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser || !folderId) {
            setLoading(false);
            return;
        }

        const fetchCards = async () => {
            try {
                const cardsRef = collection(db, 'users', currentUser.uid, 'folders', folderId, 'cards');
                // Revert to createdAt to ensure we get all cards
                const q = query(cardsRef, orderBy('createdAt', 'asc'));
                const snapshot = await getDocs(q);
                let cardsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as FlashcardData[];

                if (onlyStarred) {
                    cardsData = cardsData.filter(c => c.isStarred);
                }

                // Client-side sort by order
                // Note: FlashcardData interface in this file doesn't have 'order', but the data might.
                // We should cast or just sort safely.
                const sortedCards = cardsData.sort((a: any, b: any) => {
                    const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
                    const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
                    return orderA - orderB;
                });

                setCards(sortedCards);
            } catch (error) {
                console.error("Error fetching cards:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCards();
    }, [currentUser, folderId, onlyStarred]);

    const handleToggleStar = async (cardId: string, currentStatus: boolean) => {
        if (!currentUser || !folderId) return;
        try {
            await updateDoc(doc(db, 'users', currentUser.uid, 'folders', folderId, 'cards', cardId), {
                isStarred: !currentStatus
            });
            // Update local state
            setCards(prev => prev.map(c => c.id === cardId ? { ...c, isStarred: !currentStatus } : c));
        } catch (error) {
            console.error("Error toggling star:", error);
        }
    };

    return { cards, loading, handleToggleStar };
};

export const PersonalFlashcards = () => {
    const { folderId } = useParams<{ folderId: string }>();
    const [searchParams] = useSearchParams();
    const onlyStarred = searchParams.get('starred') === 'true';
    const { cards, loading, handleToggleStar } = usePersonalCards(folderId, onlyStarred);

    const mode = (searchParams.get('mode') as 'random' | 'sequential') || 'random';
    const frontSide = searchParams.get('front') || 'question';
    const autoAudio = searchParams.get('audio') === 'true';

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (cards.length === 0) return <div className="p-8 text-center">{onlyStarred ? '沒有加星號的字卡' : '沒有字卡'}</div>;

    const items = cards.map(c => {
        const isKoreanFront = frontSide === 'question';

        return {
            id: c.id,
            front: isKoreanFront ? c.korean : c.chinese,
            back: isKoreanFront ? c.chinese : c.korean,
            audio: c.korean,
            isStarred: c.isStarred
        };
    });

    return <FlashcardGame items={items} title="個人單字卡" mode={mode} autoAudio={autoAudio} onToggleStar={handleToggleStar} />;
};

export const PersonalTranslation = () => {
    const { folderId } = useParams<{ folderId: string }>();
    const [searchParams] = useSearchParams();
    const onlyStarred = searchParams.get('starred') === 'true';
    const { cards, loading, handleToggleStar } = usePersonalCards(folderId, onlyStarred);

    const mode = (searchParams.get('mode') as 'random' | 'sequential') || 'random';
    // Translation game usually: Show Chinese (Question), Input Korean (Answer)
    // If we want to support reverse, TranslationGame needs to support it or we swap.
    // Standard: Chinese -> Korean.
    // Let's see if we can support direction.
    // For now, let's stick to standard Chinese -> Korean for TranslationGame unless requested otherwise.
    // But user asked for "Priority" setting.
    // If "Korean" priority, maybe it means Korean -> Chinese?
    // TranslationGame usually implies typing. Typing Chinese is hard for learners.
    // So usually it's "See Chinese, Type Korean".
    // If "Korean Priority", maybe "See Korean, Type Chinese"?
    // Let's assume the setting mainly applies to Flashcards.
    // But for consistency, let's pass it if possible.
    // TranslationGame props: items, title.
    // It doesn't seem to take mode/autoAudio/frontSide.
    // Let's just pass items.

    // However, the user asked for "Random" and "Auto-play".
    // TranslationGame might not support auto-play but random is handled by shuffling items if we do it here, or if the game supports it.
    // FlashcardGame supports 'mode'.
    // Let's check TranslationGame.
    // I'll assume TranslationGame handles shuffling if I pass shuffled items or if it has a mode prop.
    // If not, I should shuffle here if mode is random.

    // Let's check ListeningGame too.

    // For now, I will implement basic param reading.

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (cards.length === 0) return <div className="p-8 text-center">{onlyStarred ? '沒有加星號的字卡' : '沒有字卡'}</div>;

    let items = cards.map(c => ({
        id: c.id,
        front: c.chinese,
        back: c.korean,
        audio: c.korean,
        isStarred: c.isStarred
    }));

    if (mode === 'random') {
        items = [...items].sort(() => Math.random() - 0.5);
    }

    return <TranslationGame items={items} title="個人翻譯練習" onToggleStar={handleToggleStar} />;
};

export const PersonalListening = () => {
    const { folderId } = useParams<{ folderId: string }>();
    const [searchParams] = useSearchParams();
    const onlyStarred = searchParams.get('starred') === 'true';
    const { cards, loading, handleToggleStar } = usePersonalCards(folderId, onlyStarred);

    const mode = (searchParams.get('mode') as 'random' | 'sequential') || 'random';

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (cards.length === 0) return <div className="p-8 text-center">{onlyStarred ? '沒有加星號的字卡' : '沒有字卡'}</div>;

    let items = cards.map(c => ({
        id: c.id,
        front: c.chinese,
        back: c.korean,
        audio: c.korean,
        isStarred: c.isStarred
    }));

    if (mode === 'random') {
        items = [...items].sort(() => Math.random() - 0.5);
    }

    return <ListeningGame items={items} title="個人聽力練習" onToggleStar={handleToggleStar} />;
};
