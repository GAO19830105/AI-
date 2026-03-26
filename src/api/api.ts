import type { TTurtleSoupStory } from '../data/stories';

/**
 * 与 `askAI` 第二个参数一致；与 AGENTS 中 TStory/题库条目字段对齐。
 * 对外保留 `Story` 命名以匹配产品接口描述。
 */
export type Story = TTurtleSoupStory;

/** 与 `AiApiError.code` 对应：模型未按「是/否/无关」作答（与后端 code 一致） */
export const AI_ERROR_INVALID_REPLY = 'INVALID_REPLY' as const;

/** 生产构建或未走 Vite 代理时，直连后端根地址 */
const DEFAULT_API_ORIGIN = 'http://localhost:3000';

function getApiOrigin(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (import.meta.env.DEV) return '';
  return DEFAULT_API_ORIGIN;
}

function getChatUrl(): string {
  const base = getApiOrigin();
  return `${base}/api/chat`;
}

type TChatApiBody = {
  ok?: boolean;
  answer?: string;
  error?: string;
  code?: string;
};

export class AiApiError extends Error {
  readonly status?: number;
  readonly code?: string;

  constructor(
    message: string,
    options?: { status?: number; cause?: unknown; code?: string },
  ) {
    super(message);
    this.name = 'AiApiError';
    this.status = options?.status;
    this.code = options?.code;
    if (options?.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

/**
 * 通过后端 `POST /api/chat` 获取主持人回答（密钥仅在后端配置）。
 * - 开发环境（Vite）：默认请求同源 `/api/chat`，由 Vite 代理到 `localhost:3000`，避免跨域。
 * - 生产环境：默认 `http://localhost:3000`；可设 `VITE_API_BASE_URL` 指向实际后端。
 */
export async function askAI(question: string, story: Story): Promise<string> {
  const url = getChatUrl();

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        story: {
          id: story.id,
          title: story.title,
          difficulty: story.difficulty,
          surface: story.surface,
          bottom: story.bottom,
        },
      }),
    });
  } catch (e) {
    throw new AiApiError(
      '无法连接后端服务，请确认已在 server 目录执行 node server.js（默认 http://localhost:3000），并检查本机网络。',
      { cause: e },
    );
  }

  const text = await res.text();
  let payload: TChatApiBody;
  try {
    payload = JSON.parse(text) as TChatApiBody;
  } catch {
    throw new AiApiError(
      res.ok
        ? '后端返回了非 JSON 数据'
        : `请求失败（HTTP ${res.status}）`,
      { status: res.status },
    );
  }

  if (
    res.ok &&
    payload.ok === true &&
    typeof payload.answer === 'string' &&
    payload.answer.trim()
  ) {
    return payload.answer.trim();
  }

  const msg =
    (typeof payload.error === 'string' && payload.error) ||
    text.slice(0, 200) ||
    `请求失败（HTTP ${res.status}）`;

  throw new AiApiError(msg, {
    status: res.status,
    code: typeof payload.code === 'string' ? payload.code : undefined,
  });
}
