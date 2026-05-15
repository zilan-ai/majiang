import { useState } from "react";
import { motion } from "framer-motion";
import { functionTiles } from "@/data/tiles";
import { useUIStore } from "@/store/useUIStore";

export default function FunctionTileSection() {
  const { setSelectedTile } = useUIStore();
  const [hoveredTile, setHoveredTile] = useState<string | null>(null);

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-1 h-8 rounded-full bg-[#c23616]" />
          <div>
            <h2 className="text-2xl font-bold tracking-wide text-[#c23616]">
              ⚡ 功能牌
            </h2>
            <p className="text-sm text-[#f5f0e8]/30 mt-0.5">既是工具，也是词语</p>
          </div>
          <div className="flex-1 h-px ml-4 bg-[#c23616]/20" />
          <span className="text-xs text-[#f5f0e8]/20">16张</span>
        </div>

        <div className="rounded-2xl p-6 md:p-8 bg-[#1a1a2e]/60 border border-[#c23616]/20">
          <motion.div
            layout
            className="flex flex-wrap gap-3 md:gap-4 justify-center"
          >
            {functionTiles.map((tile, index) => (
              <motion.div
                key={tile.char}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{
                  y: -8,
                  scale: 1.05,
                  transition: { duration: 0.2 },
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedTile(tile)}
                onMouseEnter={() => setHoveredTile(tile.char)}
                onMouseLeave={() => setHoveredTile(null)}
                className="cursor-pointer group relative"
              >
                <div
                  className="relative w-[72px] h-[96px] md:w-[84px] md:h-[112px] rounded-xl overflow-hidden transition-all duration-300 group-hover:shadow-[0_8px_32px_rgba(194,54,22,0.4)]"
                  style={{
                    background: "linear-gradient(145deg, #faf6ee 0%, #f0e8d8 50%, #e8dcc8 100%)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)",
                  }}
                >
                  <div
                    className="absolute top-0 right-0 w-10 h-10 md:w-12 md:h-12"
                    style={{
                      background: "linear-gradient(135deg, #c23616 0%, #c2361699 100%)",
                      clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                    }}
                  />
                  <div className="absolute top-0.5 right-0.5 md:top-1 md:right-1 text-white/80 text-[9px] md:text-[11px] font-bold leading-tight text-right" style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
                    功能
                  </div>
                  <div className="flex items-center justify-center h-full">
                    <span
                      className="text-3xl md:text-4xl font-bold select-none"
                      style={{
                        color: "#c23616",
                        textShadow: "1px 1px 0 rgba(255,255,255,0.8), -1px -1px 0 rgba(0,0,0,0.05)",
                        fontFamily: "'SimSun', 'Songti SC', 'Noto Serif CJK SC', serif",
                      }}
                    >
                      {tile.char}
                    </span>
                  </div>
                  <div
                    className="absolute bottom-0 left-0 right-0 h-5 flex items-center justify-center text-[8px] md:text-[9px] font-medium tracking-wider"
                    style={{ color: "#c23616", opacity: 0.6 }}
                  >
                    {tile.functionIcon} 功能牌
                  </div>
                  <div
                    className="absolute inset-0 rounded-xl border opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ borderColor: "#c23616", borderWidth: "2px" }}
                  />
                </div>

                {hoveredTile === tile.char && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-max max-w-[200px]"
                  >
                    <div className="bg-[#1a1a2e]/95 border border-[#c23616]/30 rounded-lg px-3 py-2 text-xs text-[#f5f0e8]/80 leading-relaxed shadow-lg backdrop-blur-sm">
                      <span className="text-[#c23616] font-bold">【{tile.char}】</span>
                      {" "}{tile.functionDesc}
                    </div>
                    <div className="w-2 h-2 bg-[#1a1a2e]/95 border-l border-t border-[#c23616]/30 rotate-45 absolute -top-1 left-1/2 -translate-x-1/2" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
