import { create } from "zustand";

interface UIStoreState {
  selectedCategory: string | null;
  setSelectedCategory: (id: string | null) => void;
  selectedTile: {
    char: string;
    category: string;
    count: number;
    isFunction?: boolean;
    functionDesc?: string;
    functionIcon?: string;
  } | null;
  setSelectedTile: (tile: UIStoreState["selectedTile"]) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStoreState>((set) => ({
  selectedCategory: null,
  setSelectedCategory: (id) => set({ selectedCategory: id }),
  selectedTile: null,
  setSelectedTile: (tile) => set({ selectedTile: tile, isModalOpen: true }),
  isModalOpen: false,
  setIsModalOpen: (open) => set({ isModalOpen: open, selectedTile: open ? undefined : null }),
}));
