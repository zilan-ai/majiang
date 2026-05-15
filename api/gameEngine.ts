import { GameState, Player, TileData, GamePhase, Direction, GameLogEntry } from "../shared/types";
import { createFullDeck, shuffleDeck, dealHands } from "./tileUtils";

export function createGame(roomId: string, players: Player[]): GameState {
  const deck = shuffleDeck(createFullDeck());
  const { hands, remainingDeck } = dealHands(deck, players.length);

  const startIndex = Math.floor(Math.random() * players.length);

  const updatedPlayers = players.map((p, i) => ({
    ...p,
    hand: hands[i] || [],
    isReady: true,
  }));

  updatedPlayers[startIndex].hand.push(remainingDeck.shift()!);

  return {
    roomId,
    players: updatedPlayers,
    deck: remainingDeck,
    discardPile: [],
    currentPlayerIndex: startIndex,
    direction: 1,
    phase: "playing",
    lastDiscardedTile: null,
    lastDiscardedBy: null,
    wallTop: remainingDeck.length,
    turnCount: 0,
    winnerId: null,
    winDeclaration: null,
    finishedDeclarations: [],
    finalVotes: {},
    votes: {},
    winApprovalVotes: {},
    gameLog: [],
    skipNextPlayer: false,
    firstTurn: true,
    functionCardState: {
      type: null,
      waitingFor: null,
      data: {},
    },
  };
}

export function drawTile(game: GameState, playerId: string): { game: GameState; tile: TileData | null } {
  if (game.phase !== "playing") return { game, tile: null };
  if (game.players[game.currentPlayerIndex].id !== playerId) return { game, tile: null };
  if (game.deck.length === 0) return { game, tile: null };

  const tile = game.deck.shift()!;
  const players = game.players.map((p) =>
    p.id === playerId ? { ...p, hand: [...p.hand, tile] } : p
  );

  return {
    game: { ...game, players, wallTop: game.deck.length, gameLog: appendLog(game, `${getPlayerName(game, playerId)} 摸了一张牌`, { visibleTileId: tile.id, visibleTileChar: tile.char, visiblePlayerId: playerId }) },
    tile,
  };
}

