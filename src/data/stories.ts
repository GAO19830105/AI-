/**
 * 海龟汤题库（PRD：汤面展示、汤底用于 AI 判定与揭晓页）
 * 对接后端后可改为 GET /api/stories 拉取并替换本文件数据。
 */

/** 难度分级：与大厅标签一致 */
export type TDifficulty = 'easy' | 'medium' | 'hard';

/** 单条海龟汤：核心字段 */
export type TTurtleSoupStory = {
  id: string;
  title: string;
  difficulty: TDifficulty;
  /** 汤面：玩家可见的谜面描述 */
  surface: string;
  /** 汤底：完整真相；勿在对话中直接泄露给玩家 */
  bottom: string;
};

export const stories: TTurtleSoupStory[] = [
  {
    id: 'elevator_umbrella',
    title: '电梯里的雨伞',
    difficulty: 'easy',
    surface:
      '一个小男孩住在高层公寓。每天放学回家，他会独自乘电梯到某一楼层，然后走楼梯到家门口。唯独下雨天，他可以一直乘电梯直达自家那一层。为什么？',
    bottom:
      '男孩个子太矮，按不到自家楼层更高的按钮，只能先按够得着的低层再走楼梯。下雨天他会带长柄雨伞，进电梯后用伞尖按到自家楼层的按钮，所以雨天可以直达。',
  },
  {
    id: 'insulin_midnight',
    title: '深夜的冰箱',
    difficulty: 'easy',
    surface:
      '独居的男人有严重的低血糖，医生嘱咐他睡前必须在床头备好糖水或甜食。某天深夜他梦游走进厨房，从冰箱里拿东西吃得很满足，然后回房继续睡。第二天早上，人们发现他死在床上。发生了什么？',
    bottom:
      '他梦游时把冰箱里备用的胰岛素注射液当成「甜饮料」喝了下去（或误服了过量降糖相关药物）。胰岛素大幅降低血糖，他在睡梦中发生严重低血糖休克死亡。',
  },
  {
    id: 'desert_balloon',
    title: '沙漠与半根火柴',
    difficulty: 'medium',
    surface:
      '沙漠中央躺着三具尸体，身边散落着行李与杂物，旁边还有半根被折断的火柴。附近没有第四个人，也没有搏斗痕迹。他们是怎么死的？',
    bottom:
      '三人同乘热气球，超载即将坠毁。他们决定抽签：每人抽一根火柴，抽到最短的人跳下去减轻重量。其中一人抽到被事先掰断的半根火柴（最短），只能跳下跌死；另外两人在气球上仍无法支撑，最终也坠毁身亡。半根火柴就是那次抽签的遗物。',
  },
  {
    id: 'funeral_stranger',
    title: '葬礼上的陌生人',
    difficulty: 'medium',
    surface:
      '姐姐在参加完一位亲人的葬礼后，对妹妹描述：她在葬礼上见到一个陌生男人，一见钟情，却忘了问联系方式。不久后，妹妹被人杀害。为什么？',
    bottom:
      '姐姐为了能在葬礼上再次见到那个「陌生男人」，认为只要再办一场葬礼对方就可能出现，于是杀害了妹妹，以便制造新的葬礼「偶遇」机会。（经典海龟汤变体，动机为病态执念。）',
  },
  {
    id: 'aquarium_smile',
    title: '鱼缸前的微笑',
    difficulty: 'hard',
    surface:
      '男人曾遭遇海难，与同伴在孤岛上靠同伴找来的「肉」撑到获救。多年后，他走进一家海鲜餐厅，盯着水族箱里的鱼看了一会儿，露出释然的微笑。第二天，他被发现自杀身亡。为什么？',
    bottom:
      '获救后他才知道，海难时同伴喂给他的并不是鱼或野兽的肉，而是另一位遇难者的遗体。那天在餐厅，他认出鱼缸里某种鱼的形态、斑纹与当年吃到的「肉」完全对不上——意识到自己当年吃的其实是人肉，精神崩溃后自杀。',
  },
];

/** 与既有代码兼容的别名 */
export const STORIES = stories;

export function getStoryById(id: string): TTurtleSoupStory | undefined {
  return stories.find((s) => s.id === id);
}
