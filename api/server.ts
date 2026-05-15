import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { GameState, Player, RoomInfo, TileData } from "../shared/types";
import { createGame, drawTile, playTile, eatTile, playAfterEat, declareWin, castWinApprovalVote, castFinalVote, checkFinalVotingComplete, resolveFinalVoting, executeFunctionCard, finishFunctionCard, getPublicGameState, appendLog } from "./gameEngine";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const rooms = new Map<string, GameState>();
const roomPasswords = new Map<string, string>();
const playerRoomMap = new Map<string, string>();
const playerNames = new Map<string, string>();
const playerLayouts = new Map<string, { handOrder: string[]; combinedGroups: string[][] }>();

function generateRoomId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 5; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

io.on("connection", (socket) => {
  console.log(`[连接] ${socket.id}`);

  socket.on("set-name", (name: string) => {
    playerNames.set(socket.id, name || `玩家${socket.id.slice(0, 4)}`);
  });

  socket.on("create-room", (data: { roomName: string; password?: string }) => {
    const roomName = typeof data === "string" ? data : data.roomName;
    const password = typeof data === "string" ? "" : (data.password || "");
    const roomId = generateRoomId();
    const name = playerNames.get(socket.id) || `玩家${socket.id.slice(0, 4)}`;

    const player: Player = {
      id: socket.id,
      name,
      hand: [],
      seatIndex: 0,
      isReady: false,
      isOnline: true,
      exposedWords: [],
    };

    const game: GameState = {
      roomId,
      players: [player],
      deck: [],
      discardPile: [],
      currentPlayerIndex: 0,
      direction: 1,
      phase: "waiting",
      lastDiscardedTile: null,
      lastDiscardedBy: null,
      wallTop: 0,
      turnCount: 0,
      winnerId: null,
      winDeclaration: null,
      finishedDeclarations: [],
      finalVotes: {},
      votes: {},
      winApprovalVotes: {},
      gameLog: [],
      skipNextPlayer: false,
      firstTurn: false,
      functionCardState: { type: null, waitingFor: null, data: {} },
    };

    rooms.set(roomId, game);
    if (password) {
      roomPasswords.set(roomId, password);
    }
    playerRoomMap.set(socket.id, roomId);
    socket.join(roomId);

    socket.emit("room-created", { roomId, gameState: getPublicGameState(game, socket.id) });
    io.emit("rooms-updated", getRoomsList());
  });

  socket.on("join-room", (data: { roomId: string; password?: string }) => {
    const roomId = typeof data === "string" ? data : data.roomId;
    const password = typeof data === "string" ? "" : (data.password || "");
    const game = rooms.get(roomId);
    if (!game) {
      socket.emit("error-msg", "房间不存在");
      return;
    }
    if (game.phase !== "waiting") {
      socket.emit("error-msg", "游戏已开始，无法加入");
      return;
    }
    if (game.players.length >= 6) {
      socket.emit("error-msg", "房间已满");
      return;
    }
    const roomPassword = roomPasswords.get(roomId);
    if (roomPassword && roomPassword !== password) {
      socket.emit("error-msg", "房间密码错误");
      return;
    }

    const name = playerNames.get(socket.id) || `玩家${socket.id.slice(0, 4)}`;
    const player: Player = {
      id: socket.id,
      name,
      hand: [],
      seatIndex: game.players.length,
      isReady: false,
      isOnline: true,
      exposedWords: [],
    };

    game.players.push(player);
    playerRoomMap.set(socket.id, roomId);
    socket.join(roomId);

    broadcastGameState(roomId, game);
    socket.emit("room-joined", { roomId, gameState: getPublicGameState(game, socket.id) });
    io.emit("rooms-updated", getRoomsList());
  });

  socket.on("get-rooms", () => {
    socket.emit("rooms-updated", getRoomsList());
  });

  socket.on("get-game-state", () => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) return;
    const game = rooms.get(roomId);
    if (!game) return;
    socket.emit("game-updated", getPublicGameState(game, socket.id));
  });

  socket.on("start-game", () => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) return;
    const game = rooms.get(roomId);
    if (!game) return;
    if (game.players[0].id !== socket.id) {
      socket.emit("error-msg", "只有房主可以开始游戏");
      return;
    }
    if (game.players.length < 2) {
      socket.emit("error-msg", "至少需要2名玩家");
      return;
    }

    const newGame = createGame(roomId, game.players);
    newGame.gameLog = [{ id: 1, message: "游戏开始！", time: Date.now() }];
    rooms.set(roomId, newGame);

    for (const p of newGame.players) {
      io.to(p.id).emit("game-started", getPublicGameState(newGame, p.id));
    }
    io.emit("rooms-updated", getRoomsList());
  });

  socket.on("draw-tile", () => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) return;
    const game = rooms.get(roomId);
    if (!game) return;

    const result = drawTile(game, socket.id);
    if (!result.tile) {
      socket.emit("error-msg", "无法摸牌");
      return;
    }

    rooms.set(roomId, result.game);
    broadcastGameState(roomId, result.game);
  });

  socket.on("play-tile", (tileId: string) => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) return;
    const game = rooms.get(roomId);
    if (!game) return;

    const newGame = playTile(game, socket.id, tileId);
    if (!newGame) {
      socket.emit("error-msg", "无法出牌");
      return;
    }

    rooms.set(roomId, newGame);
    broadcastGameState(roomId, newGame);
  });

  socket.on("eat-tile", () => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) return;
    const game = rooms.get(roomId);
    if (!game) return;

    const newGame = eatTile(game, socket.id);
    if (!newGame) {
      socket.emit("error-msg", "无法吃牌");
      return;
    }

    rooms.set(roomId, newGame);
    broadcastGameState(roomId, newGame);
  });

  socket.on("play-after-eat", (tileId: string) => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) return;
    const game = rooms.get(roomId);
    if (!game) return;

    const newGame = playAfterEat(game, socket.id, tileId);
    if (!newGame) {
      socket.emit("error-msg", "无法出牌");
      return;
    }

    rooms.set(roomId, newGame);
    broadcastGameState(roomId, newGame);
  });

  socket.on("declare-win", (data: { sentence: string; homophones: { tileId: string; original: string; homophone: string }[]; editedTiles: { tileId: string; original: string; edited: string }[]; combinedGroups?: string[][] }) => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) return;
    const game = rooms.get(roomId);
    if (!game) return;

    const newGame = declareWin(game, socket.id, data.sentence, data.homophones, data.editedTiles, data.combinedGroups || []);
    if (!newGame) {
      socket.emit("error-msg", "无法胡牌");
      return;
    }

    rooms.set(roomId, newGame);
    broadcastGameState(roomId, newGame);
  });

  socket.on("win-approval-vote", (approved: boolean) => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) return;
    const game = rooms.get(roomId);
    if (!game) return;

    const newGame = castWinApprovalVote(game, socket.id, approved);
    if (!newGame) return;

    rooms.set(roomId, newGame);
    broadcastGameState(roomId, newGame);
  });

  socket.on("final-vote", (targetPlayerId: string) => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) return;
    const game = rooms.get(roomId);
    if (!game) return;

    const newGame = castFinalVote(game, socket.id, targetPlayerId);
    if (!newGame) return;

    rooms.set(roomId, newGame);

    if (checkFinalVotingComplete(newGame)) {
      const resolvedGame = resolveFinalVoting(newGame);
      rooms.set(roomId, resolvedGame);
      broadcastGameState(roomId, resolvedGame);
    } else {
      broadcastGameState(roomId, newGame);
    }
  });

  socket.on("execute-function", (data: { action: string; data: Record<string, unknown> }) => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) return;
    const game = rooms.get(roomId);
    if (!game) return;

    const newGame = executeFunctionCard(game, socket.id, data.action, data.data);
    if (!newGame) {
      socket.emit("error-msg", "无法执行功能牌");
      return;
    }

    rooms.set(roomId, newGame);

    if (newGame.phase === "playing") {
      broadcastGameState(roomId, newGame);
    } else {
      broadcastGameState(roomId, newGame);
    }
  });

  socket.on("finish-function", () => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) return;
    const game = rooms.get(roomId);
    if (!game) return;

    const newGame = finishFunctionCard(game);
    rooms.set(roomId, newGame);
    broadcastGameState(roomId, newGame);
  });

  socket.on("reorder-wall", (orderedTileIds: string[]) => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) return;
    const game = rooms.get(roomId);
    if (!game) return;

    if (game.functionCardState.type !== "预") return;
    if (game.functionCardState.waitingFor !== socket.id) return;

    const topTiles = (game.functionCardState.data as { topTiles: { id: string }[] }).topTiles;
    if (!topTiles || orderedTileIds.length !== topTiles.length) return;

    const topTileMap = new Map(game.deck.slice(0, 5).map((t) => [t.id, t]));
    const reordered: typeof game.deck = [];
    for (const id of orderedTileIds) {
      const tile = topTileMap.get(id);
      if (!tile) return;
      reordered.push(tile);
    }

    const newDeck = [...reordered, ...game.deck.slice(5)];
    const newGame = finishFunctionCard({ ...game, deck: newDeck, wallTop: newDeck.length });
    rooms.set(roomId, newGame);
    broadcastGameState(roomId, newGame);
  });

  socket.on("swap-tile", (data: { myTileId: string }) => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) return;
    const game = rooms.get(roomId);
    if (!game) return;

    if (game.functionCardState.type === "享") {
      const shareData = game.functionCardState.data as {
        phase: string;
        offeredTiles: { playerId: string; tileId: string }[];
        pool: TileData[];
        currentPickerIndex: number;
        pickerOrder: string[];
      };

      const player = game.players.find((p) => p.id === socket.id);
      if (!player) return;

      if (shareData.phase === "offering") {
        if (game.finishedDeclarations.some(d => d.playerId === socket.id)) return;
        const offeredTile = player.hand.find((t) => t.id === data.myTileId);
        if (!offeredTile) return;
        if (shareData.offeredTiles.some(o => o.playerId === socket.id)) return;

        const newOfferedTiles = [...shareData.offeredTiles, { playerId: socket.id, tileId: data.myTileId }];
        const newPool = [...shareData.pool, { ...offeredTile }];
        const updatedPlayers = game.players.map((p) =>
          p.id === socket.id ? { ...p, hand: p.hand.filter((t) => t.id !== data.myTileId) } : p
        );

        if (newOfferedTiles.length >= shareData.pickerOrder.length) {
          rooms.set(roomId, {
            ...game,
            players: updatedPlayers,
            functionCardState: {
              ...game.functionCardState,
              data: {
                ...shareData,
                phase: "picking",
                offeredTiles: newOfferedTiles,
                pool: newPool,
                currentPickerIndex: 0,
              },
            },
          });
          broadcastGameState(roomId, rooms.get(roomId)!);
        } else {
          rooms.set(roomId, {
            ...game,
            players: updatedPlayers,
            functionCardState: {
              ...game.functionCardState,
              data: {
                ...shareData,
                offeredTiles: newOfferedTiles,
                pool: newPool,
              },
            },
          });
          broadcastGameState(roomId, rooms.get(roomId)!);
        }
        return;
      }

      if (shareData.phase === "picking") {
        const currentPickerId = shareData.pickerOrder[shareData.currentPickerIndex];
        if (socket.id !== currentPickerId) return;

        const poolTile = shareData.pool.find((t) => t.id === data.myTileId);
        if (!poolTile) return;

        const newPool = shareData.pool.filter((t) => t.id !== data.myTileId);
        const updatedPlayers = game.players.map((p) =>
          p.id === socket.id ? { ...p, hand: [...p.hand, poolTile] } : p
        );

        const nextPickerIndex = shareData.currentPickerIndex + 1;

        if (newPool.length === 1) {
          const lastPickerId = shareData.pickerOrder[shareData.pickerOrder.length - 1];
          const lastTile = newPool[0];
          const finalPlayers = updatedPlayers.map((p) =>
            p.id === lastPickerId ? { ...p, hand: [...p.hand, lastTile] } : p
          );
          const newGame = finishFunctionCard({ ...game, players: finalPlayers });
          rooms.set(roomId, newGame);
          broadcastGameState(roomId, newGame);
        } else if (nextPickerIndex >= shareData.pickerOrder.length) {
          const newGame = finishFunctionCard({ ...game, players: updatedPlayers });
          rooms.set(roomId, newGame);
          broadcastGameState(roomId, newGame);
        } else {
          rooms.set(roomId, {
            ...game,
            players: updatedPlayers,
            functionCardState: {
              ...game.functionCardState,
              data: {
                ...shareData,
                pool: newPool,
                currentPickerIndex: nextPickerIndex,
              },
            },
          });
          broadcastGameState(roomId, rooms.get(roomId)!);
        }
        return;
      }
    }

    if (game.functionCardState.type === "换") {
      const swapData = game.functionCardState.data as {
        requesterId: string;
        targetPlayerId: string;
        requesterTileId: string | null;
        targetTileId: string | null;
      };

      if (game.finishedDeclarations.some(d => d.playerId === swapData.targetPlayerId)) return;
      if (game.finishedDeclarations.some(d => d.playerId === socket.id)) return;

      const player = game.players.find((p) => p.id === socket.id);
      if (!player) return;
      const myTile = player.hand.find((t) => t.id === data.myTileId);
      if (!myTile) return;

      let updatedSwapData = { ...swapData };

      if (socket.id === swapData.requesterId) {
        updatedSwapData.requesterTileId = data.myTileId;
      } else if (socket.id === swapData.targetPlayerId) {
        updatedSwapData.targetTileId = data.myTileId;
      } else {
        return;
      }

      if (updatedSwapData.requesterTileId && updatedSwapData.targetTileId) {
        const requester = game.players.find((p) => p.id === swapData.requesterId);
        const target = game.players.find((p) => p.id === swapData.targetPlayerId);
        if (!requester || !target) return;

        const requesterTile = requester.hand.find((t) => t.id === updatedSwapData.requesterTileId);
        const targetTile = target.hand.find((t) => t.id === updatedSwapData.targetTileId);
        if (!requesterTile || !targetTile) return;

        const updatedPlayers = game.players.map((p) => {
          if (p.id === swapData.requesterId) {
            return { ...p, hand: p.hand.filter((t) => t.id !== requesterTile.id).concat([targetTile]) };
          }
          if (p.id === swapData.targetPlayerId) {
            return { ...p, hand: p.hand.filter((t) => t.id !== targetTile.id).concat([requesterTile]) };
          }
          return p;
        });

        const requesterName = game.players.find(p => p.id === swapData.requesterId)?.name || "未知";
        const targetName = game.players.find(p => p.id === swapData.targetPlayerId)?.name || "未知";
        const logGame = {
          ...game,
          players: updatedPlayers,
          gameLog: appendLog(
            { ...game, players: updatedPlayers },
            `${requesterName} 和 ${targetName} 交换了1张牌`,
            { visibleTileId: `${requesterTile.id}|${targetTile.id}`, visibleTileChar: `${requesterTile.char}|${targetTile.char}`, visiblePlayerId: `${swapData.requesterId}|${swapData.targetPlayerId}` }
          ),
        };
        const newGame = finishFunctionCard(logGame);
        rooms.set(roomId, newGame);
        broadcastGameState(roomId, newGame);
      } else {
        rooms.set(roomId, {
          ...game,
          functionCardState: { ...game.functionCardState, data: updatedSwapData },
        });
        broadcastGameState(roomId, rooms.get(roomId)!);
      }
    }
  });

  socket.on("leave-room", () => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) return;

    const game = rooms.get(roomId);
    if (!game) return;

    const playerIdx = game.players.findIndex((p) => p.id === socket.id);
    if (playerIdx === -1) return;

    if (game.phase === "waiting") {
      game.players.splice(playerIdx, 1);
      game.players.forEach((p, i) => { p.seatIndex = i; });
      if (game.players.length === 0) {
        rooms.delete(roomId);
        roomPasswords.delete(roomId);
      } else {
        rooms.set(roomId, game);
        broadcastGameState(roomId, game);
      }
    } else {
      game.players[playerIdx].isOnline = false;
      rooms.set(roomId, game);
      broadcastGameState(roomId, game);
    }

    socket.leave(roomId);
    playerRoomMap.delete(socket.id);
    io.emit("rooms-updated", getRoomsList());
  });

  socket.on("send-message", (message: string) => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) return;
    const name = playerNames.get(socket.id) || `玩家${socket.id.slice(0, 4)}`;
    io.to(roomId).emit("chat-message", { playerId: socket.id, name, message, time: Date.now() });
  });

  socket.on("update-layout", (data: { handOrder: string[]; combinedGroups: string[][] }) => {
    playerLayouts.set(socket.id, { handOrder: data.handOrder, combinedGroups: data.combinedGroups });
    const roomId = playerRoomMap.get(socket.id);
    if (roomId) {
      const game = rooms.get(roomId);
      if (game) {
        const hasFinishedPlayers = game.finishedDeclarations.length > 0;
        if (hasFinishedPlayers) {
          for (const p of game.players) {
            if (p.id !== socket.id && game.finishedDeclarations.some(d => d.playerId === p.id)) {
              io.to(p.id).emit("game-updated", getPublicGameState(game, p.id, playerLayouts));
            }
          }
        }
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`[断开] ${socket.id}`);
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) return;

    const game = rooms.get(roomId);
    if (!game) return;

    const playerIdx = game.players.findIndex((p) => p.id === socket.id);
    if (playerIdx === -1) return;

    if (game.phase === "waiting") {
      game.players.splice(playerIdx, 1);
      if (game.players.length === 0) {
        rooms.delete(roomId);
        roomPasswords.delete(roomId);
      } else {
        rooms.set(roomId, game);
        broadcastGameState(roomId, game);
      }
    } else {
      game.players[playerIdx].isOnline = false;
      rooms.set(roomId, game);
      broadcastGameState(roomId, game);
    }

    playerRoomMap.delete(socket.id);
    playerNames.delete(socket.id);
    playerLayouts.delete(socket.id);
    io.emit("rooms-updated", getRoomsList());
  });
});

function broadcastGameState(roomId: string, game: GameState) {
  for (const p of game.players) {
    io.to(p.id).emit("game-updated", getPublicGameState(game, p.id, playerLayouts));
  }
}

function getRoomsList(): RoomInfo[] {
  const list: RoomInfo[] = [];
  for (const [id, game] of rooms) {
    list.push({
      id,
      name: `${game.players[0]?.name || "未知"}的房间`,
      playerCount: game.players.length,
      maxPlayers: 6,
      isPlaying: game.phase !== "waiting",
      hostId: game.players[0]?.id || "",
      hasPassword: roomPasswords.has(id),
    });
  }
  return list;
}

const PORT = process.env.PORT || 3001;

server.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`🀄 文字麻将服务器运行在端口 ${PORT}`);
});