export function playTile(game: GameState, playerId: string, tileId: string): GameState | null {
  if (game.phase !== "playing") return null;
  if (game.players[game.currentPlayerIndex].id !== playerId) return null;

  const player = game.players.find((p) => p.id === playerId);
  if (!player) return null;

  const activePlayers = game.players.filter(
    (p) => !game.finishedDeclarations.some((d) => d.playerId === p.id)
  );
  const isLastActive = activePlayers.length <= 1 && !game.finishedDeclarations.some(d => d.playerId === playerId);
  if (isLastActive) {
    const mustPlayFuncChars = ["删", "享", "禁", "反", "换", "预"];
    const hasMustPlay = player.hand.some(t => t.isFunction && mustPlayFuncChars.includes(t.char));
    if (hasMustPlay) {
      const checkTile = player.hand.find((t) => t.id === tileId);
      if (!checkTile || !checkTile.isFunction || !mustPlayFuncChars.includes(checkTile.char)) return null;
    }
  }

  const tileIndex = player.hand.findIndex((t) => t.id === tileId);
  if (tileIndex === -1) return null;

  const tile = player.hand[tileIndex];
  const newHand = player.hand.filter((t) => t.id !== tileId);

  const isFunctionCard = tile.isFunction;

  const players = game.players.map((p) =>
    p.id === playerId ? { ...p, hand: newHand } : p
  );

  if (isFunctionCard) {
    if (isLastActive) {
      if (tile.char === "预") {
        return {
          ...game,
          players,
          phase: "function" as GamePhase,
          lastDiscardedTile: tile,
          lastDiscardedBy: playerId,
          functionCardState: {
            type: "预",
            waitingFor: playerId,
            data: { topTiles: game.deck.slice(0, 5) },
          },
          gameLog: appendLog(game, `${getPlayerName(game, playerId)} 打出了功能牌【预】`),
        };
      }
      let logMsg = `${getPlayerName(game, playerId)} 打出了功能牌【${tile.char}】`;
      let updatedGame: GameState = { ...game, players, discardPile: [...game.discardPile, tile] };
      if (tile.char === "反") {
        const newDirection: Direction = game.direction === 1 ? -1 : 1;
        updatedGame = { ...updatedGame, direction: newDirection };
        logMsg += "，出牌方向已反转";
      } else if (tile.char === "禁") {
        logMsg += "，无下家可跳过";
      } else if (tile.char === "删") {
        logMsg += "，无目标可删除";
      } else if (tile.char === "享") {
        logMsg += "，无其他玩家参与";
      } else if (tile.char === "换") {
        logMsg += "，无目标可交换";
      }
      const nextIndex = getNextPlayerIndex(
        updatedGame.currentPlayerIndex,
        updatedGame.players.length,
        updatedGame.direction,
        false,
        getFinishedIndices(updatedGame)
      );
      return {
        ...updatedGame,
        phase: "playing" as GamePhase,
        functionCardState: { type: null, waitingFor: null, data: {} },
        lastDiscardedTile: null,
        lastDiscardedBy: null,
        currentPlayerIndex: nextIndex,
        skipNextPlayer: false,
        turnCount: updatedGame.turnCount + 1,
        firstTurn: false,
        gameLog: appendLog(updatedGame, logMsg),
      };
    }

    let funcCardState: typeof game.functionCardState = {
      type: tile.char,
      waitingFor: playerId,
      data: {},
    };

    if (tile.char === "预") {
      funcCardState = {
        type: "预",
        waitingFor: playerId,
        data: { topTiles: game.deck.slice(0, 5) },
      };
    }

    if (tile.char === "享") {
      const pickerOrder: string[] = [];
      for (let i = 0; i < game.players.length; i++) {
        const idx = ((game.currentPlayerIndex + i * game.direction) % game.players.length + game.players.length) % game.players.length;
        const p = game.players[idx];
        if (!game.finishedDeclarations.some(d => d.playerId === p.id)) {
          pickerOrder.push(p.id);
        }
      }
      funcCardState = {
        type: "享",
        waitingFor: null,
        data: {
          phase: "offering",
          offeredTiles: [] as { playerId: string; tileId: string }[],
          pool: [] as TileData[],
          currentPickerIndex: 0,
          pickerOrder,
        },
      };
    }

    return {
      ...game,
      players,
      phase: "function" as GamePhase,
      lastDiscardedTile: tile,
      lastDiscardedBy: playerId,
      functionCardState: funcCardState,
      gameLog: appendLog(game, `${getPlayerName(game, playerId)} 打出了功能牌【${tile.char}】`),
    };
  }

  const nextIndex = getNextPlayerIndex(game.currentPlayerIndex, game.players.length, game.direction, game.skipNextPlayer, getFinishedIndices(game));

  if (isLastActive) {
    return {
      ...game,
      players,
      discardPile: [...game.discardPile, tile],
      lastDiscardedTile: null,
      lastDiscardedBy: null,
      currentPlayerIndex: nextIndex,
      skipNextPlayer: false,
      turnCount: game.turnCount + 1,
      firstTurn: false,
      phase: "playing" as GamePhase,
      gameLog: appendLog(game, `${getPlayerName(game, playerId)} 打出了"${tile.char}"`),
    };
  }

  return {
    ...game,
    players,
    discardPile: [...game.discardPile, tile],
    lastDiscardedTile: tile,
    lastDiscardedBy: playerId,
    currentPlayerIndex: nextIndex,
    skipNextPlayer: false,
    turnCount: game.turnCount + 1,
    firstTurn: false,
    phase: "playing" as GamePhase,
    gameLog: appendLog(game, `${getPlayerName(game, playerId)} 打出了"${tile.char}"`),
  };
}

