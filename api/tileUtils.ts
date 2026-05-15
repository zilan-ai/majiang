import { TileData } from "../shared/types";

const categoryChars: Record<string, string[]> = {
  person: ["我","你","他","哥","姐","妹","伯","爷","奶","婆","孙","侄","夫","民","官","女","人"],
  nature: ["日","月","星","天","山","森","林","土","海","江","花","草","虫","鸟","风","云","电"],
  action: ["吃","跑","跳","走","看","听","说","写","买","找","逃","吞","叫","带","催","想","思","爱","恨","喜","怒","哭","梦","情","玩","会","藏","当"],
  adjective: ["大","巨","高","低","长","短","快","慢","新","旧","好","坏","丑","真","老","冷","热"],
  spacetime: ["上","下","左","右","前","后","东","南","北","中","外","里","古","今","年","刻","春","秋"],
  number: ["二","六","七","百","亿","零","两","多","少","半","全","都","次","独","无","空","对","错"],
  abstract: ["书","本","笔","机","网","脑","手","家","校","路","法","道","文","学","谁"],
  grammar: ["的","了","着","过","吗","呢","吧","啊","呀","哇","喂","和","与","或","但","从","不","是"],
  color: ["红","黑","蓝","绿","黄","紫","橙","粉","棕","朱","绯","彤","银","墨"],
};

const functionChars: { char: string; desc: string; count: number }[] = [
  { char: "替", desc: "万能牌，代替任意字", count: 2 },
  { char: "复", desc: "复制牌，复制场上任意一张牌", count: 2 },
  { char: "删", desc: "删除牌，删除指定玩家亮出的一个字", count: 2 },
  { char: "享", desc: "共享牌，全场换牌", count: 2 },
  { char: "禁", desc: "禁止牌，跳过下家", count: 2 },
  { char: "反", desc: "反转牌，改变出牌顺序", count: 2 },
  { char: "预", desc: "预言牌，查看牌墙顶端5张", count: 2 },
  { char: "换", desc: "互换牌，与指定玩家交换一张手牌", count: 2 },
];

let tileIdCounter = 0;

function createTile(char: string, category: string, isFunction: boolean, functionDesc?: string): TileData {
  return {
    id: `tile-${tileIdCounter++}`,
    char,
    category,
    isFunction,
    functionDesc,
    count: 1,
  };
}

export function createFullDeck(): TileData[] {
  tileIdCounter = 0;
  const deck: TileData[] = [];

  for (const [category, chars] of Object.entries(categoryChars)) {
    for (const char of chars) {
      deck.push(createTile(char, category, false));
    }
  }

  for (const fc of functionChars) {
    for (let i = 0; i < fc.count; i++) {
      deck.push(createTile(fc.char, "function", true, fc.desc));
    }
  }

  return deck;
}

export function shuffleDeck(deck: TileData[]): TileData[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealHands(deck: TileData[], playerCount: number, handSize: number = 13): { hands: TileData[][]; remainingDeck: TileData[] } {
  const hands: TileData[][] = [];
  const deckCopy = [...deck];

  for (let p = 0; p < playerCount; p++) {
    const hand: TileData[] = [];
    for (let i = 0; i < handSize; i++) {
      if (deckCopy.length > 0) {
        hand.push(deckCopy.shift()!);
      }
    }
    hands.push(hand);
  }

  return { hands, remainingDeck: deckCopy };
}
