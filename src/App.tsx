import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { FolderView } from './pages/FolderView';
import { DayView } from './pages/DayView';
import { ReviewHub } from './pages/ReviewHub';
import { FlashcardGame } from './components/review/FlashcardGame';
import { TranslationGame } from './components/review/TranslationGame';
import { ListeningGame } from './components/review/ListeningGame';
import { LessonReviewHub } from './pages/LessonReviewHub';
import { LessonReviewGame } from './pages/LessonReviewGame';
import { vocabulary } from './data/vocabulary';

// Adapters for Global Review (Vocabulary)
const GlobalFlashcards = () => {
  // Flashcards: Korean -> Chinese
  const items = vocabulary.map(v => ({
    id: v.id,
    front: v.korean,
    back: v.chinese,
    audio: v.korean
  }));
  return <FlashcardGame items={items} title="單字卡" />;
};

const GlobalTranslation = () => {
  // Translation: Chinese -> Korean
  const items = vocabulary.map(v => ({
    id: v.id,
    front: v.chinese,
    back: v.korean,
    audio: v.korean
  }));
  return <TranslationGame items={items} title="翻譯練習" />;
};

const GlobalListening = () => {
  // Listening: Listen Korean -> Choose Chinese
  const items = vocabulary.map(v => ({
    id: v.id,
    front: v.chinese, // Option text
    back: v.korean,
    audio: v.korean   // Audio to play
  }));
  return <ListeningGame items={items} title="聽力練習" />;
};

import { AuthProvider } from './contexts/AuthContext';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { PersonalDashboard } from './pages/personal/PersonalDashboard';
import { PersonalFolderView } from './pages/personal/PersonalFolderView';
import { PersonalFlashcards, PersonalTranslation, PersonalListening } from './pages/personal/PersonalReviewWrappers';

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />

            {/* Personal Learning Area */}
            <Route path="personal" element={<PersonalDashboard />} />
            <Route path="personal/folder/:folderId" element={<PersonalFolderView />} />
            <Route path="personal/folder/:folderId/review/flashcards" element={<PersonalFlashcards />} />
            <Route path="personal/folder/:folderId/review/translation" element={<PersonalTranslation />} />
            <Route path="personal/folder/:folderId/review/listening" element={<PersonalListening />} />
            <Route path="folder/:folderId" element={<FolderView />} />
            <Route path="folder/:folderId/lesson/:lessonId" element={<DayView />} />

            {/* Unit Review Routes */}
            <Route path="folder/:folderId/lesson/:lessonId/review" element={<LessonReviewHub />} />
            <Route path="folder/:folderId/lesson/:lessonId/review/:gameId" element={<LessonReviewGame />} />

            {/* Global Review Routes */}
            <Route path="review" element={<ReviewHub />} />
            <Route path="review/flashcards" element={<GlobalFlashcards />} />
            <Route path="review/translation" element={<GlobalTranslation />} />
            <Route path="review/listening" element={<GlobalListening />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
