import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  AI_ERROR_INVALID_REPLY,
  AiApiError,
  askAI,
} from '../api/api';
import { ChatBox } from '../components/ChatBox';
import { useExclusiveAsync } from '../hooks/useExclusiveAsync';
import { getStoryById } from '../data/stories';
import type { TGamePhase, TMessage } from '../types/story';

function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function friendlyAiError(e: unknown): string {
  if (e instanceof AiApiError) {
    if (e.code === AI_ERROR_INVALID_REPLY) {
      return e.message;
    }
    const m = e.message;
    if (m.includes('未配置') && m.includes('密钥')) {
      return '后端未配置 AI 密钥：请在 server 目录的 .env 中设置 DEEPSEEK_API_KEY（或 AI_API_KEY），保存后重启 node server.js。';
    }
    if (m.includes('无法连接后端')) {
      return m;
    }
    if (m.includes('网络')) {
      return '网络连接不太稳定，请检查网络后重新发送问题。';
    }
    if (e.status === 401 || e.status === 403) {
      return '后端使用的 AI 密钥无效或没有权限，请检查 server/.env 中的 DEEPSEEK_API_KEY（或 AI_API_KEY）。';
    }
    if (e.status === 429) {
      return '请求过于频繁，请稍等几秒后再发送。';
    }
    if (e.status != null && e.status >= 500) {
      return 'AI 服务暂时繁忙，请稍等片刻后再试。';
    }
    return `主持人暂时无法作答：${m}。你可以稍后再试一次。`;
  }
  if (e instanceof Error) {
    return `出了点意外（${e.message}）。请稍后再试。`;
  }
  return '出了点意外，请稍后再试。';
}

const BANNER_MS = 9000;

export default function Game() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const story = useMemo(() => (id ? getStoryById(id) : undefined), [id]);

  const [messages, setMessages] = useState<TMessage[]>([]);
  const { isPending, runExclusive } = useExclusiveAsync();
  const [phase, setPhase] = useState<TGamePhase>('playing');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const isPlaying = phase === 'playing';

  useEffect(() => {
    if (!errorBanner) return;
    const t = window.setTimeout(() => setErrorBanner(null), BANNER_MS);
    return () => window.clearTimeout(t);
  }, [errorBanner]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!story || !isPlaying) return;

      await runExclusive(async () => {
        setErrorBanner(null);

        const userMsg: TMessage = {
          id: createMessageId(),
          role: 'user',
          content: text,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, userMsg]);

        try {
          const answer = await askAI(text, story);
          setMessages((prev) => [
            ...prev,
            {
              id: createMessageId(),
              role: 'assistant',
              content: answer,
              timestamp: Date.now(),
            },
          ]);
        } catch (e) {
          const full = friendlyAiError(e);
          setErrorBanner(full);
          setMessages((prev) => [
            ...prev,
            {
              id: createMessageId(),
              role: 'assistant',
              content: full,
              timestamp: Date.now(),
            },
          ]);
        }
      });
    },
    [story, isPlaying, runExclusive],
  );

  function handleBackToHall() {
    if (isPlaying && messages.length > 0) {
      if (
        !window.confirm(
          '确定返回大厅吗？将放弃本局，对话记录不会保留。',
        )
      ) {
        return;
      }
    }
    setPhase('ended');
    navigate('/', { replace: true });
  }

  function handleEndGame() {
    const tip =
      messages.length > 0
        ? '确定放弃本局并返回大厅吗？本局对话不会保留。如需先看答案，请先点「查看汤底」。'
        : '确定返回大厅吗？';
    if (!window.confirm(tip)) return;
    setPhase('ended');
    navigate('/', { replace: true });
  }

  if (!id) return <Navigate to="/" replace />;
  if (!story) return <Navigate to="/" replace />;

  const chatDisabled = !isPlaying || isPending;

  return (
    <div className="flex min-h-[100dvh] min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6 sm:pb-8 sm:pt-6">
        <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleBackToHall}
            className="touch-manipulation text-sm text-amber-400/90 transition hover:text-amber-400 active:opacity-80"
          >
            ← 返回大厅
          </button>
          <span
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
              isPlaying
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-600 bg-slate-800/60 text-slate-400'
            }`}
          >
            {isPlaying
              ? isPending
                ? '等待回复…'
                : '进行中'
              : '已结束'}
          </span>
        </div>

        {/* 汤面区 */}
        <header className="mb-4 shrink-0 rounded-lg border border-slate-700/90 bg-slate-800/50 p-4 shadow-lg transition-shadow duration-300 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2 gap-y-1">
            <h1 className="text-lg font-semibold text-amber-400 sm:text-xl">
              {story.title}
            </h1>
            <span className="rounded-lg border border-slate-600 px-2 py-0.5 text-xs text-slate-400">
              汤面
            </span>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-200 sm:text-[15px]">
            {story.surface}
          </p>
        </header>

        {errorBanner && (
          <div
            role="alert"
            className="msg-enter mb-4 flex shrink-0 gap-2 rounded-lg border border-rose-500/45 bg-rose-950/35 px-3 py-2.5 text-sm text-rose-100 shadow-lg sm:px-4"
          >
            <span className="mt-0.5 shrink-0 text-base" aria-hidden>
              ⚠
            </span>
            <p className="min-w-0 flex-1 text-pretty leading-relaxed">
              {errorBanner}
            </p>
            <button
              type="button"
              onClick={() => setErrorBanner(null)}
              className="touch-manipulation shrink-0 rounded-md px-2 py-0.5 text-rose-200/90 hover:bg-rose-500/20"
              aria-label="关闭提示"
            >
              ✕
            </button>
          </div>
        )}

        {/* 对话区：占满剩余高度 */}
        <div className="flex min-h-0 flex-1 flex-col">
          <ChatBox
            messages={messages}
            onSend={handleSend}
            disabled={chatDisabled}
            isThinking={isPending}
            emptyHint="主持人只会回答「是」「否」或「无关」。从汤面出发，大胆假设、小心验证。"
          />
        </div>

        {/* 底部操作 */}
        <div className="mt-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="text-center text-xs leading-relaxed text-slate-500 sm:text-left">
            {isPlaying
              ? '「查看汤底」将揭晓答案并进入结果页；「结束游戏」为放弃本局并返回大厅。'
              : '正在返回大厅…'}
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={handleEndGame}
              disabled={!isPlaying || isPending}
              className="min-h-11 touch-manipulation rounded-lg border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-200 shadow-lg transition hover:border-slate-500 hover:bg-slate-800 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
            >
              结束游戏
            </button>
            <Link
              to={`/result/${story.id}`}
              state={{ messages }}
              className="inline-flex min-h-11 min-w-[6.5rem] touch-manipulation items-center justify-center rounded-lg border border-amber-400/60 bg-amber-500/15 px-4 py-2.5 text-sm font-medium text-amber-400 shadow-lg transition hover:bg-amber-500/25 active:scale-[0.98]"
            >
              查看汤底
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
