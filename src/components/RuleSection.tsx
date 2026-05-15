import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RuleSection {
  title: string;
  icon: string;
  content: React.ReactNode;
}

const sections: RuleSection[] = [
  {
    title: "游戏概览",
    icon: "🎲",
    content: (
      <div className="space-y-3 text-sm text-[#f5f0e8]/60 leading-relaxed">
        <p><span className="text-[#f5f0e8]/80 font-medium">玩家人数：</span>2-6人</p>
        <p><span className="text-[#f5f0e8]/80 font-medium">牌具总数：</span>178张（基础字牌162张 + 功能牌16张）</p>
        <p><span className="text-[#f5f0e8]/80 font-medium">核心理念：</span>这不再是一个单纯凑牌的游戏，而是一个语言创造和脑洞比拼的游戏。胡牌没有固定公式，一切解释权归"牌桌法庭"（所有玩家）所有。</p>
      </div>
    ),
  },
  {
    title: "核心玩法流程",
    icon: "🔄",
    content: (
      <div className="space-y-4 text-sm text-[#f5f0e8]/60 leading-relaxed">
        <div>
          <p className="text-[#f5f0e8]/80 font-medium mb-2">1. 开局</p>
          <p>每个玩家摸13张牌（起手13张），然后随机一个玩家摸牌出牌。</p>
        </div>
        <div>
          <p className="text-[#f5f0e8]/80 font-medium mb-2">2. 出牌循环</p>
          <p>打出一张牌，之后按逆时针方向，下家摸一张牌，然后打出一张牌，依次循环。</p>
        </div>
        <div className="rounded-lg bg-[#c23616]/10 border border-[#c23616]/20 p-4">
          <p className="text-[#c23616] font-medium mb-2">✦ 核心机制：自由吃牌</p>
          <ul className="space-y-2 text-[#f5f0e8]/60">
            <li><span className="text-[#f5f0e8]/80">无条件吃牌：</span>当上家打出一张牌时，你可以选择"吃"进这张牌。不需要用手中的牌去配合它组成词语。</li>
            <li><span className="text-[#f5f0e8]/80">目的：</span>囤积关键字、替换废牌、或单纯为了不让下家摸到。</li>
            <li><span className="text-[#f5f0e8]/80">平衡：</span>吃牌后，必须立即打出一张牌，保持手牌数量平衡。</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: "胡牌条件",
    icon: "🏆",
    content: (
      <div className="space-y-4 text-sm text-[#f5f0e8]/60 leading-relaxed">
        <p>当你认为手中的牌（通常为14张）可以组成一句或几句语义通顺的话时且手上不能带有除了功能牌【替】【复】时，就可以宣布"胡牌"。</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
            <p className="text-[#d4a574] font-medium mb-1">没有固定结构</p>
            <p>不需要凑齐4组+1对。可以是14字长句，也可以是"3字+5字+6字"三段式，甚至一首打油诗。</p>
          </div>
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
            <p className="text-[#d4a574] font-medium mb-1">允许谐音</p>
            <p>牌面上的字可以谐音使用。例如"河"可当"何"或"和"。胡牌时需说明谐音逻辑。</p>
          </div>
        </div>
        <div>
          <p className="text-[#f5f0e8]/80 font-medium mb-2">胡牌流程</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>摸牌或吃牌后排序好句子，点击胡牌</li>
            <li>展示牌面：亮出所有手牌，陈述你的句子</li>
            <li>玩家裁决：其他三位玩家投票，票多者胜</li>
          </ol>
        </div>
      </div>
    ),
  },
  {
    title: "功能牌详解",
    icon: "⚡",
    content: (
      <div className="space-y-2 text-sm">
        <p className="text-[#f5f0e8]/60 mb-4">功能牌在"脑洞版"规则下，既是工具也是"词语"。在自己的回合（摸牌后、打牌前）打出。</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="py-2 pr-4 text-[#c23616] font-medium text-xs">类型</th>
                <th className="py-2 pr-4 text-[#d4a574] font-medium text-xs">牌面</th>
                <th className="py-2 text-[#f5f0e8]/50 font-medium text-xs">功能说明</th>
              </tr>
            </thead>
            <tbody className="text-[#f5f0e8]/60">
              <tr className="border-b border-white/[0.03]">
                <td className="py-2.5 pr-4 text-xs">万能牌</td>
                <td className="py-2.5 pr-4 font-bold text-[#c23616]">【替】×2</td>
                <td className="py-2.5 text-xs">胡牌造句时可以是任何你需要的字</td>
              </tr>
              <tr className="border-b border-white/[0.03]">
                <td className="py-2.5 pr-4 text-xs">复制牌</td>
                <td className="py-2.5 pr-4 font-bold text-[#c23616]">【复】×2</td>
                <td className="py-2.5 text-xs">胡牌时可以视为自己复制场上任意一张牌</td>
              </tr>
              <tr className="border-b border-white/[0.03]">
                <td className="py-2.5 pr-4 text-xs">删除牌</td>
                <td className="py-2.5 pr-4 font-bold text-[#c23616]">【删】×2</td>
                <td className="py-2.5 text-xs">随机删除任意一名未胡牌玩家手牌中的一张牌，随后被删除玩家自动摸一张牌</td>
              </tr>
              <tr className="border-b border-white/[0.03]">
                <td className="py-2.5 pr-4 text-xs">共享牌</td>
                <td className="py-2.5 pr-4 font-bold text-[#c23616]">【享】×2</td>
                <td className="py-2.5 text-xs">全场换牌，所有未胡牌的玩家打出一张牌，由打出的玩家依次选择一张牌</td>
              </tr>
              <tr className="border-b border-white/[0.03]">
                <td className="py-2.5 pr-4 text-xs">禁止牌</td>
                <td className="py-2.5 pr-4 font-bold text-[#c23616]">【禁】×2</td>
                <td className="py-2.5 text-xs">跳过下家，下家不摸牌、不打牌</td>
              </tr>
              <tr className="border-b border-white/[0.03]">
                <td className="py-2.5 pr-4 text-xs">反转牌</td>
                <td className="py-2.5 pr-4 font-bold text-[#c23616]">【反】×2</td>
                <td className="py-2.5 text-xs">将出牌顺序反转（顺时针 ⇋ 逆时针）</td>
              </tr>
              <tr className="border-b border-white/[0.03]">
                <td className="py-2.5 pr-4 text-xs">预言牌</td>
                <td className="py-2.5 pr-4 font-bold text-[#c23616]">【预】×2</td>
                <td className="py-2.5 text-xs">查看牌墙顶端五张牌，可按任意顺序放回牌墙顶部</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-xs">互换牌</td>
                <td className="py-2.5 pr-4 font-bold text-[#c23616]">【换】×2</td>
                <td className="py-2.5 text-xs">指定一名玩家，双方各选一张手牌背面朝上同时交换</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
];

export default function RuleSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-1 h-8 rounded-full bg-[#d4a574]" />
          <div>
            <h2 className="text-2xl font-bold tracking-wide text-[#d4a574]">
              📜 规则说明书
            </h2>
            <p className="text-sm text-[#f5f0e8]/30 mt-0.5">创新文字麻将·脑洞大开版</p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#1a1a2e]/40 border border-white/[0.06] overflow-hidden">
          {sections.map((section, index) => (
            <div key={index} className="border-b border-white/[0.04] last:border-b-0">
              <motion.button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center gap-3 text-left hover:bg-white/[0.02] transition-colors"
                whileTap={{ scale: 0.995 }}
              >
                <span className="text-lg">{section.icon}</span>
                <span className="text-[#f5f0e8]/80 font-medium flex-1">{section.title}</span>
                <motion.span
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-[#f5f0e8]/30"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 6l4 4 4-4" />
                  </svg>
                </motion.span>
              </motion.button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5">{section.content}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
