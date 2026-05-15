import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/store/useUIStore";
import { categories } from "@/data/tiles";

export default function TileDetailModal() {
  const { selectedTile, isModalOpen, setIsModalOpen } = useUIStore();

  if (!selectedTile) return null;

  const category = selectedTile.isFunction
    ? null
    : categories.find((c) => c.id === selectedTile.category);

  return (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 max-w-md w-full"
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: selectedTile.isFunction
                  ? "linear-gradient(145deg, #1a1a2e 0%, #252540 100%)"
                  : "linear-gradient(145deg, #faf6ee 0%, #f0e8d8 50%, #e8dcc8 100%)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
              }}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: selectedTile.isFunction ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                  color: selectedTile.isFunction ? "#f5f0e8" : "#1a1a2e",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 1l12 12M13 1L1 13" />
                </svg>
              </button>

              <div className="p-8 text-center">
                <div className="mb-6">
                  <div
                    className="inline-flex items-center justify-center w-28 h-36 md:w-32 md:h-40 rounded-xl relative"
                    style={
                      selectedTile.isFunction
                        ? {
                            background: "linear-gradient(145deg, #1a1a2e 0%, #252540 100%)",
                            border: "2px solid rgba(212,165,116,0.3)",
                            boxShadow: "0 4px 24px rgba(194,54,22,0.2)",
                          }
                        : {
                            background: "linear-gradient(145deg, #faf6ee 0%, #f0e8d8 50%, #e8dcc8 100%)",
                            boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)",
                          }
                    }
                  >
                    {category && (
                      <div
                        className="absolute top-0 right-0 w-8 h-8"
                        style={{
                          background: `linear-gradient(135deg, ${category.color} 0%, ${category.color}99 100%)`,
                          clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                        }}
                      />
                    )}
                    <span
                      className="text-5xl md:text-6xl font-bold select-none"
                      style={{
                        color: selectedTile.isFunction ? "#c23616" : "#1a1a2e",
                        textShadow: selectedTile.isFunction
                          ? "0 0 30px rgba(194,54,22,0.4)"
                          : "1px 1px 0 rgba(255,255,255,0.8), -1px -1px 0 rgba(0,0,0,0.05)",
                        fontFamily: "'SimSun', 'Songti SC', 'Noto Serif CJK SC', serif",
                      }}
                    >
                      {selectedTile.isFunction ? (
                        <>
                          <span className="text-[#d4a574]/60 text-3xl">【</span>
                          {selectedTile.char}
                          <span className="text-[#d4a574]/60 text-3xl">】</span>
                        </>
                      ) : (
                        selectedTile.char
                      )}
                    </span>
                  </div>
                </div>

                {category && (
                  <div className="mb-4">
                    <span
                      className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${category.color}20`,
                        color: category.color,
                      }}
                    >
                      {category.icon} {category.name}
                    </span>
                  </div>
                )}

                {selectedTile.isFunction && (
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-[#c23616]/20 text-[#c23616]">
                      ⚡ 功能牌
                    </span>
                  </div>
                )}

                <h3
                  className="text-2xl font-bold mb-2"
                  style={{ color: selectedTile.isFunction ? "#f5f0e8" : "#1a1a2e" }}
                >
                  {selectedTile.isFunction
                    ? `【${selectedTile.char}】`
                    : selectedTile.char}
                </h3>

                {selectedTile.isFunction && selectedTile.functionDesc && (
                  <p className="text-[#f5f0e8]/60 text-sm mb-2">
                    {selectedTile.functionDesc}
                  </p>
                )}

                {category && (
                  <p className="text-sm opacity-50" style={{ color: "#1a1a2e" }}>
                    {category.subtitle}
                  </p>
                )}

                <div
                  className="mt-4 text-xs opacity-30"
                  style={{ color: selectedTile.isFunction ? "#f5f0e8" : "#1a1a2e" }}
                >
                  数量：×{selectedTile.count}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