export function eatTile(game: GameState, playerId: string): GameState | null {
  if (!game.lastDiscardedTile) return null;
  if (game.lastDiscardedBy === playerId) return null;

  const discardPlayerIndex = game.players.findIndex((p) => p.id === game.lastDiscardedBy);
  if (discardPlayerIndex === -1) return null;
  const nextActiveIndex = getNextPlayerIndex(discardPlayerIndex, game.players.length, game.direction, false, getFinishedIndices(game));
  if (game.players[nextActiveIndex].id !== playerId) return null;

  const playerIndex = game.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) return null;

  const player = game.players[playerIndex];
  const newHand = [...player.hand, game.lastDiscardedTile];

  const newDiscardPile = game.discardPile.filter(
    (t) => t.id !== game.lastDiscardedTile!.id
  );

  const players = game.players.map((p) =>
    p.id === playerId ? { ...p, hand: newHand } : p
  );

  return {
    ...game,
    players,
    discardPile: newDiscardPile,
    lastDiscardedTile: null,
    lastDiscardedBy: null,
    currentPlayerIndex: playerIndex,
    phase: "eating" as GamePhase,
    gameLog: appendLog(game, `${getPlayerName(game, playerId)} 吃了一张牌`),
  };
}

export function playAfterEat(game: GameState, playerId: string, tileId: string): GameState | null {
  if (game.phase !== "eating") return null;
  if (game.players[game.currentPlayerIndex].id !== playerId) return null;

  const activePlayers = game.players.filter(
    (p) => !game.finishedDeclarations.some((d) => d.playerId === p.id)
  );
  if (activePlayers.length <= 1) return null;

  const player = game.players.find((p) => p.id === playerId);
  if (!player) return null;

  const tileIndex = player.hand.findIndex((t) => t.id === tileId);
  if (tileIndex === -1) return null;

  const tile = player.hand[tileIndex];
  const newHand = player.hand.filter((t) => t.id !== tileId);

  const players = game.players.map((p) =>
    p.id === playerId ? { ...p, hand: newHand } : p
  );

  if (tile.isFunction) {
    let funcCardState: typeof game.functionCardState = {
      type: tile.char,
      waitingFor: playerId,
      data: {},
    };

    if (tile.char === "享") {
      const pickerOrder: string[] = [];
      for (let i = 0; i < game.players.length; i++) {
        const idx = ((game.currentPlayerIndex + i * game.direction) % game.players.length + game.players.length) % game.players.length;
        const p = game.players[idx];
        if (!game.finishedDeclarations.some(d => d.playerId === p.id)) {
          pickerOrder.push(p.id);
        }
      }
      funcCardState = {
        type: "享",
        waitingFor: null,
        data: {
          phase: "offering",
          offeredTiles: [] as { playerId: string; tileId: string }[],
          pool: [] as TileData[],
          currentPickerIndex: 0,
          pickerOrder,
        },
      };
    }

    return {
      ...game,
      players,
      phase: "function" as GamePhase,
      lastDiscardedTile: tile,
      lastDiscardedBy: playerId,
      functionCardState: funcCardState,
      gameLog: appendLog(game, `${getPlayerName(game, playerId)} 吃牌后打出功能牌【${tile.char}】`),
    };
  }

  const nextIndex = getNextPlayerIndex(game.currentPlayerIndex, game.players.length, game.direction, game.skipNextPlayer, getFinishedIndices(game));

  return {
    ...game,
    players,
    discardPile: [...game.discardPile, tile],
    lastDiscardedTile: tile,
    lastDiscardedBy: playerId,
    currentPlayerIndex: nextIndex,
    skipNextPlayer: false,
    turnCount: game.turnCount + 1,
    phase: "playing" as GamePhase,
    gameLog: appendLog(game, `${getPlayerName(game, playerId)} 吃牌后打出了"${tile.char}"`),
  };
}

