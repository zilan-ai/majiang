## 1. 架构设计
纯前端项目，无后端服务。所有牌面数据内置在前端代码中。

```mermaid
flowchart TD
    "用户浏览器" --> "React SPA"
    "React SPA" --> "牌面数据 (内嵌JSON)"
    "React SPA" --> "样式系统 (Tailwind + CSS Variables)"
    "React SPA" --> "交互动画 (CSS Transitions + Framer Motion)"
```

## 2. 技术说明
- 前端：React@18 + TypeScript + Tailwind CSS@3 + Vite
- 初始化工具：vite-init (react-ts 模板)
- 状态管理：Zustand（筛选状态、弹窗状态）
- 动画库：framer-motion（牌面翻转、页面过渡、滚动动画）
- 后端：无
- 数据库：无（内嵌静态数据）

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | 牌面总览页（英雄区 + 类别筛选 + 牌面网格 + 功能牌 + 规则说明） |

## 4. 数据模型

### 4.1 牌面数据结构
```typescript
interface TileCategory {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  bgColor: string;
  tiles: Tile[];
}

interface Tile {
  char: string;
  category: string;
  isFunction?: boolean;
  functionDesc?: string;
  count: number;
}

interface FunctionTile extends Tile {
  isFunction: true;
  functionDesc: string;
  functionIcon: string;
}
```

### 4.2 九大类别数据
| 类别ID | 类别名 | 牌数 | 专属色 |
|--------|--------|------|--------|
| person | 人物称谓 | 18 | #d4a574 (琥珀) |
| nature | 自然万象 | 18 | #4a7c59 (翠绿) |
| action | 动作百态 | 18 | #c23616 (赤红) |
| adjective | 形容万物 | 18 | #2d5f8a (靛蓝) |
| spacetime | 时空方位 | 18 | #7b6b8d (紫灰) |
| number | 数字数量 | 18 | #b8860b (金棕) |
| abstract | 抽象概念 | 18 | #2d8a8a (青碧) |
| grammar | 语法虚词 | 18 | #6b6b6b (灰墨) |
| color | 颜色感觉 | 18 | #e84393 (五彩) |

### 4.3 功能牌数据
| 牌面 | 数量 | 功能 |
|------|------|------|
| 【替】 | 2 | 万能牌，代替任意字 |
| 【复】 | 2 | 复制牌，复制场上任意一张牌 |
| 【删】 | 2 | 删除牌，删除指定玩家亮出的一个字 |
| 【享】 | 2 | 共享牌，全场换牌 |
| 【禁】 | 2 | 禁止牌，跳过下家 |
| 【反】 | 2 | 反转牌，改变出牌顺序 |
| 【预】 | 2 | 预言牌，查看牌墙顶端5张 |
| 【换】 | 2 | 互换牌，与指定玩家交换一张手牌 |

## 5. 组件结构
```
src/
├── components/
│   ├── HeroSection.tsx        # 英雄区域
│   ├── CategoryNav.tsx        # 类别导航栏
│   ├── TileGrid.tsx           # 牌面网格容器
│   ├── TileCard.tsx           # 单张牌面卡片
│   ├── FunctionTileSection.tsx # 功能牌专区
│   ├── RuleSection.tsx        # 规则说明
│   └── TileDetailModal.tsx    # 牌面详情弹窗
├── data/
│   └── tiles.ts               # 牌面数据定义
├── store/
│   └── useGameStore.ts        # Zustand状态管理
├── pages/
│   └── Home.tsx               # 主页
├── App.tsx
└── main.tsx
```
