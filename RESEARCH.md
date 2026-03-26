# RESEARCH.md — 海龟汤（Lateral Thinking Puzzle）AI 互动系统调研与方案

## 目标与范围
基于以下核心需求，设计一套可落地的 AI 海龟汤互动系统（适用于 Web/桌面/小程序等前端 + 服务端架构）：

- **AI 能给出汤面故事**（对玩家展示的简短谜面）
- **玩家可以输入问题**（自然语言提问）
- **AI 根据汤底判断回答**（严格依据隐藏真相进行“是/否/无关/不确定”等回应）
- **记录对话历史**（可回放、可续局）
- **可以查看汤底**（在结束或授权后揭示真相）

本文件聚焦：功能拆解、数据模型、提示词策略、接口草案、存储与安全、技术选型与风险。

---

## 概念定义
- **汤面（Surface Story）**：给玩家看的谜面故事，信息不完整但自洽。
- **汤底（Solution / Ground Truth）**：完整真相（事件链、人物动机、关键事实），用于判定玩家问题的答案。
- **判定（Judgement）**：玩家的问题是否能从汤底推出（以及答案类别）。
- **会话（Session/Game）**：一次完整游戏过程，包含汤面/汤底/对话与状态。

---

## 功能需求拆解（对应核心需求）
### 1) 生成汤面故事
- **输入**：可选主题/风格/难度/禁忌（暴力/血腥/恐怖程度）、时长、语言。
- **输出**：
  - `surface_story`：2–8 句，留关键空白，避免直接泄底。
  - `metadata`：主题、难度、标签、可玩性提示（例如“关键在时间顺序/身份误认/语言歧义”）。

### 2) 玩家输入问题
- 支持自由文本；可选快捷按钮：`是/否/不知道/无关`（仅用于 UI 辅助展示，不替代 AI 判定）。

### 3) 根据汤底判定回答
系统需保证回答**不越界**：
- 不编造汤底未包含的新事实
- 不直接泄露汤底（除非允许“查看汤底”或已结束）
- 对无法推出的问题返回“无法确定/无关/不在设定内”

建议标准化回答类型（可做 UI 显示与统计）：
- **YES**：从汤底可推出为真
- **NO**：从汤底可推出为假
- **IRRELEVANT**：与汤底无关/不影响真相
- **UNKNOWN**：汤底未定义/无法推出
- **ASK_REPHRASE**：问题过于含糊，建议玩家换问法

并附带：
- `confidence`（0–1 或 low/med/high）
- `rationale_private`（仅内部可见：用于审计/调试的判定依据，不给玩家）
- `hint_optional`（可选提示：当玩家卡住时）

### 4) 记录对话历史
记录至少包含：
- 玩家问题、AI 回答、回答类型、时间戳
- 可选：回合号、是否触发提示、是否命中关键点

支持：
- 继续游戏（恢复上下文）
- 导出/分享（脱敏后）

### 5) 查看汤底
提供受控的“揭底”机制：
- **可配置策略**：
  - 立即可看（休闲模式）
  - 仅结束后可看（推荐）
  - 仅房主/管理员可看（多人房间）
- **结束条件**（可选）：
  - 玩家主动结束
  - AI 判定“已猜中”（满足关键事实集合）
  - 达到最大回合/时间

---

## 产品与交互建议（最小可行 + 可扩展）
### MVP（最小可行）
- 单人模式
- 每局：生成汤面/汤底 → 玩家问 → AI 判定回答 → 可随时结束并查看汤底
- 历史存储：本地（浏览器 LocalStorage / 桌面 SQLite）或服务端数据库

### 增强（后续）
- 难度分级与题库（AI 生成 + 人工审核）
- 多人房间：一人主持（看汤底），多人提问
- 关键线索进度条（基于命中关键事实）
- 反作弊：玩家请求“直接告诉我答案”时的拒绝策略

---

## 核心技术难点与应对
### 难点 A：AI“严格依据汤底”而不乱编
推荐采用**结构化汤底 + 判定器提示词**的方式：
- 汤底以结构化字段表达（事件、人物、因果、时间线、关键事实列表）
- 判定模型只拿到：汤底（结构化）+ 汤面 + 对话历史 + 玩家问题
- 明确约束：不得新增事实；不得泄底；输出必须符合 schema

可选强化：
- **双阶段**：先“判定分类 + 依据”（内部），再“生成对玩家回答”（外部）
- **自检**：让模型检查自己的回答是否引用了汤底不存在的信息

### 难点 B：回答类型的一致性
用**枚举输出**（JSON schema）强制类型，避免出现“可能吧/大概是”的游移回答。

### 难点 C：泄底风险
规则化“泄底”：
- 当 `allow_reveal=false`：禁止输出任何汤底关键事实（尤其是关键人物身份、死因、凶器、核心误会）
- 允许提示但提示必须“非决定性”（引导问法或关注点）

### 难点 D：对话历史膨胀（成本与上下文长度）
采用摘要策略：
- 保留最近 N 轮原文
- 更早的对话做**摘要**（包含已确认/否定的事实集合）

---

