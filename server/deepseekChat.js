/**
 * DeepSeek（OpenAI 兼容）海龟汤主持逻辑，与前端 src/api/api.ts 规则对齐。
 * 密钥：环境变量 DEEPSEEK_API_KEY 或 AI_API_KEY（勿提交仓库）。
 */

const DEFAULT_BASE_URL = 'https://api.deepseek.com/v1';
const DEFAULT_MODEL = 'deepseek-chat';

export const CHAT_ERROR_CODES = {
  CONFIG: 'CONFIG',
  INVALID_REPLY: 'INVALID_REPLY',
  UPSTREAM: 'UPSTREAM',
  NETWORK: 'NETWORK',
};

export class ChatError extends Error {
  /**
   * @param {string} message
   * @param {{ code?: string; status?: number; cause?: unknown }} [opts]
   */
  constructor(message, opts = {}) {
    super(message, opts.cause ? { cause: opts.cause } : undefined);
    this.name = 'ChatError';
    this.code = opts.code;
    this.status = opts.status;
  }
}

/**
 * @param {{ surface: string; bottom: string; id?: string; title?: string; difficulty?: string }} story
 */
export function buildSystemPrompt(story) {
  const demoBlock = [
    '【教学示例：下列问答仅演示「是 / 否 / 无关」的判定方式，逻辑与当前真实汤底无关】',
    '虚构汤底：男人因无法承受打击而自杀；现场没有其他人参与。',
    '玩家问：他是自杀的吗？',
    '主持人：是',
    '玩家问：凶手是他的妻子吗？',
    '主持人：否',
    '玩家问：故事发生在冬天吗？',
    '主持人：无关',
    '玩家问：他生前喜欢听音乐吗？',
    '主持人：无关',
    '',
    '【再一例】虚构汤底：男孩个子矮，雨天用雨伞尖才按得到高层电梯按钮。',
    '玩家问：他是不是够不着电梯按钮？',
    '主持人：是',
    '玩家问：他是不是恐高才走楼梯？',
    '主持人：否',
    '玩家问：这栋楼有物业管理吗？',
    '主持人：无关',
  ].join('\n');

  return [
    '你是海龟汤游戏的主持人，掌握当前故事的汤面与汤底。',
    '',
    '【输出铁律】',
    '每一轮回复只能是以下三者之一，不得多字、不得加标点、不得换行、不得解释：「是」「否」「无关」（其中「无关」为两个字）。',
    '除上述完整词外，禁止输出任何其它字符（包括「好的」「答案是」「是的」等）。',
    '',
    demoBlock,
    '',
    '【判定规则】',
    '1.「是」：玩家陈述与汤底关键事实一致，或推理方向正确且可被汤底支持。',
    '2.「否」：玩家陈述与汤底明确矛盾。',
    '3.「无关」：与汤底核心因果无关，或汤底信息不足以判断。',
    '4. 只依据给定汤底判断，不要编造汤底没有的信息。',
    '5. 永远不要向玩家复述、暗示或泄露汤底原文；不要写推理过程。',
    '',
    '=== 当前你要主持的故事（仅用于判定，勿泄露）===',
    `汤面：${story.surface}`,
    `汤底：${story.bottom}`,
  ].join('\n');
}

export function buildUserPrompt(question) {
  return `玩家问：${question}\n\n请只回复以下之一（不要其它任何内容）：是、否、无关`;
}

/**
 * @param {string} raw
 * @returns {'是'|'否'|'无关'}
 */
export function parseStrictAnswer(raw) {
  const firstLine = raw.trim().split(/\r?\n/)[0] ?? '';
  const s = firstLine
    .replace(/^[\s"'「『]+/, '')
    .replace(/[\s"'」』]+$/, '')
    .replace(/[。！？.!?，,、]+$/g, '')
    .trim();
  const compact = s.replace(/\s+/g, '');

  if (compact === '是' || compact === '否' || compact === '无关') {
    return compact;
  }

  throw new ChatError(
    '主持人这次没有给出规范的「是 / 否 / 无关」。请把问题改成更清楚的一句（尽量是可直接判断真假的陈述），然后再发一次。',
    { code: CHAT_ERROR_CODES.INVALID_REPLY },
  );
}

/**
 * @param {string} question
 * @param {{ surface: string; bottom: string }} story
 * @returns {Promise<string>}
 */
export async function callDeepseekChat(question, story) {
  const apiKey =
    process.env.DEEPSEEK_API_KEY?.trim() ||
    process.env.AI_API_KEY?.trim();

  if (!apiKey) {
    throw new ChatError(
      '未配置 API 密钥：请在环境变量中设置 DEEPSEEK_API_KEY 或 AI_API_KEY（勿提交仓库）',
      { code: CHAT_ERROR_CODES.CONFIG },
    );
  }

  const baseUrl = (
    process.env.DEEPSEEK_BASE_URL || DEFAULT_BASE_URL
  ).replace(/\/$/, '');
  const model = (process.env.DEEPSEEK_MODEL || DEFAULT_MODEL).trim();
  const url = `${baseUrl}/chat/completions`;

  const body = {
    model,
    messages: [
      { role: 'system', content: buildSystemPrompt(story) },
      { role: 'user', content: buildUserPrompt(question) },
    ],
    temperature: 0.05,
    max_tokens: 16,
  };

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new ChatError('调用 AI 接口网络失败，请稍后重试', {
      code: CHAT_ERROR_CODES.NETWORK,
      cause: e,
    });
  }

  const text = await res.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new ChatError(
      res.ok ? 'AI 接口返回了非 JSON 数据' : `AI 接口错误（HTTP ${res.status}）`,
      { code: CHAT_ERROR_CODES.UPSTREAM, status: res.status },
    );
  }

  if (!res.ok) {
    const msg =
      payload.error?.message || text.slice(0, 200) || `HTTP ${res.status}`;
    throw new ChatError(msg, {
      code: CHAT_ERROR_CODES.UPSTREAM,
      status: res.status,
    });
  }

  const raw = payload.choices?.[0]?.message?.content ?? '';
  if (!raw.trim()) {
    throw new ChatError('模型未返回有效内容，请重试', {
      code: CHAT_ERROR_CODES.UPSTREAM,
    });
  }

  return parseStrictAnswer(raw);
}
