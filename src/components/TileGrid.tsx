import { motion } from "framer-motion";
import { Tile, TileCategory, categories } from "@/data/tiles";
import { useUIStore } from "@/store/useUIStore";

function TileCard({ tile, category, index }: { tile: Tile; category: TileCategory; index: number }) {
  const { setSelectedTile } = useUIStore();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.4, delay: index * 0.02 }}
      whileHover={{
        y: -8,
        scale: 1.05,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setSelectedTile(tile)}
      className="cursor-pointer group"
    >
      <div
        className="relative w-[72px] h-[96px] md:w-[84px] md:h-[112px] rounded-xl overflow-hidden transition-all duration-300 group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        style={{
          background: "linear-gradient(145deg, #faf6ee 0%, #f0e8d8 50%, #e8dcc8 100%)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
      >
        <div
          className="absolute top-0 right-0 w-6 h-6 md:w-7 md:h-7"
          style={{
            background: `linear-gradient(135deg, ${category.color} 0%, ${category.color}99 100%)`,
            clipPath: "polygon(100% 0, 0 0, 100% 100%)",
          }}
        />
        <div className="absolute top-0.5 right-0.5 md:top-1 md:right-1 text-white/80 text-[8px] md:text-[9px] font-bold">
          {category.name.slice(0, 2)}
        </div>
        <div className="flex items-center justify-center h-full">
          <span
            className="text-3xl md:text-4xl font-bold select-none"
            style={{
              color: "#1a1a2e",
              textShadow: "1px 1px 0 rgba(255,255,255,0.8), -1px -1px 0 rgba(0,0,0,0.05)",
              fontFamily: "'SimSun', 'Songti SC', 'Noto Serif CJK SC', serif",
            }}
          >
            {tile.char}
          </span>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-5 flex items-center justify-center text-[8px] md:text-[9px] font-medium tracking-wider"
          style={{ color: category.color, opacity: 0.6 }}
        >
          {category.name}
        </div>
        <div
          className="absolute inset-0 rounded-xl border opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ borderColor: category.color, borderWidth: "2px" }}
        />
      </div>
    </motion.div>
  );
}

export default function TileGrid() {
  const { selectedCategory } = useUIStore();

  const filteredCategories = selectedCategory
    ? categories.filter((cat: TileCategory) => cat.id === selectedCategory)
    : categories;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {filteredCategories.map((category: TileCategory) => (
        <motion.section
          key={category.id}
          id={category.id}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-1 h-8 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <div>
              <h2
                className="text-2xl font-bold tracking-wide"
                style={{ color: category.color }}
              >
                {category.icon} {category.name}
              </h2>
              <p className="text-sm text-[#f5f0e8]/30 mt-0.5">{category.subtitle}</p>
            </div>
            <div className="flex-1 h-px ml-4" style={{ backgroundColor: `${category.color}20` }} />
            <span className="text-xs text-[#f5f0e8]/20">{category.tiles.length}张</span>
          </div>
          <div
            className="rounded-2xl p-6 md:p-8"
            style={{ backgroundColor: category.bgColor, borderColor: category.borderColor, borderWidth: "1px" }}
          >
            <motion.div
              layout
              className="flex flex-wrap gap-3 md:gap-4 justify-center"
            >
              {category.tiles.map((tile: Tile, index: number) => (
                <TileCard
                  key={`${category.id}-${tile.char}`}
                  tile={tile}
                  category={category}
                  index={index}
                />
              ))}
            </motion.div>
          </div>
        </motion.section>
      ))}
    </div>
  );
}
