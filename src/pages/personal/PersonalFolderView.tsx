import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Plus, Trash2, PlayCircle, BookOpen, Headphones } from 'lucide-react';

interface FlashcardData {
    id: string;
    korean: string;
    chinese: string;
    createdAt: any;
}

export const PersonalFolderView = () => {
    const { folderId } = useParams<{ folderId: string }>();
    const { currentUser } = useAuth();
    const [cards, setCards] = useState<FlashcardData[]>([]);
    const [folderName, setFolderName] = useState('');
    const [newKorean, setNewKorean] = useState('');
    const [newChinese, setNewChinese] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser || !folderId) return;

        // Fetch folder name
        const fetchFolder = async () => {
            const folderDoc = await getDoc(doc(db, 'users', currentUser.uid, 'folders', folderId));
            if (folderDoc.exists()) {
                setFolderName(folderDoc.data().name);
            } else {
                navigate('/personal');
            }
        };
        fetchFolder();

        // Subscribe to cards
        const cardsRef = collection(db, 'users', currentUser.uid, 'folders', folderId, 'cards');
        const q = query(cardsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const cardsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as FlashcardData[];
            setCards(cardsData);
        });

        return unsubscribe;
    }, [currentUser, folderId, navigate]);

    const handleAddCard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKorean.trim() || !newChinese.trim() || !currentUser || !folderId) return;

        try {
            await addDoc(collection(db, 'users', currentUser.uid, 'folders', folderId, 'cards'), {
                korean: newKorean,
                chinese: newChinese,
                createdAt: serverTimestamp()
            });
            setNewKorean('');
            setNewChinese('');
        } catch (error) {
            console.error("Error adding card:", error);
        }
    };

    const handleDeleteCard = async (cardId: string) => {
        if (!currentUser || !folderId) return;
        try {
            await deleteDoc(doc(db, 'users', currentUser.uid, 'folders', folderId, 'cards', cardId));
        } catch (error) {
            console.error("Error deleting card:", error);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <Link to="/personal" className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-4">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    回個人學習區
                </Link>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{folderName}</h1>
                        <p className="mt-1 text-sm text-gray-500">共 {cards.length} 張字卡</p>
                    </div>

                    {cards.length > 0 && (
                        <div className="flex space-x-3">
                            <Link
                                to={`/personal/folder/${folderId}/review/flashcards`}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                <BookOpen className="h-4 w-4 mr-2" />
                                單字卡
                            </Link>
                            <Link
                                to={`/personal/folder/${folderId}/review/translation`}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                            >
                                <PlayCircle className="h-4 w-4 mr-2" />
                                翻譯練習
                            </Link>
                            <Link
                                to={`/personal/folder/${folderId}/review/listening`}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                            >
                                <Headphones className="h-4 w-4 mr-2" />
                                聽力練習
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Card Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow p-6 sticky top-8">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">新增字卡</h3>
                        <form onSubmit={handleAddCard} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">韓文</label>
                                <input
                                    type="text"
                                    value={newKorean}
                                    onChange={(e) => setNewKorean(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
                                    placeholder="例如：사과"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">中文</label>
                                <input
                                    type="text"
                                    value={newChinese}
                                    onChange={(e) => setNewChinese(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
                                    placeholder="例如：蘋果"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!newKorean.trim() || !newChinese.trim()}
                                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                新增字卡
                            </button>
                        </form>
                    </div>
                </div>

                {/* Cards List */}
                <div className="lg:col-span-2">
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {cards.map((card) => (
                                <li key={card.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xl font-medium text-indigo-600 truncate">{card.korean}</p>
                                        </div>
                                        <p className="mt-1 text-gray-500">{card.chinese}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteCard(card.id)}
                                        className="ml-4 p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </li>
                            ))}
                            {cards.length === 0 && (
                                <li className="px-6 py-12 text-center text-gray-500">
                                    這個資料夾還沒有字卡，趕快新增一些吧！
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
