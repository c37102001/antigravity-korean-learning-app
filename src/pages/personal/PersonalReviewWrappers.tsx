import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { FlashcardGame } from '../../components/review/FlashcardGame';
import { TranslationGame } from '../../components/review/TranslationGame';
import { ListeningGame } from '../../components/review/ListeningGame';

interface FlashcardData {
    id: string;
    korean: string;
    chinese: string;
}

const usePersonalCards = (folderId: string | undefined) => {
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
                const snapshot = await getDocs(cardsRef);
                const cardsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as FlashcardData[];
                setCards(cardsData);
            } catch (error) {
                console.error("Error fetching cards:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCards();
    }, [currentUser, folderId]);

    return { cards, loading };
};

export const PersonalFlashcards = () => {
    const { folderId } = useParams<{ folderId: string }>();
    const { cards, loading } = usePersonalCards(folderId);

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (cards.length === 0) return <div className="p-8 text-center">沒有字卡</div>;

    const items = cards.map(c => ({
        id: c.id,
        front: c.korean,
        back: c.chinese,
        audio: c.korean
    }));

    return <FlashcardGame items={items} title="個人單字卡" />;
};

export const PersonalTranslation = () => {
    const { folderId } = useParams<{ folderId: string }>();
    const { cards, loading } = usePersonalCards(folderId);

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (cards.length === 0) return <div className="p-8 text-center">沒有字卡</div>;

    const items = cards.map(c => ({
        id: c.id,
        front: c.chinese,
        back: c.korean,
        audio: c.korean
    }));

    return <TranslationGame items={items} title="個人翻譯練習" />;
};

export const PersonalListening = () => {
    const { folderId } = useParams<{ folderId: string }>();
    const { cards, loading } = usePersonalCards(folderId);

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (cards.length === 0) return <div className="p-8 text-center">沒有字卡</div>;

    const items = cards.map(c => ({
        id: c.id,
        front: c.chinese,
        back: c.korean,
        audio: c.korean
    }));

    return <ListeningGame items={items} title="個人聽力練習" />;
};