export function declareWin(
  game: GameState,
  playerId: string,
  sentence: string,
  homophones: { tileId: string; original: string; homophone: string }[],
  editedTiles: { tileId: string; original: string; edited: string }[],
  combinedGroups: string[][] = []
): GameState | null {
  if (game.phase !== "playing" && game.phase !== "eating") return null;

  const player = game.players.find((p) => p.id === playerId);
  if (!player) return null;

  if (game.finishedDeclarations.some((d) => d.playerId === playerId)) return null;

  const otherActivePlayers = game.players.filter(
    (p) => p.id !== playerId && !game.finishedDeclarations.some((d) => d.playerId === p.id)
  );

  if (otherActivePlayers.length === 0) {
    const mustPlayFuncChars = ["删", "享", "禁", "反", "换", "预"];
    const hasMustPlay = player.hand.some(t => t.isFunction && mustPlayFuncChars.includes(t.char));
    if (hasMustPlay) return null;

    const declaration = {
      playerId,
      sentence,
      tiles: [...player.hand],
      homophones,
      editedTiles,
      combinedGroups,
    };
    const finishedDeclarations = [...game.finishedDeclarations, declaration];
    return {
      ...game,
      phase: "final-voting" as GamePhase,
      finishedDeclarations,
      finalVotes: {},
      winDeclaration: null,
      votes: {},
      winApprovalVotes: {},
      gameLog: appendLog(game, `${getPlayerName(game, playerId)} 胡牌了！句子："${sentence}"`),
    };
  }

  return {
    ...game,
    phase: "win-voting" as GamePhase,
    winDeclaration: {
      playerId,
      sentence,
      tiles: [...player.hand],
      homophones,
      editedTiles,
      combinedGroups,
    },
    winApprovalVotes: {},
    gameLog: appendLog(game, `${getPlayerName(game, playerId)} 申请胡牌，等待审批...`),
  };
}

export function castWinApprovalVote(game: GameState, voterId: string, approved: boolean): GameState | null {
  if (game.phase !== "win-voting") return null;
  if (!game.winDeclaration) return null;
  if (voterId === game.winDeclaration.playerId) return null;

  const otherPlayers = game.players.filter(
    (p) => p.id !== game.winDeclaration!.playerId
  );
  if (!otherPlayers.some((p) => p.id === voterId)) return null;

  const winApprovalVotes = { ...game.winApprovalVotes, [voterId]: approved };

  const allVoted = otherPlayers.every((p) => winApprovalVotes[p.id] !== undefined);
  if (!allVoted) {
    return { ...game, winApprovalVotes, gameLog: appendLog(game, `${getPlayerName(game, voterId)} ${approved ? "同意" : "反对"}胡牌`) };
  }

  const approveCount = Object.values(winApprovalVotes).filter((v) => v).length;
  const rejectCount = Object.values(winApprovalVotes).filter((v) => !v).length;
  const approved_win = approveCount > rejectCount;

  if (!approved_win) {
    return {
      ...game,
      phase: "playing" as GamePhase,
      winDeclaration: null,
      winApprovalVotes: {},
      gameLog: appendLog(game, `${getPlayerName(game, game.winDeclaration.playerId)} 的胡牌申请被驳回（${approveCount}同意/${rejectCount}反对）`),
    };
  }

  const declaration = game.winDeclaration;
  const finishedDeclarations = [...game.finishedDeclarations, declaration];

  const activePlayers = game.players.filter(
    (p) => !finishedDeclarations.some((d) => d.playerId === p.id)
  );

  if (activePlayers.length === 0) {
    return {
      ...game,
      phase: "final-voting" as GamePhase,
      finishedDeclarations,
      finalVotes: {},
      winDeclaration: null,
      votes: {},
      winApprovalVotes: {},
      gameLog: appendLog(game, `${getPlayerName(game, declaration.playerId)} 胡牌审批通过！句子："${declaration.sentence}"`),
    };
  }

  let newCurrentPlayerIndex = game.currentPlayerIndex;
  const currentPlayerFinished = finishedDeclarations.some(
    (d) => d.playerId === game.players[game.currentPlayerIndex].id
  );

  if (currentPlayerFinished) {
    newCurrentPlayerIndex = getNextPlayerIndex(game.currentPlayerIndex, game.players.length, game.direction, false, getFinishedIndices({ ...game, finishedDeclarations }));
  }

  return {
    ...game,
    phase: "playing" as GamePhase,
    finishedDeclarations,
    currentPlayerIndex: newCurrentPlayerIndex,
    lastDiscardedTile: null,
    lastDiscardedBy: null,
    winDeclaration: null,
    votes: {},
    winApprovalVotes: {},
    turnCount: game.turnCount + 1,
    gameLog: appendLog(game, `${getPlayerName(game, declaration.playerId)} 胡牌审批通过！句子："${declaration.sentence}"`),
  };
}

