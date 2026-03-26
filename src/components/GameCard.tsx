import { Link } from 'react-router-dom';
import type { TTurtleSoupStory } from '../data/stories';

const difficultyLabel: Record<TTurtleSoupStory['difficulty'], string> = {
  easy: '简单',
  medium: '普通',
  hard: '困难',
};

const difficultyClass: Record<TTurtleSoupStory['difficulty'], string> = {
  easy: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300',
  medium: 'border-amber-400/50 bg-amber-500/10 text-amber-400',
  hard: 'border-rose-500/50 bg-rose-500/10 text-rose-300',
};

type TGameCardProps = {
  story: TTurtleSoupStory;
};

export function GameCard({ story }: TGameCardProps) {
  return (
    <Link
      to={`/game/${story.id}`}
      className="group block min-h-[44px] touch-manipulation rounded-lg border border-slate-700/80 bg-slate-800/50 p-4 shadow-lg ring-0 ring-amber-400/0 transition duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:border-amber-400/45 hover:bg-slate-800/70 hover:shadow-xl hover:ring-2 hover:ring-amber-400/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 active:scale-[0.99] sm:p-5"
    >
      <h2 className="text-lg font-semibold tracking-tight text-slate-100 transition-colors group-hover:text-amber-400">
        {story.title}
      </h2>
      <div className="mt-3">
        <span
          className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium shadow-lg ${difficultyClass[story.difficulty]}`}
        >
          {difficultyLabel[story.difficulty]}
        </span>
      </div>
    </Link>
  );
}
