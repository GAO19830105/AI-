/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * 后端根地址，勿带末尾 /。不设时：开发走 Vite 代理 `/api`；生产默认直连 localhost:3000。
   * DeepSeek 密钥用服务端环境变量 DEEPSEEK_API_KEY（见 server/.env），勿在此写 VITE_* API Key。
   */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
