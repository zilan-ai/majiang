import { create } from "zustand";

export interface PublicTile {
  id: string;
  char: string;
  category: string;
  isFunction: boolean;
  functionDesc?: string;
  count: number;
}

export interface PublicPlayer {
  id: string;
  name: string;
  handSize: number;
  hand: PublicTile[];
  seatIndex: number;
  isReady: boolean;
  isOnline: boolean;
  exposedWords: string[];
  handOrder?: string[];
  combinedGroups?: string[][];
}

export interface PublicWinDeclaration {
  playerId: string;
  sentence: string;
  tiles: PublicTile[];
  homophones: { tileId: string; original: string; homophone: string }[];
  editedTiles: { tileId: string; original: string; edited: string }[];
  combinedGroups: string[][];
}

export interface PublicGameLogEntry {
  id: number;
  message: string;
  time: number;
  visibleTileId?: string;
  visibleTileChar?: string;
  visiblePlayerId?: string;
}

export interface PublicGameState {
  roomId: string;
  currentPlayerIndex: number;
  direction: 1 | -1;
  phase: string;
  lastDiscardedTile: PublicTile | null;
  lastDiscardedBy: string | null;
  wallTop: number;
  turnCount: number;
  winnerId: string | null;
  winDeclaration: PublicWinDeclaration | null;
  finishedDeclarations: PublicWinDeclaration[];
  finalVotes: Record<string, string>;
  votes: Record<string, boolean>;
  winApprovalVotes: Record<string, boolean>;
  gameLog: PublicGameLogEntry[];
  skipNextPlayer: boolean;
  firstTurn?: boolean;
  players: PublicPlayer[];
  discardPile: PublicTile[];
  functionCardState: {
    type: string | null;
    waitingFor: string | null;
    data: Record<string, unknown>;
  };
}

export interface RoomInfo {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  isPlaying: boolean;
  hostId: string;
  hasPassword: boolean;
}

export interface ChatMessage {
  playerId: string;
  name: string;
  message: string;
  time: number;
}

interface GameStoreState {
  myId: string;
  myName: string;
  roomId: string | null;
  gameState: PublicGameState | null;
  rooms: RoomInfo[];
  chatMessages: ChatMessage[];
  errorMessage: string | null;
  isConnected: boolean;

  setMyId: (id: string) => void;
  setMyName: (name: string) => void;
  setRoomId: (id: string | null) => void;
  setGameState: (state: PublicGameState) => void;
  setRooms: (rooms: RoomInfo[]) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setError: (msg: string | null) => void;
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

export const useGameStore = create<GameStoreState>((set) => ({
  myId: "",
  myName: "",
  roomId: null,
  gameState: null,
  rooms: [],
  chatMessages: [],
  errorMessage: null,
  isConnected: false,

  setMyId: (id) => set({ myId: id }),
  setMyName: (name) => set({ myName: name }),
  setRoomId: (id) => set({ roomId: id }),
  setGameState: (state) => set({ gameState: state }),
  setRooms: (rooms) => set({ rooms }),
  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  setError: (msg) => set({ errorMessage: msg }),
  setConnected: (connected) => set({ isConnected: connected }),
  reset: () => set({ roomId: null, gameState: null, chatMessages: [], errorMessage: null }),
}));
