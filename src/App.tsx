
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { DayView } from './pages/DayView';
import { ReviewHub } from './pages/ReviewHub';
import { FlashcardGame } from './components/review/FlashcardGame';
import { TranslationGame } from './components/review/TranslationGame';
import { ListeningGame } from './components/review/ListeningGame';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="week/:weekId/day/:dayId" element={<DayView />} />
          <Route path="review" element={<ReviewHub />} />
          <Route path="review/flashcards" element={<FlashcardGame />} />
          <Route path="review/translation" element={<TranslationGame />} />
          <Route path="review/listening" element={<ListeningGame />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
