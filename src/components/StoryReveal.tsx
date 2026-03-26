import type { TStory } from '../types/story';

type TStoryRevealProps = {
  story: TStory;
  className?: string;
  /** 结果页大字号、强对比汤底展示 */
  variant?: 'default' | 'result';
};

export function StoryReveal({
  story,
  className = '',
  variant = 'default',
}: TStoryRevealProps) {
  const isResult = variant === 'result';

  return (
    <article
      className={[
        'rounded-lg border bg-slate-900/50 shadow-lg',
        isResult
          ? 'border-2 border-amber-400/45 px-5 py-6 shadow-xl shadow-amber-950/30 sm:px-8 sm:py-8'
          : 'border-amber-400/30 bg-slate-800/60 p-4 sm:p-6',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <h2
        className={
          isResult
            ? 'text-center text-sm font-semibold uppercase tracking-[0.35em] text-amber-400/90'
            : 'text-lg font-semibold text-amber-400'
        }
      >
        汤底
      </h2>
      <div
        className={
          isResult
            ? 'mx-auto mt-2 h-px max-w-md bg-gradient-to-r from-transparent via-amber-400/50 to-transparent'
            : ''
        }
      />
      <p
        className={[
          'whitespace-pre-wrap leading-relaxed text-slate-100',
          isResult
            ? 'mt-6 text-base sm:text-lg'
            : 'mt-3 text-sm sm:text-[15px]',
        ].join(' ')}
      >
        {story.bottom}
      </p>
    </article>
  );
}
