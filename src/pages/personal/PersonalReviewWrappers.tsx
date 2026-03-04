import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { FlashcardGame } from '../../components/review/FlashcardGame';
import { TranslationGame } from '../../components/review/TranslationGame';
import { ListeningGame } from '../../components/review/ListeningGame';
import { ConversationGame } from '../../components/review/ConversationGame';

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
                const q = query(cardsRef, orderBy('createdAt', 'asc'));
                const snapshot = await getDocs(q);
                let cardsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as FlashcardData[];

                if (onlyStarred) {
                    cardsData = cardsData.filter(c => c.isStarred);
                }

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
            setCards(prev => {
                const updated = prev.map(c => c.id === cardId ? { ...c, isStarred: !currentStatus } : c);
                return onlyStarred ? updated.filter(c => c.isStarred) : updated;
            });
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
    const frontSide = (searchParams.get('front') as 'question' | 'answer') || 'question';
    const autoAudio = searchParams.get('audio') === 'true';
    const flipDelay = parseInt(searchParams.get('flipDelay') || '0', 10);

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

    return <FlashcardGame items={items} title="個人單字卡" mode={mode} autoAudio={autoAudio} flipDelay={flipDelay} onToggleStar={handleToggleStar} />;
};

export const PersonalTranslation = () => {
    const { folderId } = useParams<{ folderId: string }>();
    const [searchParams] = useSearchParams();
    const onlyStarred = searchParams.get('starred') === 'true';
    const { cards, loading, handleToggleStar } = usePersonalCards(folderId, onlyStarred);

    const mode = (searchParams.get('mode') as 'random' | 'sequential') || 'random';
    const frontSide = (searchParams.get('front') as 'question' | 'answer') || 'question';
    const autoAudio = searchParams.get('audio') === 'true';

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (cards.length === 0) return <div className="p-8 text-center">{onlyStarred ? '沒有加星號的字卡' : '沒有字卡'}</div>;

    const showKoreanFirst = frontSide === 'question';
    const items = cards.map(c => ({
        id: c.id,
        front: showKoreanFirst ? c.korean : c.chinese,
        back: showKoreanFirst ? c.chinese : c.korean,
        audio: c.korean,
        isStarred: c.isStarred
    }));

    return (
        <TranslationGame
            items={items}
            mode={mode}
            title="個人翻譯練習"
            autoAudio={autoAudio}
            onToggleStar={handleToggleStar}
        />
    );
};

export const PersonalListening = () => {
    const { folderId } = useParams<{ folderId: string }>();
    const [searchParams] = useSearchParams();
    const onlyStarred = searchParams.get('starred') === 'true';
    const { cards, loading, handleToggleStar } = usePersonalCards(folderId, onlyStarred);

    const mode = (searchParams.get('mode') as 'random' | 'sequential') || 'random';
    const frontSide = (searchParams.get('front') as 'question' | 'answer') || 'question';
    const autoAudio = searchParams.get('audio') === 'true';

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (cards.length === 0) return <div className="p-8 text-center">{onlyStarred ? '沒有加星號的字卡' : '沒有字卡'}</div>;

    const showKoreanFirst = frontSide === 'question';
    const items = cards.map(c => ({
        id: c.id,
        front: showKoreanFirst ? c.korean : c.chinese,
        back: showKoreanFirst ? c.chinese : c.korean,
        audio: c.korean,
        isStarred: c.isStarred
    }));

    return (
        <ListeningGame
            items={items}
            mode={mode}
            title="個人聽力練習"
            autoAudio={autoAudio}
            onToggleStar={handleToggleStar}
        />
    );
};

export const PersonalConversation = () => {
    const { folderId } = useParams<{ folderId: string }>();
    const [searchParams] = useSearchParams();
    const onlyStarred = searchParams.get('starred') === 'true';
    const { cards, loading, handleToggleStar } = usePersonalCards(folderId, onlyStarred);

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (cards.length === 0) return <div className="p-8 text-center">{onlyStarred ? '沒有加星號的字卡' : '沒有字卡'}</div>;

    const items = cards.map(c => ({
        id: c.id,
        korean: c.korean,
        chinese: c.chinese,
        audio: c.korean,
        isStarred: c.isStarred
    }));

    return (
        <ConversationGame
            items={items}
            title="個人會話練習"
            onToggleStar={handleToggleStar}
        />
    );
};
