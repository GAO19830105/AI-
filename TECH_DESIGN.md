# AI 海龟汤游戏 — 技术设计文档

本文档描述前端架构、数据模型、核心流程与 AI 交互设计，供开发与 AI 助手实现时对照。

---

## 1. 技术栈

| 层级 | 选型 | 说明 |
|------|------|------|
| 前端框架 | React + TypeScript | 函数式组件 + Hooks |
| 构建工具 | Vite | 开发与打包 |
| 样式 | Tailwind CSS | 与 `AGENTS.md` 中视觉规范一致 |
| 状态管理 | React Hooks（`useState`、`useContext`） | 前期不引入 Redux 等 |
| 路由 | React Router | 大厅 / 游戏 / 结果页切换 |
| 后端（可选） | Node.js + Express | 用于代理 AI 请求、隐藏 Key；**前期可省略，由前端直连或 Mock** |
| AI 服务 | DeepSeek / 智谱 AI | **优先 DeepSeek**（成本较低）；具体 SDK/HTTP 以官方文档为准 |

**环境变量（示例，勿在代码中硬编码密钥）**

- 直连前端时（仅本地/演示）：如 `VITE_DEEPSEEK_API_KEY`（以实际接入方式为准）。
- 有后端时：密钥仅存在于服务端环境变量，前端只请求自有 API。

---

## 2. 项目结构

```
src/
├── components/          # 可复用组件
│   ├── GameCard.tsx     # 游戏卡片（列表项）
│   ├── ChatBox.tsx      # 聊天输入与发送
│   ├── Message.tsx      # 单条消息展示
│   └── StoryReveal.tsx  # 汤底揭晓展示
├── pages/
│   ├── Home.tsx         # 首页 / 游戏大厅
│   ├── Game.tsx         # 游戏页（汤面 + 对话）
│   └── Result.tsx       # 结果页（汤底 + 再来一局）
├── data/
│   └── stories.ts       # 海龟汤故事静态数据
├── api/                 # 建议：AI 请求封装（与 AGENTS 约定一致）
│   └── aiClient.ts
├── context/             # 可选：GameContext 等全局状态
├── App.tsx
└── main.tsx
```

**路由建议（示例）**

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | `Home` | 故事列表 |
| `/game/:storyId` | `Game` | 进行中的对局 |
| `/result/:storyId` | `Result` | 揭晓与重开 |

---

## 3. 数据模型

### 3.1 `Story`（海龟汤故事）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 唯一标识 |
| `title` | `string` | 标题 |
| `difficulty` | `'easy' \| 'medium' \| 'hard'` | 难度 |
| `surface` | `string` | 汤面（展示给玩家） |
| `bottom` | `string` | 汤底（仅用于 AI 判断与揭晓页，勿在对话中泄露） |

**TypeScript 类型示例（类型名以 `T` 开头，与 AGENTS 一致）**

```ts
type TDifficulty = 'easy' | 'medium' | 'hard';

type TStory = {
  id: string;
  title: string;
  difficulty: TDifficulty;
  surface: string;
  bottom: string;
};
```

### 3.2 `Message`（对话消息）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 唯一标识 |
| `role` | `'user' \| 'assistant'` | 用户 / AI |
| `content` | `string` | 正文（助手侧应为「是」「否」「无关」之一） |
| `timestamp` | `number` | Unix 时间戳（毫秒） |

```ts
type TMessageRole = 'user' | 'assistant';

type TMessage = {
  id: string;
  role: TMessageRole;
  content: string;
  timestamp: number;
};
```

---

## 4. 核心流程

1. **选本**：玩家在 `Home` 选择故事 → 进入 `Game`，展示当前故事的 `surface`（汤面）。
2. **提问**：玩家在 `ChatBox` 输入问题 → 调用 AI 接口（或 Mock），请求体携带当前故事的 `surface`、`bottom`（仅服务端或封装层使用，勿输出到 UI）与用户问题。
3. **判题**：AI 严格按汤底逻辑仅返回 **「是」「否」「无关」** 之一 → 作为一条 `role: 'assistant'` 的 `Message` 追加到列表。
4. **循环**：重复步骤 2–3，直至玩家选择「揭晓 / 放弃」或达到产品约定的回合上限（若后续产品需要可再扩展）。
5. **结局**：跳转或使用 `StoryReveal` 展示 `bottom`（汤底），提供「再来一局」回到 `Home` 或重新选题。

**状态要点（实现时）**

- 当前 `storyId`、`TMessage[]`、可选「是否已揭晓」标志宜放在 `Game` 页 state 或 `Context` 中，与路由参数同步。

---

## 5. AI Prompt 设计

以下为发给模型的系统/用户提示模板（占位符在实际调用时替换为真实字符串）。

**角色与规则**

- 模型扮演海龟汤主持人。
- 已知：当前故事汤面 `{surface}`、汤底 `{bottom}`（**不得**在回复中透露汤底内容）。
- 对玩家每一则提问，**只**允许回答以下三者之一：
  1. **「是」**：玩家猜测与汤底一致；
  2. **「否」**：玩家猜测与汤底矛盾；
  3. **「无关」**：与汤底无关或无法据此判断。

**约束**

1. 严格依据给定汤底判断，不做题外推理或扩写剧情。  
2. 只输出「是」「否」「无关」三字之一，**不要**解释、标点扩展或附加说明。  
3. 保持神秘感，不泄露汤底。

**单次调用模板**

```text
你是一个海龟汤游戏的主持人。

当前故事的汤面是：{surface}
故事的汤底是：{bottom}

玩家会向你提问，你只能回答以下三种之一：
1."是"：玩家的猜测与汤底一致
2."否"：玩家的猜测与汤底矛盾
3."无关"：玩家的猜测与汤底无关，无法判断

注意：
1.严格根据汤底判断，不要额外推理
2.只回答"是"、"否"、"无关"，不要解释
3.保持神秘感，不要透露汤底

玩家问：{question}
请回答：
```

**实现建议**

- 对模型返回做**白名单校验**（trim 后是否为「是」「否」「无关」），异常时重试或降级为「无关」并打日志（具体策略产品可再定）。
- 若走后端，由 Express 拼接上述 Prompt 并调用 DeepSeek/智谱 API，避免浏览器暴露 `bottom` 与 API Key（理想架构）；前期纯前端原型需注意汤底与 Key 的暴露风险，仅用于本地演示。

---

## 6. 与相关文档的关系

- 视觉与代码风格以 **`AGENTS.md`** 为准（如 `bg-slate-900`、`text-amber-400`、`rounded-lg`、`shadow-lg` 等）。
- 需求级描述若有 **`PRD.md`** 等，与本设计冲突时以 PRD 为准并回写本文档。

---

*文档版本：随实现迭代可修订「路由、环境变量名、是否强制后端」等条目。*