export function castFinalVote(game: GameState, voterId: string, targetPlayerId: string): GameState | null {
  if (game.phase !== "final-voting") return null;
  if (targetPlayerId === voterId) return null;
  if (!game.finishedDeclarations.some((d) => d.playerId === targetPlayerId)) return null;

  const finalVotes = { ...game.finalVotes, [voterId]: targetPlayerId };
  return { ...game, finalVotes };
}

export function checkFinalVotingComplete(game: GameState): boolean {
  const totalVoters = game.finishedDeclarations.length;
  const votesCast = Object.keys(game.finalVotes).length;
  return votesCast >= totalVoters;
}

export function resolveFinalVoting(game: GameState): GameState {
  const voteCounts: Record<string, number> = {};
  for (const targetId of Object.values(game.finalVotes)) {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  }

  let maxVotes = 0;
  let winnerId = "";
  for (const [pid, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      winnerId = pid;
    }
  }

  return {
    ...game,
    phase: "ended" as GamePhase,
    winnerId,
    gameLog: appendLog(game, `游戏结束！${getPlayerName(game, winnerId)} 获得最终胜利！`),
  };
}

export function executeFunctionCard(
  game: GameState,
  playerId: string,
  action: string,
  data: Record<string, unknown>
): GameState | null {
  if (game.phase !== "function") return null;
  if (game.functionCardState.waitingFor !== playerId) return null;

  const funcType = game.functionCardState.type;
  let updatedGame = { ...game };

  switch (funcType) {
    case "替": {
      const players = updatedGame.players.map((p) => {
        if (p.id === playerId) {
          return { ...p, hand: [...p.hand, game.lastDiscardedTile!] };
        }
        return p;
      });
      updatedGame = { ...updatedGame, players };
      break;
    }
    case "复": {
      const targetTileId = data.targetTileId as string;
      if (!targetTileId) return null;
      let copiedTile: TileData | null = null;
      for (const p of updatedGame.players) {
        const found = p.hand.find((t) => t.id === targetTileId);
        if (found) {
          copiedTile = { ...found, id: `tile-copy-${Date.now()}-${Math.random()}` };
          break;
        }
      }
      if (!copiedTile) {
        const found = updatedGame.discardPile.find((t) => t.id === targetTileId);
        if (found) copiedTile = { ...found, id: `tile-copy-${Date.now()}-${Math.random()}` };
      }
      if (copiedTile) {
        const players = updatedGame.players.map((p) =>
          p.id === playerId ? { ...p, hand: [...p.hand, copiedTile!] } : p
        );
        updatedGame = { ...updatedGame, players };
      }
      break;
    }
    case "删": {
      const targetPlayerId = data.targetPlayerId as string;
      if (!targetPlayerId) return null;
      if (updatedGame.finishedDeclarations.some(d => d.playerId === targetPlayerId)) return null;
      const targetPlayer = updatedGame.players.find((p) => p.id === targetPlayerId);
      if (!targetPlayer || targetPlayer.hand.length === 0) return null;
      const randomIndex = Math.floor(Math.random() * targetPlayer.hand.length);
      const removedTile = targetPlayer.hand[randomIndex];
      const newHand = targetPlayer.hand.filter((t) => t.id !== removedTile.id);
      if (updatedGame.deck.length > 0) {
        const drawnTile = updatedGame.deck.shift()!;
        newHand.push(drawnTile);
      }
      const players = updatedGame.players.map((p) =>
        p.id === targetPlayerId ? { ...p, hand: newHand } : p
      );
      updatedGame = {
        ...updatedGame,
        players,
        deck: updatedGame.deck,
        wallTop: updatedGame.deck.length,
        discardPile: [...updatedGame.discardPile, removedTile],
        gameLog: appendLog(updatedGame, `${getPlayerName(updatedGame, playerId)} 使用了【删】，随机删除了 ${getPlayerName(updatedGame, targetPlayerId)} 的"${removedTile.char}"字牌并补摸一张`),
      };
      break;
    }
    case "禁": {
      break;
    }
    case "反": {
      const newDirection: Direction = updatedGame.direction === 1 ? -1 : 1;
      updatedGame = { ...updatedGame, direction: newDirection };
      break;
    }
    case "预": {
      const topTiles = updatedGame.deck.slice(0, 5);
      updatedGame = {
        ...updatedGame,
        functionCardState: {
          type: "预",
          waitingFor: playerId,
          data: { topTiles },
        },
      };
      break;
    }
    case "换": {
      const targetPlayerId = data.targetPlayerId as string;
      if (!targetPlayerId) return null;
      if (updatedGame.finishedDeclarations.some(d => d.playerId === targetPlayerId)) return null;
      updatedGame = {
        ...updatedGame,
        functionCardState: {
          type: "换",
          waitingFor: null,
          data: { requesterId: playerId, targetPlayerId, requesterTileId: null, targetTileId: null },
        },
      };
      break;
    }
  }

  if (funcType !== "预" && funcType !== "换") {
    const shouldSkip = funcType === "禁";
    const nextIndex = getNextPlayerIndex(
      updatedGame.currentPlayerIndex,
      updatedGame.players.length,
      updatedGame.direction,
      shouldSkip || updatedGame.skipNextPlayer,
      getFinishedIndices(updatedGame)
    );
    const skippedPlayerName = shouldSkip
      ? getPlayerName(updatedGame, updatedGame.players[(updatedGame.currentPlayerIndex + updatedGame.direction + updatedGame.players.length) % updatedGame.players.length]?.id)
      : "";
    const logMessages: Record<string, string> = {
      "替": `${getPlayerName(game, playerId)} 使用了【替】替换牌`,
      "复": `${getPlayerName(game, playerId)} 使用了【复】复制牌`,
      "禁": `${getPlayerName(game, playerId)} 使用了【禁】，${skippedPlayerName} 被跳过本回合`,
      "反": `${getPlayerName(game, playerId)} 使用了【反】，出牌方向已反转`,
    };
    return {
      ...updatedGame,
      phase: "playing" as GamePhase,
      functionCardState: { type: null, waitingFor: null, data: {} },
      lastDiscardedTile: null,
      lastDiscardedBy: null,
      currentPlayerIndex: nextIndex,
      skipNextPlayer: false,
      turnCount: updatedGame.turnCount + 1,
      gameLog: logMessages[funcType!] ? appendLog(updatedGame, logMessages[funcType!]) : updatedGame.gameLog,
    };
  }

  const pendingLogMessages: Record<string, string> = {
    "预": `${getPlayerName(game, playerId)} 使用了【预】预览牌墙`,
    "换": `${getPlayerName(game, playerId)} 使用了【换】换牌`,
  };
  return {
    ...updatedGame,
    gameLog: appendLog(updatedGame, pendingLogMessages[funcType!] || `${getPlayerName(game, playerId)} 使用了功能牌`),
  };
}