## 数据模型（建议）
### Game（游戏局）
```json
{
  "game_id": "uuid",
  "created_at": "2026-03-19T00:00:00Z",
  "status": "active|ended",
  "language": "zh-CN",
  "difficulty": "easy|medium|hard",
  "surface_story": "......",
  "solution": {
    "summary": "一段揭底总结（可直接展示）",
    "timeline": [
      {"t": "before", "event": "..."},
      {"t": "during", "event": "..."}
    ],
    "entities": [
      {"name": "A", "role": "victim|suspect|witness|other", "notes": "..."}
    ],
    "key_facts": [
      {"id": "KF1", "fact": "关键事实1", "must_be_discovered": true},
      {"id": "KF2", "fact": "关键事实2", "must_be_discovered": false}
    ],
    "constraints": {
      "allowed_answer_style": "short",
      "safety": {"violence": "mild", "adult": false}
    }
  },
  "reveal_policy": "end_only|anytime|host_only",
  "allow_reveal": false,
  "progress": {
    "discovered_key_fact_ids": ["KF1"],
    "turns": 12
  }
}
```

### Message（对话消息）
```json
{
  "message_id": "uuid",
  "game_id": "uuid",
  "role": "user|assistant|system",
  "content": "......",
  "created_at": "2026-03-19T00:00:00Z",
  "judge": {
    "label": "YES|NO|UNKNOWN|IRRELEVANT|ASK_REPHRASE",
    "confidence": 0.82
  }
}
```

---

## 提示词（Prompt）与输出 Schema（建议）
### 生成汤面/汤底（Generator）
**目标**：一次性生成可玩且自洽的“汤面+结构化汤底”。

约束要点：
- 汤面不得包含汤底关键事实
- 汤底必须完整、无矛盾，且能支撑大量问答判定
- 给出 `key_facts` 列表用于“猜中判定/进度”

### 判定回答（Judge/Answerer）
输入：
- 汤面、结构化汤底、对话摘要（已确认/否定事实集合）、玩家问题

输出（强制 JSON）：
```json
{
  "label": "YES|NO|UNKNOWN|IRRELEVANT|ASK_REPHRASE",
  "answer_to_user": "是/否/不确定/无关/请换个问法（中文短句）",
  "confidence": 0.0,
  "rationale_private": "引用了哪些 key_facts / timeline 推导（不展示给玩家）",
  "reveals_solution": false,
  "suggested_followups": ["你可以问：..."]
}
```

泄底控制：
- 当 `allow_reveal=false`：`answer_to_user` 禁止出现 `solution.summary` 或任一 `key_facts.fact` 的原句/同义直述

---

## “已猜中”判定策略（可选但推荐）
两种方式：
- **硬规则**：当 `discovered_key_fact_ids` 覆盖全部 `must_be_discovered=true` 的事实即结束
- **软判定**：让模型输出是否“玩家已基本复原真相”（仍建议以 key_facts 为主，避免模型随意判定）

建议：以硬规则为主，软判定为辅（提示玩家接近真相）。

---

## 存储与隐私
### 本地存储（单机/MVP）
- 浏览器：`IndexedDB`（容量与结构更适合对话），或 `LocalStorage`（更简单但容量小）
- 桌面：SQLite

### 服务端存储（多端同步/多人）
- 数据库表：`games`、`messages`、`users`（可选）
- 对话中可能包含个人信息：建议提供“清空记录/导出/匿名模式”

---

## 接口草案（如采用服务端）
### 创建新局（生成汤面/汤底）
- `POST /api/games`
- 请求：`{ language, difficulty, theme?, safety? }`
- 响应：`{ game_id, surface_story, status }`（**不返回 solution**）

### 提问
- `POST /api/games/:id/ask`
- 请求：`{ question }`
- 响应：`{ label, answer_to_user, confidence, turn, status }`

### 获取历史
- `GET /api/games/:id/messages`

### 结束并查看汤底
- `POST /api/games/:id/end`（可选：自动 reveal）
- `GET /api/games/:id/solution`（需校验 reveal_policy / allow_reveal）

---

## 技术选型建议（不限定实现语言）
### AI 侧
建议选择支持：
- **结构化输出（JSON schema / tool calling）**
- **长上下文**（对话较长时）
- **稳定的指令遵循**（减少越界与幻觉）

落地方式：
- 单模型（简化）：生成 + 判定都用同一模型
- 双模型（更稳）：生成用更强模型；判定用更便宜但指令遵循好的模型

### 服务端
任意能快速实现 REST 的框架均可（Node/FastAPI/Go 等）。重点在：
- 会话与消息持久化
- 鉴权（多人/查看汤底）
- 防滥用（限流、内容安全）

### 前端
关键 UI：
- 汤面卡片
- 输入框 + 历史聊天气泡
- “提示/结束/查看汤底”按钮
- 状态：进行中/已结束、回合数、已确认事实数量（可选）

---

## 风险清单与缓解
- **幻觉（编造汤底外事实）**：结构化汤底 + schema 输出 + 自检步骤
- **泄底**：严格 reveal 开关；提示只给“方向”不给“结论”
- **不一致判定**：引入“已确认/否定事实集合”摘要，减少模型每次重新解释
- **上下文过长**：滑动窗口 + 摘要
- **内容安全**：生成阶段加入安全约束；对输入做基础过滤；必要时使用安全审查

---

## 验收标准（对应 5 条需求）
- **汤面**：新建一局必定返回可玩的 `surface_story`
- **提问**：玩家输入任意问题，系统可返回枚举化的 `label` + 面向玩家短答
- **判定**：回答不与汤底矛盾；遇到汤底未定义问题返回 UNKNOWN/IRRELEVANT
- **历史**：刷新/重开仍可看到本局历史（本地或服务端）
- **看汤底**：结束后能展示 `solution.summary` 与关键事实/时间线（受策略控制）

