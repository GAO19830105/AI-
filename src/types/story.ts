import type { TDifficulty, TTurtleSoupStory } from '../data/stories';

export type { TDifficulty, TTurtleSoupStory };

/** 大厅卡片等 UI：在题库条目上可增加分类与一句话简介（可选） */
export type TStory = TTurtleSoupStory & {
  category?: string;
  summary?: string;
};

/** 游戏页一局状态：进行中可提问；已结束后不再交互（通常随即返回大厅） */
export type TGamePhase = 'playing' | 'ended';

export type TMessageRole = 'user' | 'assistant';

export type TMessage = {
  id: string;
  role: TMessageRole;
  content: string;
  timestamp: number;
};
