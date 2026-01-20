import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Folder, Plus, Trash2, LogOut, BookOpen } from 'lucide-react';
import { auth } from '../../lib/firebase';

interface FolderData {
    id: string;
    name: string;
    createdAt: any;
}

export const PersonalDashboard = () => {
    const { currentUser } = useAuth();
    const [folders, setFolders] = useState<FolderData[]>([]);
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        const foldersRef = collection(db, 'users', currentUser.uid, 'folders');
        const q = query(foldersRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const foldersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as FolderData[];
            setFolders(foldersData);
        });

        return unsubscribe;
    }, [currentUser, navigate]);

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim() || !currentUser) return;

        try {
            await addDoc(collection(db, 'users', currentUser.uid, 'folders'), {
                name: newFolderName,
                createdAt: serverTimestamp()
            });
            setNewFolderName('');
            setIsCreating(false);
        } catch (error) {
            console.error("Error creating folder:", error);
        }
    };

    const handleDeleteFolder = async (folderId: string) => {
        if (!currentUser || !window.confirm('確定要刪除這個資料夾嗎？裡面的所有字卡也會被刪除。')) return;

        try {
            await deleteDoc(doc(db, 'users', currentUser.uid, 'folders', folderId));
        } catch (error) {
            console.error("Error deleting folder:", error);
        }
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigate('/login');
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">個人字卡學習區</h1>
                    <p className="mt-1 text-sm text-gray-500">管理你的專屬學習資料夾</p>
                </div>
                <div className="flex space-x-4">
                    <Link to="/" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        <BookOpen className="h-4 w-4 mr-2" />
                        回課程首頁
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        登出
                    </button>
                </div>
            </div>

            {/* Create Folder Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                {!isCreating ? (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center text-indigo-600 hover:text-indigo-500"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        <span className="font-medium">新增資料夾</span>
                    </button>
                ) : (
                    <form onSubmit={handleCreateFolder} className="flex gap-4">
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="輸入資料夾名稱"
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!newFolderName.trim()}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                        >
                            建立
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsCreating(false)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            取消
                        </button>
                    </form>
                )}
            </div>

            {/* Folders Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {folders.map((folder) => (
                    <div
                        key={folder.id}
                        className="relative group bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
                    >
                        <div className="flex items-start justify-between">
                            <Link to={`/personal/folder/${folder.id}`} className="flex-1 flex items-center">
                                <Folder className="h-10 w-10 text-indigo-500 mr-4" />
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600">
                                        {folder.name}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        點擊進入學習
                                    </p>
                                </div>
                            </Link>
                            <button
                                onClick={() => handleDeleteFolder(folder.id)}
                                className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                                title="刪除資料夾"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {folders.length === 0 && !isCreating && (
                <div className="text-center py-12">
                    <Folder className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">沒有資料夾</h3>
                    <p className="mt-1 text-sm text-gray-500">開始建立你的第一個學習資料夾吧！</p>
                </div>
            )}
        </div>
    );
};
