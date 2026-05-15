import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { totalTiles, totalBasicTiles, totalFunctionTiles, categories } from "@/data/tiles";

const inkDrops = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 4 + 2,
  delay: Math.random() * 3,
  duration: Math.random() * 4 + 4,
}));

const floatingChars = ["麻", "将", "文", "字", "胡", "吃", "碰", "杠"];

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0d0d1a]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d1a] via-[#1a1a2e] to-[#0d0d1a]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {inkDrops.map((drop) => (
          <motion.div
            key={drop.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${drop.x}%`,
              top: `${drop.y}%`,
              width: drop.size,
              height: drop.size,
            }}
            animate={{
              opacity: [0, 0.15, 0],
              scale: [1, 2, 1],
            }}
            transition={{
              duration: drop.duration,
              delay: drop.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
        {floatingChars.map((char, i) => (
          <motion.div
            key={i}
            className="absolute text-white/[0.04] font-serif select-none pointer-events-none"
            style={{
              left: `${10 + i * 10}%`,
              top: `${20 + (i % 3) * 25}%`,
              fontSize: `${80 + i * 20}px`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, i % 2 === 0 ? 5 : -5, 0],
            }}
            transition={{
              duration: 6 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          >
            {char}
          </motion.div>
        ))}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#c23616]/[0.03] blur-[120px]" />
      </div>

      <div className="relative z-10 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <div className="mb-6">
            <span className="inline-block px-4 py-1.5 text-xs tracking-[0.3em] text-[#c23616] border border-[#c23616]/30 rounded-full uppercase">
              脑洞大开版
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#f5f0e8] via-[#d4a574] to-[#c23616]">
              文字麻将
            </span>
          </h1>
          <motion.p
            className="text-base sm:text-lg md:text-xl text-[#f5f0e8]/50 max-w-2xl mx-auto mb-8 sm:mb-12 font-light tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            以字为牌，以句为胡——当麻将遇上汉字，一切皆可成句
          </motion.p>
        </motion.div>

        <motion.div
          className="flex flex-wrap justify-center gap-6 md:gap-10 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          {[
            { label: "总牌数", value: totalTiles, unit: "张" },
            { label: "基础字牌", value: totalBasicTiles, unit: "张" },
            { label: "功能牌", value: totalFunctionTiles, unit: "张" },
            { label: "类别", value: categories.length, unit: "类" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#f5f0e8]">
                {stat.value}
                <span className="text-sm font-normal text-[#f5f0e8]/40 ml-1">{stat.unit}</span>
              </div>
              <div className="text-xs text-[#f5f0e8]/30 mt-1 tracking-wider">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mb-12"
        >
          <button
            onClick={() => navigate("/lobby")}
            className="group relative px-12 py-4 rounded-2xl bg-gradient-to-r from-[#c23616] to-[#a52a14] text-white font-bold text-xl tracking-wider hover:from-[#d44020] hover:to-[#c23616] transition-all duration-300 shadow-[0_0_40px_rgba(194,54,22,0.3)] hover:shadow-[0_0_60px_rgba(194,54,22,0.5)] hover:scale-105 active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-3">
              🎴 开始游戏
            </span>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
        >
          <div className="flex justify-center">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-[#f5f0e8]/20"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
