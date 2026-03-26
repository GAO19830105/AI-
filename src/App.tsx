import { Navigate, Route, Routes } from 'react-router-dom';
import Game from './pages/Game';
import Home from './pages/Home';
import Result from './pages/Result';

export default function App() {
  return (
    <div className="min-h-[100dvh] min-h-screen overflow-x-hidden bg-slate-900 text-slate-100 antialiased [-webkit-tap-highlight-color:transparent]">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game/:id" element={<Game />} />
        <Route path="/result/:storyId" element={<Result />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
