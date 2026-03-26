import { GameCard } from '../components/GameCard';
import { stories } from '../data/stories';

export default function Home() {
  return (
    <div className="relative min-h-[100dvh] min-h-screen overflow-x-hidden px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] sm:px-6 sm:py-12 lg:px-8">
      {/* 氛围：深色径向光 + 极淡紫边，不喧宾夺主 */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(251,191,36,0.08),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_50%,rgba(99,102,241,0.06),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_30%_at_0%_80%,rgba(30,58,138,0.12),transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl">
        <header className="mb-10 text-center sm:mb-12">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-amber-500/70">
            推理 · 对话 · 真相
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 drop-shadow-[0_0_24px_rgba(251,191,36,0.15)] sm:text-4xl md:text-5xl">
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              AI海龟汤
            </span>
          </h1>
          <div className="mx-auto mt-4 h-px max-w-xs bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
          <div className="mx-auto mt-6 max-w-2xl space-y-3 text-pretty text-sm leading-relaxed text-slate-400 sm:text-base">
            <p>
              每一则故事都只有<strong className="font-medium text-slate-300">汤面</strong>
              ——你知道的仅是冰山一角。向 AI 主持人自由提问，TA 只会回答
              <span className="text-amber-400/90">是</span>、
              <span className="text-amber-400/90">否</span> 或
              <span className="text-amber-400/90">无关</span>
              。在只言片语中拼凑线索，直到你愿意揭开汤底。
            </p>
            <p className="text-xs text-slate-500 sm:text-sm">
              点击下方卡片进入一局。无需注册，选好故事即可开始推理。
            </p>
          </div>
        </header>

        <ul
          role="list"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6"
        >
          {stories.map((story, index) => (
            <li
              key={story.id}
              className="home-card-enter min-w-0"
              style={{ animationDelay: `${index * 65}ms` }}
            >
              <GameCard story={story} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