export function finishFunctionCard(game: GameState): GameState {
  const funcType = game.functionCardState.type;
  if (!funcType) return game;
  const shouldSkip = funcType === "禁";
  const shouldReverse = funcType === "反";
  const newDirection: Direction = shouldReverse
    ? (game.direction === 1 ? -1 : 1)
    : game.direction;
  const nextIndex = getNextPlayerIndex(
    game.currentPlayerIndex,
    game.players.length,
    newDirection,
    shouldSkip || game.skipNextPlayer,
    getFinishedIndices(game)
  );
  const skippedPlayerName = shouldSkip
    ? getPlayerName(game, game.players[(game.currentPlayerIndex + newDirection + game.players.length) % game.players.length]?.id)
    : "";
  const finishMessages: Record<string, string> = {
    "享": "共享换牌完成",
    "预": "预览牌墙完成",
    "换": "换牌完成",
    "禁": skippedPlayerName ? `${getPlayerName(game, game.players[game.currentPlayerIndex].id)} 使用了【禁】，${skippedPlayerName} 被跳过本回合` : "功能牌效果结束",
    "反": `${getPlayerName(game, game.players[game.currentPlayerIndex].id)} 使用了【反】，出牌方向已反转`,
  };
  return {
    ...game,
    phase: "playing" as GamePhase,
    functionCardState: { type: null, waitingFor: null, data: {} },
    lastDiscardedTile: null,
    lastDiscardedBy: null,
    currentPlayerIndex: nextIndex,
    direction: newDirection,
    skipNextPlayer: false,
    turnCount: game.turnCount + 1,
    gameLog: funcType ? appendLog(game, finishMessages[funcType] || "功能牌效果结束") : game.gameLog,
  };
}

