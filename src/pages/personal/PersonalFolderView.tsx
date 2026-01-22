import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, orderBy, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Plus, Trash2, PlayCircle, BookOpen, Headphones, Shuffle, ListOrdered, Volume2, Pencil, Save, X, GripVertical, FileText, Star } from 'lucide-react';
import { Reorder } from 'framer-motion';

interface FlashcardData {
    id: string;
    korean: string;
    chinese: string;
    createdAt: any;
    order?: number;
    isStarred?: boolean;
}

export const PersonalFolderView = () => {
    const { folderId } = useParams<{ folderId: string }>();
    const { currentUser } = useAuth();
    const [cards, setCards] = useState<FlashcardData[]>([]);
    const [folderName, setFolderName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState('');
    const [newKorean, setNewKorean] = useState('');
    const [newChinese, setNewChinese] = useState('');

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editKorean, setEditKorean] = useState('');
    const [editChinese, setEditChinese] = useState('');
    const [isReordering, setIsReordering] = useState(false);
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [batchJson, setBatchJson] = useState('');
    const [batchError, setBatchError] = useState('');

    // Review Settings
    const [mode, setMode] = useState<'random' | 'sequential'>('random');
    const [frontSide, setFrontSide] = useState<'question' | 'answer'>('question');
    const [autoAudio, setAutoAudio] = useState(true);
    const [onlyStarred, setOnlyStarred] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser || !folderId) return;

        // Fetch folder name
        const fetchFolder = async () => {
            const folderDoc = await getDoc(doc(db, 'users', currentUser.uid, 'folders', folderId));
            if (folderDoc.exists()) {
                const name = folderDoc.data().name;
                setFolderName(name);
                setEditName(name);
            } else {
                navigate('/personal');
            }
        };
        fetchFolder();

        // Subscribe to cards
        const cardsRef = collection(db, 'users', currentUser.uid, 'folders', folderId, 'cards');
        // Revert to createdAt to ensure we get all cards
        const q = query(cardsRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const cardsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as FlashcardData[];

            // Migration: If cards don't have 'order', assign it based on index
            const cardsToUpdate = cardsData.filter(c => c.order === undefined);
            if (cardsToUpdate.length > 0) {
                // We need to sort them by createdAt first to preserve original order
                // But wait, the query is by 'order'. If 'order' is missing, the order might be undefined.
                // So we should probably fetch by createdAt first if we detect missing orders?
                // Or just trust the current order?
                // Since we changed the query to 'order', cards without order might be at the top or bottom or random.
                // Let's check if we need to migrate.

                // If we have cards but some are missing order, we should fix it.
                // Ideally, we should run a one-off migration. 
                // But here, we can just check if ANY card is missing order.

                // To be safe, let's just assign order to all cards if any is missing, 
                // based on their current sorted order (which might be messy if we query by 'order' and it's missing).
                // Actually, if 'order' is missing, we should probably query by 'createdAt' to get the right initial order.
                // But we can't switch queries easily in onSnapshot.

                // Let's do a separate check.
                if (cardsToUpdate.length > 0) {
                    const batch = writeBatch(db);
                    // We want to preserve creation order for migration
                    // So let's sort locally by createdAt
                    const sortedByTime = [...cardsData].sort((a, b) => {
                        const timeA = a.createdAt?.seconds || 0;
                        const timeB = b.createdAt?.seconds || 0;
                        return timeA - timeB;
                    });

                    sortedByTime.forEach((card, index) => {
                        if (card.order !== index) {
                            const cardRef = doc(db, 'users', currentUser.uid, 'folders', folderId, 'cards', card.id);
                            batch.update(cardRef, { order: index });
                        }
                    });

                    if (sortedByTime.some((c, i) => c.order !== i)) {
                        console.log("Migrating cards to include order field...");
                        await batch.commit();
                        return; // The snapshot will fire again
                    }
                }
            }

            // Client-side sort by order
            const sortedCards = cardsData.sort((a, b) => {
                const orderA = a.order ?? Number.MAX_SAFE_INTEGER; // Put undefined at the end
                const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
                return orderA - orderB;
            });

            setCards(sortedCards);
        });

        return unsubscribe;
    }, [currentUser, folderId, navigate]);

    const handleAddCard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKorean.trim() || !newChinese.trim() || !currentUser || !folderId) return;

        try {
            // Assign order as the last one
            const newOrder = cards.length;

            await addDoc(collection(db, 'users', currentUser.uid, 'folders', folderId, 'cards'), {
                korean: newKorean,
                chinese: newChinese,
                createdAt: serverTimestamp(),
                order: newOrder
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

    const handleToggleStar = async (cardId: string, currentStatus: boolean) => {
        if (!currentUser || !folderId) return;
        try {
            await updateDoc(doc(db, 'users', currentUser.uid, 'folders', folderId, 'cards', cardId), {
                isStarred: !currentStatus
            });
        } catch (error) {
            console.error("Error toggling star:", error);
        }
    };

    const playAudio = (text: string) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.rate = 0.8;

        const voices = window.speechSynthesis.getVoices();
        const targetVoice = voices.find(v => v.name.includes('Yuna'))
            || voices.find(v => v.lang.includes('ko') || v.lang.includes('KR'));
        if (targetVoice) utterance.voice = targetVoice;

        window.speechSynthesis.speak(utterance);
    };

    const handleStartEdit = (card: FlashcardData) => {
        setEditingId(card.id);
        setEditKorean(card.korean);
        setEditChinese(card.chinese);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditKorean('');
        setEditChinese('');
    };

    const handleUpdateCard = async (cardId: string) => {
        if (!currentUser || !folderId || !editKorean.trim() || !editChinese.trim()) return;

        try {
            await updateDoc(doc(db, 'users', currentUser.uid, 'folders', folderId, 'cards', cardId), {
                korean: editKorean,
                chinese: editChinese
            });
            setEditingId(null);
        } catch (error) {
            console.error("Error updating card:", error);
        }
    };

    const handleSaveOrder = async () => {
        if (!currentUser || !folderId) return;

        try {
            const batch = writeBatch(db);
            cards.forEach((card, index) => {
                if (card.order !== index) {
                    const cardRef = doc(db, 'users', currentUser.uid, 'folders', folderId, 'cards', card.id);
                    batch.update(cardRef, { order: index });
                }
            });
            await batch.commit();
        } catch (error) {
            console.error("Error saving order:", error);
        }
    };

    const toggleReorder = async () => {
        if (isReordering) {
            // Saving...
            await handleSaveOrder();
        }
        setIsReordering(!isReordering);
    };

    const handleUpdateFolderName = async () => {
        if (!currentUser || !folderId || !editName.trim()) return;

        try {
            await updateDoc(doc(db, 'users', currentUser.uid, 'folders', folderId), {
                name: editName.trim()
            });
            setFolderName(editName.trim());
            setIsEditingName(false);
        } catch (error) {
            console.error("Error updating folder name:", error);
        }
    };

    const handleBatchAdd = async () => {
        if (!batchJson.trim() || !currentUser || !folderId) return;
        setBatchError('');

        try {
            const parsed = JSON.parse(batchJson);
            if (!parsed.data || !Array.isArray(parsed.data)) {
                setBatchError('格式錯誤：缺少 data 陣列');
                return;
            }

            const batch = writeBatch(db);
            let currentOrder = cards.length;

            for (const item of parsed.data) {
                if (!item.ko || !item.zh) {
                    setBatchError('格式錯誤：每個項目必須包含 ko 和 zh');
                    return;
                }

                const newCardRef = doc(collection(db, 'users', currentUser.uid, 'folders', folderId, 'cards'));
                batch.set(newCardRef, {
                    korean: item.ko,
                    chinese: item.zh,
                    createdAt: serverTimestamp(),
                    order: currentOrder++
                });
            }

            await batch.commit();
            setIsBatchModalOpen(false);
            setBatchJson('');
            setBatchError('');
        } catch (e) {
            console.error("Batch add error:", e);
            setBatchError('JSON 解析錯誤，請檢查格式是否正確');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <Link to="/personal" className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-4">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    回個人學習區
                </Link>
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                    <div className="flex-1">
                        {isEditingName ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-3xl font-bold text-gray-900 border px-3 py-1"
                                    autoFocus
                                />
                                <button
                                    onClick={handleUpdateFolderName}
                                    disabled={!editName.trim()}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                                >
                                    <Save className="h-6 w-6" />
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditingName(false);
                                        setEditName(folderName);
                                    }}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 group">
                                <h1 className="text-3xl font-bold text-gray-900">{folderName}</h1>
                                <button
                                    onClick={() => setIsEditingName(true)}
                                    className="p-1.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
                                >
                                    <Pencil className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                        <p className="mt-1 text-sm text-gray-500">共 {cards.length} 張字卡</p>
                    </div>

                    {cards.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                            <Link
                                to={`/personal/folder/${folderId}/review/flashcards?mode=${mode}&front=${frontSide}&audio=${autoAudio}&starred=${onlyStarred}`}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                <BookOpen className="h-4 w-4 mr-2" />
                                單字卡
                            </Link>
                            <Link
                                to={`/personal/folder/${folderId}/review/translation?mode=${mode}&front=${frontSide}&audio=${autoAudio}&starred=${onlyStarred}`}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                            >
                                <PlayCircle className="h-4 w-4 mr-2" />
                                翻譯練習
                            </Link>
                            <Link
                                to={`/personal/folder/${folderId}/review/listening?mode=${mode}&front=${frontSide}&audio=${autoAudio}&starred=${onlyStarred}`}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                            >
                                <Headphones className="h-4 w-4 mr-2" />
                                聽力練習
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Review Settings Panel */}
            {cards.length > 0 && (
                <div className="mb-8 bg-white rounded-lg shadow p-6 border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">複習設定</h3>
                    <div className="flex flex-wrap gap-6">
                        {/* Order Setting */}
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-medium text-gray-500">出題順序</span>
                            <div className="flex rounded-lg bg-gray-100 p-1">
                                <button
                                    onClick={() => setMode('random')}
                                    className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${mode === 'random' ? 'bg-white text-indigo-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Shuffle className="h-4 w-4" />
                                    隨機
                                </button>
                                <button
                                    onClick={() => setMode('sequential')}
                                    className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${mode === 'sequential' ? 'bg-white text-indigo-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <ListOrdered className="h-4 w-4" />
                                    順序
                                </button>
                            </div>
                        </div>

                        {/* Front Side Setting */}
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-medium text-gray-500">優先顯示 (單字卡)</span>
                            <div className="flex rounded-lg bg-gray-100 p-1">
                                <button
                                    onClick={() => setFrontSide('question')}
                                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${frontSide === 'question' ? 'bg-white text-indigo-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    韓文
                                </button>
                                <button
                                    onClick={() => setFrontSide('answer')}
                                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${frontSide === 'answer' ? 'bg-white text-indigo-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    中文
                                </button>
                            </div>
                        </div>


                        {/* Audio Setting */}
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-medium text-gray-500">語音設定</span>
                            <div className="flex rounded-lg bg-gray-100 p-1">
                                <button
                                    onClick={() => setAutoAudio(true)}
                                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${autoAudio ? 'bg-white text-indigo-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    自動播放
                                </button>
                                <button
                                    onClick={() => setAutoAudio(false)}
                                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${!autoAudio ? 'bg-white text-indigo-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    手動播放
                                </button>
                            </div>
                        </div>

                        {/* Starred Setting */}
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-medium text-gray-500">篩選</span>
                            <div className="flex rounded-lg bg-gray-100 p-1">
                                <button
                                    onClick={() => setOnlyStarred(false)}
                                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${!onlyStarred ? 'bg-white text-indigo-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    全部
                                </button>
                                <button
                                    onClick={() => setOnlyStarred(true)}
                                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${onlyStarred ? 'bg-white text-indigo-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    僅星號
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Card Form */}
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

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-gray-300"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">或</span>
                                <div className="flex-grow border-t border-gray-300"></div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsBatchModalOpen(true)}
                                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                批次加入 (JSON)
                            </button>
                        </form>
                    </div>
                </div>

                {/* Batch Modal */}
                {isBatchModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsBatchModalOpen(false)}></div>

                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                                批次加入字卡
                                            </h3>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-500 mb-2">
                                                    請貼上 JSON 格式的資料。格式如下：
                                                </p>
                                                <pre className="bg-gray-100 p-2 rounded text-xs text-gray-600 mb-4 overflow-x-auto">
                                                    {`{
  "data": [
    { "ko": "韓文", "zh": "中文" },
    ...
  ]
}`}
                                                </pre>
                                                <textarea
                                                    value={batchJson}
                                                    onChange={(e) => setBatchJson(e.target.value)}
                                                    className="w-full h-64 p-2 border border-gray-300 rounded-md font-mono text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                    placeholder='{"data": [{"ko": "...", "zh": "..."}]}'
                                                ></textarea>
                                                {batchError && (
                                                    <p className="mt-2 text-sm text-red-600">
                                                        {batchError}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        onClick={handleBatchAdd}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        加入
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsBatchModalOpen(false)}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        取消
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cards List */}
                <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">字卡列表</h3>
                        <button
                            onClick={toggleReorder}
                            className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm ${isReordering
                                ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                                : 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200'
                                }`}
                        >
                            {isReordering ? (
                                <>
                                    <Save className="h-4 w-4 mr-1" />
                                    儲存順序
                                </>
                            ) : (
                                <>
                                    <ListOrdered className="h-4 w-4 mr-1" />
                                    調整順序
                                </>
                            )}
                        </button>
                    </div>

                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        {isReordering ? (
                            <Reorder.Group axis="y" values={cards} onReorder={setCards} className="divide-y divide-gray-200 list-none p-0 m-0">
                                {cards.map((card) => (
                                    <Reorder.Item key={card.id} value={card} className="bg-white">
                                        <div className="px-6 py-4 flex items-center justify-between cursor-move hover:bg-gray-50">
                                            <div className="flex items-center gap-4 flex-1">
                                                <GripVertical className="h-5 w-5 text-gray-400" />
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-xl font-medium text-indigo-600">{card.korean}</p>
                                                    <p className="text-gray-500">{card.chinese}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {cards.map((card) => (
                                    <li
                                        key={card.id}
                                        className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between group transition-colors"
                                    >
                                        {editingId === card.id ? (
                                            <div className="flex-1 flex items-center gap-4 mr-4">
                                                <div className="flex-1 grid grid-cols-1 gap-2">
                                                    <input
                                                        type="text"
                                                        value={editKorean}
                                                        onChange={(e) => setEditKorean(e.target.value)}
                                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-2 py-1"
                                                        placeholder="韓文"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={editChinese}
                                                        onChange={(e) => setEditChinese(e.target.value)}
                                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-2 py-1"
                                                        placeholder="中文"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleUpdateCard(card.id)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                                                    >
                                                        <Save className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                                                    >
                                                        <X className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div
                                                    className="flex-1 min-w-0 mr-4 cursor-pointer"
                                                    onClick={() => playAudio(card.korean)}
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-xl font-medium text-indigo-600 break-words whitespace-pre-wrap">{card.korean}</p>
                                                            <Volume2 className="h-4 w-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                        <p className="text-gray-500 break-words whitespace-pre-wrap">{card.chinese}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleStar(card.id, card.isStarred || false);
                                                        }}
                                                        className={`flex-shrink-0 p-2 rounded-full hover:bg-yellow-50 ${card.isStarred ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
                                                    >
                                                        <Star className={`h-5 w-5 ${card.isStarred ? 'fill-current' : ''}`} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStartEdit(card);
                                                        }}
                                                        className="flex-shrink-0 p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50"
                                                    >
                                                        <Pencil className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteCard(card.id);
                                                        }}
                                                        className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))}
                                {cards.length === 0 && (
                                    <li className="px-6 py-12 text-center text-gray-500">
                                        這個資料夾還沒有字卡，趕快新增一些吧！
                                    </li>
                                )}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
