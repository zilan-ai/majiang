export interface TileData {
  id: string;
  char: string;
  category: string;
  isFunction: boolean;
  functionDesc?: string;
  count: number;
}

export interface Player {
  id: string;
  name: string;
  hand: TileData[];
  seatIndex: number;
  isReady: boolean;
  isOnline: boolean;
  exposedWords: string[];
}

export type GamePhase = "waiting" | "playing" | "eating" | "function" | "winning" | "win-voting" | "voting" | "final-voting" | "ended";

export type Direction = 1 | -1;

export interface WinDeclaration {
  playerId: string;
  sentence: string;
  tiles: TileData[];
  homophones: { tileId: string; original: string; homophone: string }[];
  editedTiles: { tileId: string; original: string; edited: string }[];
  combinedGroups: string[][];
}

export interface GameLogEntry {
  id: number;
  message: string;
  time: number;
  visibleTileId?: string;
  visibleTileChar?: string;
  visiblePlayerId?: string;
}

export interface GameState {
  roomId: string;
  players: Player[];
  deck: TileData[];
  discardPile: TileData[];
  currentPlayerIndex: number;
  direction: Direction;
  phase: GamePhase;
  lastDiscardedTile: TileData | null;
  lastDiscardedBy: string | null;
  wallTop: number;
  turnCount: number;
  winnerId: string | null;
  winDeclaration: WinDeclaration | null;
  finishedDeclarations: WinDeclaration[];
  finalVotes: Record<string, string>;
  votes: Record<string, boolean>;
  winApprovalVotes: Record<string, boolean>;
  gameLog: GameLogEntry[];
  skipNextPlayer: boolean;
  firstTurn?: boolean;
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