export function appendLog(game: GameState, message: string, opts?: { visibleTileId?: string; visibleTileChar?: string; visiblePlayerId?: string }): GameLogEntry[] {
  const entry: GameLogEntry = {
    id: game.gameLog.length > 0 ? game.gameLog[game.gameLog.length - 1].id + 1 : 1,
    message,
    time: Date.now(),
    visibleTileId: opts?.visibleTileId,
    visibleTileChar: opts?.visibleTileChar,
    visiblePlayerId: opts?.visiblePlayerId,
  };
  return [...game.gameLog, entry];
}

function getPlayerName(game: GameState, playerId: string): string {
  return game.players.find(p => p.id === playerId)?.name || "未知玩家";
}

function getFinishedIndices(game: GameState): number[] {
  return game.players
    .map((p, i) => (game.finishedDeclarations.some(d => d.playerId === p.id) ? i : -1))
    .filter(i => i !== -1);
}

function getNextPlayerIndex(current: number, total: number, direction: Direction, skip: boolean, finishedIndices: number[] = []): number {
  let next = (current + direction + total) % total;
  if (skip) {
    next = (next + direction + total) % total;
  }
  let safety = 0;
  while (finishedIndices.includes(next) && safety < total) {
    next = (next + direction + total) % total;
    safety++;
  }
  return next;
}

export function getPublicGameState(game: GameState, forPlayerId: string, layouts?: Map<string, { handOrder: string[]; combinedGroups: string[][] }>) {
  return {
    roomId: game.roomId,
    currentPlayerIndex: game.currentPlayerIndex,
    direction: game.direction,
    phase: game.phase,
    lastDiscardedTile: game.lastDiscardedTile,
    lastDiscardedBy: game.lastDiscardedBy,
    wallTop: game.wallTop,
    turnCount: game.turnCount,
    winnerId: game.winnerId,
    winDeclaration: game.winDeclaration,
    finishedDeclarations: game.finishedDeclarations,
    finalVotes: game.finalVotes,
    votes: game.votes,
    winApprovalVotes: game.winApprovalVotes,
    gameLog: game.gameLog,
    skipNextPlayer: game.skipNextPlayer,
    firstTurn: game.firstTurn,
    players: game.players.map((p) => {
      const isSelf = p.id === forPlayerId;
      const isFinished = game.finishedDeclarations.some((d) => d.playerId === forPlayerId);
      const isTargetFinished = game.finishedDeclarations.some((d) => d.playerId === p.id);
      const canSeeHand = isSelf || (isFinished && !isTargetFinished);
      const layout = layouts?.get(p.id);
      return {
        id: p.id,
        name: p.name,
        handSize: p.hand.length,
        hand: canSeeHand ? p.hand : p.hand.map((t) => ({ ...t, char: "?", category: "hidden" as const })),
        seatIndex: p.seatIndex,
        isReady: p.isReady,
        isOnline: p.isOnline,
        exposedWords: p.exposedWords,
        handOrder: canSeeHand && layout ? layout.handOrder : undefined,
        combinedGroups: canSeeHand && layout ? layout.combinedGroups : undefined,
      };
    }),
    discardPile: game.discardPile,
    functionCardState: game.functionCardState.waitingFor === forPlayerId || game.functionCardState.type === null || game.functionCardState.waitingFor === null
      ? game.functionCardState
      : { type: game.functionCardState.type, waitingFor: game.functionCardState.waitingFor, data: {} },
  };
}
