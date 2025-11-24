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

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
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
  );
}

export default App;
