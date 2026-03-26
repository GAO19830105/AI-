import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import type { TMessage } from '../types/story';
import { Message } from './Message';

type TChatBoxProps = {
  messages: TMessage[];
  onSend: (text: string) => void;
  disabled?: boolean;
  /** AI 请求进行中：在列表底部显示「思考中...」 */
  isThinking?: boolean;
  placeholder?: string;
  /** 无消息时的占位提示 */
  emptyHint?: string;
};

function ChatBubbleIcon() {
  return (
    <svg
      className="h-10 w-10 text-amber-400/70"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

function ChatEmptyState({ hint }: { hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-3 py-6 text-center sm:px-6 sm:py-10">
      <div
        className="mb-5 rounded-2xl border border-dashed border-slate-600/80 bg-slate-900/40 p-5 shadow-inner motion-safe:animate-[pulse_3s_ease-in-out_infinite] motion-reduce:animate-none"
        aria-hidden
      >
        <ChatBubbleIcon />
      </div>
      <h3 className="text-base font-semibold text-slate-200">开始你的推理</h3>
      <p className="mt-2 max-w-sm text-pretty text-sm leading-relaxed text-slate-500">
        {hint}
      </p>
      <ul className="mt-5 max-w-xs space-y-2 text-left text-xs leading-relaxed text-slate-600">
        <li className="flex gap-2">
          <span className="shrink-0 text-amber-500/80">①</span>
          <span>尽量用一句话描述可判断真假的猜测，方便主持人回答「是」或「否」。</span>
        </li>
        <li className="flex gap-2">
          <span className="shrink-0 text-amber-500/80">②</span>
          <span>
            <kbd className="rounded border border-slate-600 bg-slate-800 px-1 py-0.5 font-sans text-[10px] text-slate-400">
              Enter
            </kbd>{' '}
            发送，
            <kbd className="rounded border border-slate-600 bg-slate-800 px-1 py-0.5 font-sans text-[10px] text-slate-400">
              Shift+Enter
            </kbd>{' '}
            换行。
          </span>
        </li>
      </ul>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 shrink-0 animate-spin text-amber-400"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function ThinkingRow() {
  return (
    <div className="msg-enter flex justify-start gap-2">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-400/45 bg-slate-800 shadow-lg ring-1 ring-amber-400/15"
        aria-hidden
      >
        <Spinner />
      </div>
      <div className="flex max-w-[min(100%,20rem)] flex-col rounded-lg border border-slate-600 bg-slate-800/95 px-3 py-2.5 text-sm shadow-lg sm:max-w-md">
        <p className="mb-1 text-xs font-medium tracking-wide text-amber-400/95">
          AI 主持人
        </p>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="inline-flex gap-1">
            <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400/80 [animation-delay:-0.2s]" />
            <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400/80 [animation-delay:-0.1s]" />
            <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400/80" />
          </span>
          <span className="text-sm">思考中...</span>
        </div>
      </div>
    </div>
  );
}

export function ChatBox({
  messages,
  onSend,
  disabled,
  isThinking,
  placeholder = '输入你的问题…',
  emptyHint = '在下方输入你的第一个问题',
}: TChatBoxProps) {
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isThinking]);

  const submit = useCallback(() => {
    const text = draft.trim();
    if (!text || disabled) return;
    onSend(text);
    setDraft('');
  }, [draft, disabled, onSend]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Enter' || e.shiftKey) return;
    e.preventDefault();
    submit();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-700 bg-slate-950/30 shadow-lg">
      {isThinking ? (
        <div className="chat-loading-bar-track shrink-0" aria-hidden>
          <div className="chat-loading-bar-fill" />
        </div>
      ) : (
        <div className="h-0.5 shrink-0 bg-slate-800/80" aria-hidden />
      )}

      <div
        ref={listRef}
        className="min-h-[11rem] flex-1 space-y-3 overflow-y-auto overflow-x-hidden overscroll-contain p-3 sm:min-h-[15rem] sm:p-4"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-busy={isThinking ? true : undefined}
      >
        {messages.length === 0 && !isThinking ? (
          <ChatEmptyState hint={emptyHint} />
        ) : (
          <>
            {messages.map((m) => (
              <Message key={m.id} message={m} />
            ))}
            {isThinking && <ThinkingRow />}
          </>
        )}
      </div>

      <div className="border-t border-slate-700/80 bg-slate-800/50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 sm:pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={2}
            placeholder={placeholder}
            enterKeyHint="send"
            className="min-h-[3rem] flex-1 resize-none rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2.5 text-base text-slate-100 placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20 disabled:opacity-50 sm:min-h-[2.75rem] sm:text-sm"
          />
          <button
            type="button"
            onClick={submit}
            disabled={disabled || !draft.trim()}
            aria-busy={isThinking || undefined}
            className="inline-flex min-h-11 min-w-[5.5rem] shrink-0 touch-manipulation items-center justify-center gap-2 rounded-lg border border-amber-400/60 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-400 shadow-lg transition hover:bg-amber-500/20 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
          >
            {isThinking ? (
              <>
                <Spinner />
                <span>发送中…</span>
              </>
            ) : (
              '发送'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
