import { motion } from "framer-motion";
import { categories } from "@/data/tiles";
import { useUIStore } from "@/store/useUIStore";

export default function CategoryNav() {
  const { selectedCategory, setSelectedCategory } = useUIStore();

  return (
    <div className="sticky top-0 z-40 bg-[#0d0d1a]/95 backdrop-blur-md border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <motion.button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              selectedCategory === null
                ? "bg-[#f5f0e8] text-[#0d0d1a]"
                : "bg-white/[0.05] text-[#f5f0e8]/50 hover:bg-white/[0.1] hover:text-[#f5f0e8]/80"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            全部
          </motion.button>
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              onClick={() =>
                setSelectedCategory(selectedCategory === cat.id ? null : cat.id)
              }
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                selectedCategory === cat.id
                  ? "text-[#0d0d1a]"
                  : "bg-white/[0.05] text-[#f5f0e8]/50 hover:bg-white/[0.1] hover:text-[#f5f0e8]/80"
              }`}
              style={
                selectedCategory === cat.id
                  ? { backgroundColor: cat.color }
                  : undefined
              }
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-base">{cat.icon}</span>
              <span>{cat.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
