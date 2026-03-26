/**
 * AI 提问封装：后续对接后端 /api/games/:id/ask 或直连模型。
 * 禁止在此文件硬编码 API Key；调用模型由后端代理，密钥在 server 侧 DEEPSEEK_API_KEY。
 */

export type TAskResult = {
  answer: string;
  label: 'YES' | 'NO' | 'IRRELEVANT';
};

/** 占位：无 Key 时返回「无关」，便于 UI 联调 */
export async function askHostMock(_question: string): Promise<TAskResult> {
  return Promise.resolve({
    answer: '无关',
    label: 'IRRELEVANT',
  });
}
