import type { TMessageRole } from '../types/story';

/** 单条气泡所需字段（完整 TMessage 亦可传入） */
export type TMessageBubble = {
  role: TMessageRole;
  content: string;
};

type TMessageProps = {
  message: TMessageBubble;
  /** 关闭入场动画（如列表重渲染场景） */
  animateEnter?: boolean;
};

function UserIcon() {
  return (
    <svg
      className="h-4 w-4 text-amber-200"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function HostIcon() {
  return (
    <svg
      className="h-4 w-4 text-amber-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="5" y="5" width="14" height="14" rx="3" />
      <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
      <path d="M9 16h6" />
    </svg>
  );
}

export function Message({
  message,
  animateEnter = true,
}: TMessageProps) {
  const isUser = message.role === 'user';
  const enterClass = animateEnter ? 'msg-enter' : '';

  const avatar = (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border shadow-lg ${
        isUser
          ? 'border-amber-400/35 bg-slate-700/90'
          : 'border-amber-400/45 bg-slate-800 ring-1 ring-amber-400/15'
      }`}
      aria-hidden
    >
      {isUser ? <UserIcon /> : <HostIcon />}
    </div>
  );

  const bubble = (
    <div
      className={`max-w-[min(100%,20rem)] rounded-lg px-3 py-2.5 text-sm shadow-lg sm:max-w-md ${
        isUser
          ? 'border border-amber-400/35 bg-slate-700/95 text-slate-100'
          : 'border border-slate-600 bg-slate-800/95 text-slate-200'
      }`}
    >
      {!isUser && (
        <p className="mb-1.5 text-xs font-medium tracking-wide text-amber-400/95">
          AI 主持人
        </p>
      )}
      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
    </div>
  );

  if (isUser) {
    return (
      <div className={`flex justify-end gap-2 ${enterClass}`}>
        {bubble}
        {avatar}
      </div>
    );
  }

  return (
    <div className={`flex justify-start gap-2 ${enterClass}`}>
      {avatar}
      {bubble}
    </div>
  );
}
