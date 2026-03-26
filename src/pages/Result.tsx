import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { StoryReveal } from '../components/StoryReveal';
import { getStoryById } from '../data/stories';
import type { TMessage } from '../types/story';

const REVEAL_MS = 720;

export type TResultLocationState = {
  messages?: TMessage[];
};

export default function Result() {
  const { storyId } = useParams<{ storyId: string }>();
  const location = useLocation();
  const story = storyId ? getStoryById(storyId) : undefined;

  const historyMessages =
    (location.state as TResultLocationState | null)?.messages?.filter(
      (m) => m.content.trim().length > 0,
    ) ?? [];

  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduceMotion) {
      setRevealed(true);
      return;
    }
    const id = window.setTimeout(() => setRevealed(true), REVEAL_MS);
    return () => window.clearTimeout(id);
  }, [storyId]);

  if (!storyId) return <Navigate to="/" replace />;
  if (!story) return <Navigate to="/" replace />;

  return (
    <div className="relative min-h-[100dvh] min-h-screen overflow-x-hidden px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] sm:px-6 sm:py-10">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(251,191,36,0.12),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_100%,rgba(88,28,135,0.08),transparent)]"
        aria-hidden
      />

      {/* 揭晓幕布 */}
      <div
        className={`pointer-events-none fixed inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-slate-950 transition-opacity duration-700 ease-out ${
          revealed ? 'opacity-0' : 'opacity-95'
        }`}
        aria-hidden={revealed}
      >
        <p className="animate-pulse text-xs font-medium uppercase tracking-[0.55em] text-amber-500/90">
          真相揭晓
        </p>
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex text-sm text-amber-400/90 transition hover:text-amber-400"
        >
          ← 返回大厅
        </Link>

        <header
          className={`mt-8 text-center transition-all duration-1000 ease-out ${
            revealed
              ? 'translate-y-0 opacity-100'
              : 'translate-y-3 opacity-0 blur-sm'
          }`}
        >
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-500">
            游戏结束
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
            {story.title}
          </h1>
        </header>

        <div
          className={
            revealed ? 'reveal-veil-anim mt-10' : 'mt-10 opacity-0'
          }
        >
          <StoryReveal
            story={story}
            variant="result"
            className={revealed ? 'story-reveal-glow' : ''}
          />
        </div>

        {historyMessages.length > 0 && (
          <section
            className={`mt-10 transition-all delay-200 duration-1000 ease-out ${
              revealed
                ? 'translate-y-0 opacity-100'
                : 'translate-y-4 opacity-0'
            }`}
          >
            <h2 className="mb-3 text-center text-sm font-semibold text-slate-400">
              本局提问回顾
              <span className="ml-2 text-xs font-normal text-slate-600">
                （可选）
              </span>
            </h2>
            <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-700/80 bg-slate-950/40 p-4 shadow-lg sm:max-h-80">
              <ul className="space-y-3">
                {historyMessages.map((m) => (
                  <li
                    key={m.id}
                    className={`flex text-sm ${
                      m.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[90%] rounded-lg border px-3 py-2 shadow-md sm:max-w-[85%] ${
                        m.role === 'user'
                          ? 'border-amber-400/25 bg-slate-800/90 text-slate-200'
                          : 'border-slate-600 bg-slate-800/70 text-slate-300'
                      }`}
                    >
                      <span className="mb-0.5 block text-[10px] uppercase tracking-wider text-slate-500">
                        {m.role === 'user' ? '你' : '主持人'}
                      </span>
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {m.content}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <div
          className={`mt-10 flex justify-center transition-all delay-300 duration-1000 ease-out ${
            revealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <Link
            to="/"
            className="rounded-lg border border-amber-400/60 bg-amber-500/15 px-8 py-3 text-sm font-medium text-amber-400 shadow-lg shadow-amber-950/20 transition hover:bg-amber-500/25 hover:shadow-xl"
          >
            再来一局
          </Link>
        </div>
      </div>
    </div>
  );
}
