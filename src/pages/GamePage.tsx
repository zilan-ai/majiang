import React, { useEffect, useState, useRef, useCallback } from "react";
import { useGameStore, PublicTile, PublicPlayer, PublicGameState, PublicWinDeclaration, ChatMessage } from "@/store/useGameStore";
import { connectSocket } from "@/lib/socket";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const categoryColors: Record<string, string> = {
  person: "#d4a574",
  nature: "#4a7c59",
  action: "#c23616",
  adjective: "#2d5f8a",
  spacetime: "#7b6b8d",
  number: "#b8860b",
  abstract: "#2d8a8a",
  grammar: "#6b6b6b",
  color: "#e84393",
  function: "#c23616",
};

function MiniTile({ tile, onClick, selected, small }: { tile: PublicTile; onClick?: () => void; selected?: boolean; small?: boolean }) {
  const isFunc = tile.isFunction;
  const catColor = categoryColors[tile.category] || "#6b6b6b";

  return (
    <div
      onClick={onClick}
      className={`relative ${small ? "w-10 h-14 sm:w-10 sm:h-14" : "w-14 h-[4.5rem] sm:w-14 sm:h-[4.5rem]"} rounded-lg overflow-hidden cursor-pointer transition-all duration-200 select-none mobile-mini-tile ${selected ? "ring-2 ring-[#c23616] ring-offset-2 ring-offset-[#0d0d1a]" : ""}`}
      style={{
        background: "linear-gradient(145deg, #faf6ee 0%, #f0e8d8 50%, #e8dcc8 100%)",
        boxShadow: selected
          ? "0 0 16px rgba(194,54,22,0.5)"
          : "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      {isFunc ? (
        <>
          <div
            className="absolute top-0 right-0 w-6 h-6"
            style={{
              background: "linear-gradient(135deg, #c23616 0%, #c2361699 100%)",
              clipPath: "polygon(100% 0, 0 0, 100% 100%)",
            }}
          />
          <div className="absolute top-0 right-0 text-white/80 text-[7px] font-bold leading-tight text-right" style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
            功能
          </div>
        </>
      ) : (
        <div
          className="absolute top-0 right-0 w-4 h-4"
          style={{
            background: `linear-gradient(135deg, ${catColor} 0%, ${catColor}99 100%)`,
            clipPath: "polygon(100% 0, 0 0, 100% 100%)",
          }}
        />
      )}
      <div className="flex items-center justify-center h-full">
        <span
          className={`tile-char ${small ? "text-lg" : "text-2xl"} font-bold`}
          style={{
            color: isFunc ? "#c23616" : "#1a1a2e",
            textShadow: isFunc
              ? "1px 1px 0 rgba(255,255,255,0.8), -1px -1px 0 rgba(0,0,0,0.05)"
              : "1px 1px 0 rgba(255,255,255,0.6)",
            fontFamily: "'Noto Serif SC', 'SimSun', serif",
          }}
        >
          {tile.char}
        </span>
      </div>
    </div>
  );
}

function SortableTile({ tile, selected, onClick, disabled, displayChar, editBadge, editBadgeColor, isEditing }: { tile: PublicTile; selected: boolean; onClick: () => void; disabled: boolean; displayChar?: string; editBadge?: string; editBadgeColor?: string; isEditing?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tile.id, disabled });
  const isFunc = tile.isFunction;
  const catColor = categoryColors[tile.category] || "#6b6b6b";
  const charToShow = displayChar || tile.char;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`relative w-14 h-[4.5rem] sm:w-14 sm:h-[4.5rem] rounded-lg overflow-hidden cursor-pointer transition-shadow duration-200 select-none touch-none mobile-tile ${
        isEditing ? "ring-2 ring-[#d4a574] ring-offset-2 ring-offset-[#0d0d1a]" :
        selected ? "ring-2 ring-[#c23616] ring-offset-2 ring-offset-[#0d0d1a]" :
        editBadge ? "ring-2 ring-[#4a7c59] ring-offset-1 ring-offset-[#0d0d1a]" : ""
      } ${isDragging ? "shadow-2xl" : ""}`}
    >
      <div
        style={{
          background: "linear-gradient(145deg, #faf6ee 0%, #f0e8d8 50%, #e8dcc8 100%)",
          boxShadow: selected
            ? "0 0 16px rgba(194,54,22,0.5)"
            : "0 2px 8px rgba(0,0,0,0.3)",
          width: "100%",
          height: "100%",
        }}
      >
        {isFunc ? (
          <>
            <div
              className="func-corner absolute top-0 right-0 w-6 h-6"
              style={{
                background: "linear-gradient(135deg, #c23616 0%, #c2361699 100%)",
                clipPath: "polygon(100% 0, 0 0, 100% 100%)",
              }}
            />
            <div className="func-label absolute top-0 right-0 text-white/80 text-[7px] font-bold leading-tight text-right" style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
              功能
            </div>
          </>
        ) : (
          <div
            className="cat-corner absolute top-0 right-0 w-4 h-4"
            style={{
              background: `linear-gradient(135deg, ${catColor} 0%, ${catColor}99 100%)`,
              clipPath: "polygon(100% 0, 0 0, 100% 100%)",
            }}
          />
        )}
        <div className="flex items-center justify-center h-full">
          <span
            className="tile-char text-2xl font-bold"
            style={{
              color: isFunc ? "#c23616" : "#1a1a2e",
              textShadow: isFunc
                ? "1px 1px 0 rgba(255,255,255,0.8), -1px -1px 0 rgba(0,0,0,0.05)"
                : "1px 1px 0 rgba(255,255,255,0.6)",
              fontFamily: "'Noto Serif SC', 'SimSun', serif",
            }}
          >
            {charToShow}
          </span>
        </div>
        {editBadge && editBadgeColor && (
          <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: editBadgeColor }}>
            <span className="text-[8px] text-white font-bold">{editBadge}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfirmLeaveModal({ open, onConfirm, onCancel }: { open: boolean; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl bg-[#1a1a2e] border border-white/[0.1] p-6 shadow-2xl max-w-xs w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">🚪</div>
          <h3 className="text-lg font-bold text-[#f5f0e8]">确认离开？</h3>
          <p className="text-sm text-[#f5f0e8]/40 mt-1">离开后将返回游戏大厅</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-white/[0.06] text-[#f5f0e8]/60 font-medium hover:bg-white/[0.1] transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-[#c23616] text-white font-medium hover:bg-[#c23616]/80 transition-colors"
          >
            确认离开
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function PlayerSeat({ player, isCurrent, isMe, direction, isFinished, seatIndex, totalPlayers, actionLabel, isSwapTarget, canSpectate, isSpectating, onSpectate }: { player: PublicPlayer; isCurrent: boolean; isMe: boolean; direction: 1 | -1; isFinished?: boolean; seatIndex: number; totalPlayers: number; actionLabel?: string; isSwapTarget?: boolean; canSpectate?: boolean; isSpectating?: boolean; onSpectate?: () => void }) {
  return (
    <div
      className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all duration-300 ${
        isSpectating
          ? "bg-[#4a7c59]/20 border-2 border-[#4a7c59]/50 shadow-[0_0_16px_rgba(74,124,89,0.3)]"
          : isSwapTarget
          ? "bg-[#c23616]/25 border-2 border-[#c23616]/60 shadow-[0_0_16px_rgba(194,54,22,0.3)]"
          : isFinished
          ? "bg-[#d4a574]/10 border border-[#d4a574]/20"
          : isCurrent
          ? "bg-[#c23616]/15 border border-[#c23616]/30 shadow-[0_0_12px_rgba(194,54,22,0.1)]"
          : "bg-white/[0.03] border border-white/[0.06]"
      } ${canSpectate ? "cursor-pointer hover:bg-[#4a7c59]/10 hover:border-[#4a7c59]/30" : ""}`}
      onClick={canSpectate ? onSpectate : undefined}
    >
      <div className="relative">
        <div
          className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
            isFinished ? "bg-[#d4a574] text-white" :
            isMe ? "bg-[#c23616] text-white" : "bg-white/[0.1] text-[#f5f0e8]/60"
          }`}
        >
          {player.name.charAt(0)}
        </div>
        {isFinished && (
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#d4a574] rounded-full flex items-center justify-center text-[8px]">🏆</div>
        )}
        {!isFinished && isCurrent && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#c23616] rounded-full animate-pulse" />
        )}
        {!player.isOnline && !isFinished && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-500 rounded-full" />
        )}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium truncate">
          <span className="text-[#f5f0e8]/20 mr-1">{seatIndex + 1}号</span>
          {player.name}
          {isMe && <span className="text-[#c23616] ml-1">(你)</span>}
          {isFinished && <span className="text-[#d4a574] ml-1">🏆已胡牌</span>}
          {isSpectating && <span className="text-[#4a7c59] ml-1">👁观战中</span>}
        </div>
        <div className="text-[10px] text-[#f5f0e8]/30">
          {isFinished ? "胡牌完成" : actionLabel ? actionLabel : `${player.handSize}张牌`}
          {canSpectate && !isSpectating && <span className="text-[#4a7c59] ml-1">👁点击观战</span>}
        </div>
      </div>
    </div>
  );
}

function ChatPanel({ messages, onSend }: { messages: ChatMessage[]; onSend: (msg: string) => void }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  return (
    <div className="rounded-xl bg-[#1a1a2e]/40 border border-white/[0.06] flex flex-col">
      <div className="px-3 py-2 border-b border-white/[0.06] text-xs text-[#f5f0e8]/40 font-medium">
        💬 聊天
      </div>
      <div ref={scrollRef} className="overflow-y-auto p-2 space-y-1 max-h-32">
        {messages.map((msg, i) => (
          <div key={i} className="text-xs">
            <span className="text-[#d4a574] font-medium">{msg.name}：</span>
            <span className="text-[#f5f0e8]/60">{msg.message}</span>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-xs text-[#f5f0e8]/15 text-center py-2">暂无消息</div>
        )}
      </div>
      <div className="p-2 border-t border-white/[0.06]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) {
                onSend(input.trim());
                setInput("");
              }
            }}
            placeholder="发送消息..."
            className="flex-1 px-2 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.06] text-xs text-[#f5f0e8] placeholder:text-[#f5f0e8]/15 focus:outline-none focus:border-[#d4a574]/30"
          />
          <button
            onClick={() => {
              if (input.trim()) { onSend(input.trim()); setInput(""); }
            }}
            className="px-3 py-1.5 rounded-lg bg-[#d4a574]/20 text-[#d4a574] text-xs hover:bg-[#d4a574]/30 transition-colors"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}

function DeclarationCard({ decl, players }: { decl: PublicWinDeclaration; players: PublicPlayer[] }) {
  const editedMap = new Map(decl.editedTiles.map(e => [e.tileId, e.edited]));
  const homophoneMap = new Map(decl.homophones.map(h => [h.tileId, h.homophone]));
  const playerName = players.find(p => p.id === decl.playerId)?.name || "未知";
  const groups = decl.combinedGroups || [];
  const groupOfTile = new Map<string, number>();
  groups.forEach((group, gi) => {
    group.forEach(id => groupOfTile.set(id, gi));
  });

  const renderTile = (t: PublicTile, size: "sm" | "lg" = "sm") => {
    const edited = editedMap.get(t.id);
    const homophone = homophoneMap.get(t.id);
    const displayChar = edited || homophone || t.char;
    const isFunc = t.isFunction;
    const isTi = isFunc && t.char === "替";
    const isFu = isFunc && t.char === "复";
    const catColor = categoryColors[t.category] || "#6b6b6b";
    const w = size === "lg" ? "w-14" : "w-10";
    const h = size === "lg" ? "h-[4.5rem]" : "h-14";
    const fontSize = size === "lg" ? "text-2xl" : "text-sm";
    const cornerW = size === "lg" ? "w-6 h-6" : "w-5 h-5";
    const cornerSmallW = size === "lg" ? "w-4 h-4" : "w-4 h-4";
    const badgeSize = size === "lg" ? "w-3.5 h-3.5" : "w-3 h-3";
    const badgeFontSize = size === "lg" ? "text-[8px]" : "text-[7px]";
    const borderR = size === "lg" ? "" : "";

    return (
      <div
        key={t.id}
        className={`relative ${w} ${h} overflow-hidden ${borderR}`}
        style={{
          background: "linear-gradient(145deg, #faf6ee 0%, #f0e8d8 50%, #e8dcc8 100%)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          borderRight: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        {isFunc ? (
          <>
            <div
              className={`absolute top-0 right-0 ${cornerW}`}
              style={{
                background: "linear-gradient(135deg, #c23616 0%, #c2361699 100%)",
                clipPath: "polygon(100% 0, 0 0, 100% 100%)",
              }}
            />
            <div className="absolute top-0 right-0 text-white/80 text-[6px] font-bold leading-tight text-right" style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
              功能
            </div>
          </>
        ) : (
          <div
            className={`absolute top-0 right-0 ${cornerSmallW}`}
            style={{
              background: `linear-gradient(135deg, ${catColor} 0%, ${catColor}99 100%)`,
              clipPath: "polygon(100% 0, 0 0, 100% 100%)",
            }}
          />
        )}
        <div className="flex items-center justify-center h-full">
          <span
            className={`${fontSize} font-bold`}
            style={{
              color: isFunc ? "#c23616" : "#1a1a2e",
              textShadow: isFunc ? "1px 1px 0 rgba(255,255,255,0.8), -1px -1px 0 rgba(0,0,0,0.05)" : "1px 1px 0 rgba(255,255,255,0.6)",
              fontFamily: "'Noto Serif SC', 'SimSun', serif",
            }}
          >
            {displayChar}
          </span>
        </div>
        {homophone && !edited && !isFunc && (
          <div className={`absolute -top-0.5 -right-0.5 ${badgeSize} bg-[#4a7c59] rounded-full flex items-center justify-center`}>
            <span className={`${badgeFontSize} text-white font-bold`}>谐</span>
          </div>
        )}
        {edited && isTi && (
          <div className={`absolute -top-0.5 -right-0.5 ${badgeSize} bg-[#c23616] rounded-full flex items-center justify-center`}>
            <span className={`${badgeFontSize} text-white font-bold`}>替</span>
          </div>
        )}
        {edited && isFu && (
          <div className={`absolute -top-0.5 -right-0.5 ${badgeSize} bg-[#8b5cf6] rounded-full flex items-center justify-center`}>
            <span className={`${badgeFontSize} text-white font-bold`}>复</span>
          </div>
        )}
      </div>
    );
  };

  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < decl.tiles.length) {
    const tile = decl.tiles[i];
    const gIdx = groupOfTile.get(tile.id);

    if (gIdx !== undefined) {
      const group = groups[gIdx];
      const groupTileIds = new Set(group);
      const groupTiles: PublicTile[] = [];
      while (i < decl.tiles.length && groupTileIds.has(decl.tiles[i].id)) {
        groupTiles.push(decl.tiles[i]);
        i++;
      }
      elements.push(
        <div
          key={`group-${gIdx}`}
          className="flex rounded-lg overflow-hidden ring-1 ring-[#4a7c59]/30"
        >
          {groupTiles.map(t => renderTile(t))}
        </div>
      );
    } else {
      elements.push(
        <div key={tile.id} className="flex flex-col items-center gap-0.5">
          {renderTile(tile)}
        </div>
      );
      i++;
    }
  }

  return (
    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <div className="text-sm text-[#d4a574] font-medium mb-2">{playerName} 的句子</div>
      <div className="flex flex-wrap gap-1.5 justify-center mb-2 items-end">
        {elements}
      </div>
      <div className="text-center text-base text-[#f5f0e8] font-medium leading-relaxed mb-1">"{decl.sentence}"</div>
      {(decl.homophones.length > 0 || decl.editedTiles.length > 0) && (
        <div className="flex flex-wrap gap-2 justify-center">
          {decl.homophones.map((h, i) => (
            <span key={`h${i}`} className="text-[10px] text-[#4a7c59]">{h.original}→{h.homophone}</span>
          ))}
          {decl.editedTiles.map((e, i) => (
            <span key={`e${i}`} className="text-[10px] text-[#c23616]">{e.original === "替" ? "【替】" : e.original === "复" ? "【复】" : e.original}→{e.edited}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function WinApprovalVotingPanel({ gameState, myId, onVote }: { gameState: PublicGameState; myId: string; onVote: (approved: boolean) => void }) {
  if (gameState.phase !== "win-voting" || !gameState.winDeclaration) return null;

  const isDeclarer = gameState.winDeclaration.playerId === myId;
  const hasVoted = myId in gameState.winApprovalVotes;

  const otherPlayers = gameState.players.filter(
    (p) => p.id !== gameState.winDeclaration!.playerId
  );

  const approveCount = Object.values(gameState.winApprovalVotes).filter(v => v).length;
  const rejectCount = Object.values(gameState.winApprovalVotes).filter(v => !v).length;
  const totalVoters = otherPlayers.length;
  const votedCount = Object.keys(gameState.winApprovalVotes).length;

  const declarerName = gameState.players.find(p => p.id === gameState.winDeclaration!.playerId)?.name || "未知";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="max-w-lg w-full rounded-2xl bg-[#1a1a2e] border border-[#d4a574]/30 p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-[#d4a574] mb-2 text-center">🏆 胡牌审批</h3>
        <p className="text-xs text-[#f5f0e8]/30 mb-4 text-center">
          {isDeclarer ? "等待其他玩家审批你的胡牌..." : `${declarerName} 申请胡牌，请审批`}
        </p>

        <DeclarationCard decl={gameState.winDeclaration} players={gameState.players} />

        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-[#f5f0e8]/40">
          <span className="text-green-400">✅ 同意 {approveCount}</span>
          <span>投票进度 {votedCount}/{totalVoters}</span>
          <span className="text-red-400">❌ 反对 {rejectCount}</span>
        </div>

        {!isDeclarer && !hasVoted && (
          <div className="mt-4 flex gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onVote(true)}
              className="px-8 py-3 rounded-xl bg-green-600 text-white font-bold text-base hover:bg-green-500 transition-colors shadow-lg"
            >
              ✅ 同意胡牌
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onVote(false)}
              className="px-8 py-3 rounded-xl bg-red-600 text-white font-bold text-base hover:bg-red-500 transition-colors shadow-lg"
            >
              ❌ 反对胡牌
            </motion.button>
          </div>
        )}

        {hasVoted && !isDeclarer && (
          <div className="mt-4 text-center text-sm text-[#f5f0e8]/40">
            你已投票：{gameState.winApprovalVotes[myId] ? "✅ 同意" : "❌ 反对"}，等待其他玩家...
          </div>
        )}

        {isDeclarer && (
          <div className="mt-4 text-center text-sm text-[#f5f0e8]/40">
            等待审批结果中...
          </div>
        )}
      </div>
    </motion.div>
  );
}

function FinalVotingPanel({ gameState, myId, onVote }: { gameState: PublicGameState; myId: string; onVote: (targetPlayerId: string) => void }) {
  if (gameState.phase !== "final-voting") return null;
  const hasVoted = myId in gameState.finalVotes;
  const myDeclaration = gameState.finishedDeclarations.find(d => d.playerId === myId);
  const otherDeclarations = gameState.finishedDeclarations.filter(d => d.playerId !== myId);

  const voteCounts: Record<string, number> = {};
  for (const targetId of Object.values(gameState.finalVotes)) {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="max-w-lg w-full rounded-2xl bg-[#1a1a2e] border border-[#d4a574]/30 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-[#d4a574] mb-2 text-center">🏆 最终投票</h3>
        <p className="text-xs text-[#f5f0e8]/30 mb-4 text-center">所有玩家已胡牌！请投出你认为最佳句子的一票（不能投自己）</p>

        {myDeclaration && (
          <div className="mb-4">
            <div className="text-xs text-[#f5f0e8]/20 mb-1">你的句子：</div>
            <DeclarationCard decl={myDeclaration} players={gameState.players} />
          </div>
        )}

        <div className="mb-4">
          <div className="text-xs text-[#f5f0e8]/20 mb-2">其他玩家的句子：</div>
          <div className="space-y-3">
            {otherDeclarations.map((decl) => {
              const voteCount = voteCounts[decl.playerId] || 0;
              return (
                <div key={decl.playerId} className="relative">
                  <DeclarationCard decl={decl} players={gameState.players} />
                  {!hasVoted && (
                    <button
                      onClick={() => onVote(decl.playerId)}
                      className="absolute top-2 right-2 px-3 py-1.5 rounded-lg bg-[#d4a574] text-[#0d0d1a] text-xs font-medium hover:bg-[#d4a574]/80 transition-colors"
                    >投一票</button>
                  )}
                  {voteCount > 0 && (
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-[#d4a574]/20 text-[#d4a574] text-xs font-bold">
                      {voteCount}票
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xs text-[#f5f0e8]/30 mb-1">投票进度：</div>
          <div className="flex gap-2 flex-wrap">
            {gameState.finishedDeclarations.map((decl) => {
              const voterName = gameState.players.find(p => p.id === decl.playerId)?.name;
              const votedFor = gameState.finalVotes[decl.playerId];
              const votedForName = votedFor ? gameState.players.find(p => p.id === votedFor)?.name : null;
              return (
                <span key={decl.playerId} className={`text-xs px-2 py-1 rounded-full ${votedFor ? "bg-[#d4a574]/20 text-[#d4a574]" : "bg-white/[0.05] text-[#f5f0e8]/30"}`}>
                  {voterName}: {votedForName ? `投了${votedForName}` : "待投票"}
                </span>
              );
            })}
          </div>
        </div>

        {hasVoted && <p className="text-center text-sm text-[#f5f0e8]/30">已投票，等待其他玩家...</p>}
      </div>
    </motion.div>
  );
}

function GameEndPanel({ gameState, myId }: { gameState: PublicGameState; myId: string }) {
  const navigate = useNavigate();
  const socket = connectSocket();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  if (gameState.phase !== "ended") return null;
  const winner = gameState.players.find((p) => p.id === gameState.winnerId);
  const isMe = gameState.winnerId === myId;

  const voteCounts: Record<string, number> = {};
  for (const targetId of Object.values(gameState.finalVotes)) {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="max-w-lg w-full rounded-2xl bg-[#1a1a2e] border border-[#d4a574]/30 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="text-5xl mb-4 text-center">🎉</div>
        <h3 className="text-2xl font-bold text-[#d4a574] mb-2 text-center">
          {isMe ? "你赢了！" : `${winner?.name} 获胜！`}
        </h3>

        <div className="mb-4 space-y-2">
          {gameState.finishedDeclarations.map((decl) => {
            const pName = gameState.players.find(p => p.id === decl.playerId)?.name;
            const votes = voteCounts[decl.playerId] || 0;
            const isWinner = decl.playerId === gameState.winnerId;
            return (
              <div key={decl.playerId} className={`p-3 rounded-xl ${isWinner ? "bg-[#d4a574]/10 border border-[#d4a574]/30" : "bg-white/[0.03] border border-white/[0.06]"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${isWinner ? "text-[#d4a574]" : "text-[#f5f0e8]/60"}`}>
                    {isWinner && "👑 "}{pName}
                  </span>
                  <span className="text-xs text-[#d4a574]">{votes}票</span>
                </div>
                <div className="text-sm text-[#f5f0e8]/80">"{decl.sentence}"</div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center">
          <ConfirmLeaveModal open={showLeaveConfirm} onConfirm={() => { socket.emit("leave-room"); navigate("/lobby"); }} onCancel={() => setShowLeaveConfirm(false)} />
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="px-8 py-3 rounded-xl bg-[#c23616] text-white font-bold hover:bg-[#c23616]/80 transition-colors"
          >
            返回大厅
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function PreviewSortableTile({ tile }: { tile: PublicTile }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tile.id });
  const isFunc = tile.isFunction;
  const catColor = categoryColors[tile.category] || "#6b6b6b";

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing select-none touch-none"
    >
      <div
        className="relative w-14 h-[4.5rem] rounded-lg overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #faf6ee 0%, #f0e8d8 50%, #e8dcc8 100%)",
          boxShadow: isDragging ? "0 8px 24px rgba(0,0,0,0.5)" : "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        {isFunc ? (
          <>
            <div
              className="absolute top-0 right-0 w-6 h-6"
              style={{
                background: "linear-gradient(135deg, #c23616 0%, #c2361699 100%)",
                clipPath: "polygon(100% 0, 0 0, 100% 100%)",
              }}
            />
            <div className="absolute top-0 right-0 text-white/80 text-[7px] font-bold leading-tight text-right" style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
              功能
            </div>
          </>
        ) : (
          <div
            className="absolute top-0 right-0 w-4 h-4"
            style={{
              background: `linear-gradient(135deg, ${catColor} 0%, ${catColor}99 100%)`,
              clipPath: "polygon(100% 0, 0 0, 100% 100%)",
            }}
          />
        )}
        <div className="flex items-center justify-center h-full">
          <span
            className="text-2xl font-bold"
            style={{
              color: isFunc ? "#c23616" : "#1a1a2e",
              textShadow: isFunc ? "1px 1px 0 rgba(255,255,255,0.8), -1px -1px 0 rgba(0,0,0,0.05)" : "1px 1px 0 rgba(255,255,255,0.6)",
              fontFamily: "'Noto Serif SC', 'SimSun', serif",
            }}
          >
            {tile.char}
          </span>
        </div>
      </div>
    </div>
  );
}

function PreviewWallPanel({ topTiles, onConfirm }: { topTiles: PublicTile[]; onConfirm: (orderedIds: string[]) => void }) {
  const [order, setOrder] = useState<string[]>(topTiles.map((t) => t.id));
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrder((prev) => {
      const oldIndex = prev.indexOf(active.id as string);
      const newIndex = prev.indexOf(over.id as string);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  const tileMap = new Map(topTiles.map((t) => [t.id, t]));
  const orderedTiles = order.map((id) => tileMap.get(id)!).filter(Boolean);

  return (
    <div className="rounded-xl bg-[#c23616]/10 border border-[#c23616]/20 p-4">
      <div className="text-sm text-[#c23616] font-medium mb-2">⚡ 功能牌【预】生效中</div>
      <div className="text-xs text-[#f5f0e8]/40 mb-3">拖拽调整牌墙顶端5张牌的顺序，确认后将按新顺序放回牌墙顶部</div>
      <div className="mb-3">
        <div className="text-xs text-[#f5f0e8]/30 mb-2">牌墙顶端（拖拽排序）：</div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={order}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-3 justify-center">
              {orderedTiles.map((tile, i) => (
                <div key={tile.id} className="flex flex-col items-center gap-1">
                  <div className="text-[10px] text-[#f5f0e8]/20 font-mono">#{i + 1}</div>
                  <PreviewSortableTile tile={tile} />
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => onConfirm(order)}
          className="px-6 py-2.5 rounded-xl bg-[#c23616] text-white text-sm font-medium hover:bg-[#c23616]/80 transition-colors"
        >
          确认排序，放回牌墙
        </button>
      </div>
    </div>
  );
}

function WaitingRoom({ gameState, myId }: { gameState: PublicGameState; myId: string }) {
  const socket = connectSocket();
  const navigate = useNavigate();
  const isHost = gameState.players[0]?.id === myId;
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 relative">
      <ConfirmLeaveModal open={showLeaveConfirm} onConfirm={() => { socket.emit("leave-room"); navigate("/lobby"); }} onCancel={() => setShowLeaveConfirm(false)} />
      <button
        onClick={() => setShowLeaveConfirm(true)}
        className="absolute top-0 right-0 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[#f5f0e8]/50 hover:text-[#f5f0e8]/80 transition-colors text-xs"
      >
        返回大厅
      </button>
      <div className="text-center">
        <div className="text-4xl mb-3">🀄</div>
        <h2 className="text-2xl font-bold text-[#f5f0e8] mb-1">等待玩家加入</h2>
        <p className="text-sm text-[#f5f0e8]/30">房间号：</p>
        <p className="text-3xl font-mono font-bold text-[#d4a574] tracking-[0.3em] my-2">{gameState.roomId}</p>
        <p className="text-xs text-[#f5f0e8]/20">将房间号分享给好友即可加入</p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-sm">
        {gameState.players.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-lg font-bold ${p.id === myId ? "bg-[#c23616] text-white" : "bg-white/[0.1] text-[#f5f0e8]/60"}`}>
              {p.name.charAt(0)}
            </div>
            <div className="text-xs sm:text-sm font-medium">{p.name}{p.id === myId && <span className="text-[#c23616]"> (你)</span>}</div>
            {i === 0 && <div className="text-[9px] sm:text-[10px] text-[#d4a574]">房主</div>}
          </motion.div>
        ))}
        {Array.from({ length: 6 - gameState.players.length }).map((_, i) => (
          <div key={`empty-${i}`} className="flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-4 rounded-xl border border-dashed border-white/[0.08]">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-lg text-white/[0.1]">?</div>
            <div className="text-[10px] sm:text-xs text-white/[0.1]">等待加入</div>
          </div>
        ))}
      </div>

      {isHost ? (
        <button
          onClick={() => socket.emit("start-game")}
          disabled={gameState.players.length < 2}
          className="px-10 py-4 rounded-2xl bg-[#c23616] text-white font-bold text-lg hover:bg-[#c23616]/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#c23616]/20"
        >
          开始游戏 ({gameState.players.length}/6)
        </button>
      ) : (
        <div className="text-sm text-[#f5f0e8]/30 animate-pulse">等待房主开始游戏...</div>
      )}
    </div>
  );
}

export default function GamePage() {
  const { myId, gameState, setGameState, chatMessages, addChatMessage, errorMessage, setError } = useGameStore();
  const [selectedTileIds, setSelectedTileIds] = useState<string[]>([]);
  const [combinedGroups, setCombinedGroups] = useState<string[][]>([]);
  const [handOrder, setHandOrder] = useState<string[] | null>(null);
  const [passedEatTileId, setPassedEatTileId] = useState<string | null>(null);
  const prevDiscardedTileIdRef = useRef<string | null>(null);
  const [showWinForm, setShowWinForm] = useState(false);
  const [editedTiles, setEditedTiles] = useState<Record<string, string>>({});
  const [homophoneMap, setHomophoneMap] = useState<Record<string, string>>({});
  const [editingTileId, setEditingTileId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [sharePickTileId, setSharePickTileId] = useState<string | null>(null);
  const [spectatePlayerId, setSpectatePlayerId] = useState<string | null>(null);
  const navigate = useNavigate();
  const socket = connectSocket();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const socket = connectSocket();
    socket.off("game-updated");
    socket.off("game-started");
    socket.off("chat-message");
    socket.off("error-msg");

    socket.on("game-updated", (state: PublicGameState) => {
      setGameState(state);
      setHandOrder((prev) => {
        const myId = useGameStore.getState().myId;
        const myPlayer = state.players.find((p) => p.id === myId);
        if (!prev || !myPlayer) return myPlayer?.hand.map((t) => t.id) ?? null;
        const currentIds = new Set(myPlayer.hand.map((t) => t.id));
        const filtered = prev.filter((id) => currentIds.has(id));
        const filteredSet = new Set(filtered);
        for (const t of myPlayer.hand) {
          if (!filteredSet.has(t.id)) {
            filtered.push(t.id);
          }
        }
        return filtered;
      });
      setSelectedTileIds([]);
      setCombinedGroups([]);
      setSharePickTileId(null);
      const newDiscardedId = state.lastDiscardedTile?.id ?? null;
      if (newDiscardedId !== prevDiscardedTileIdRef.current) {
        prevDiscardedTileIdRef.current = newDiscardedId;
        setPassedEatTileId(null);
      }
    });
    socket.on("game-started", (state: PublicGameState) => {
      setGameState(state);
      setHandOrder(null);
      prevDiscardedTileIdRef.current = state.lastDiscardedTile?.id ?? null;
      setPassedEatTileId(null);
    });
    socket.on("chat-message", (msg: ChatMessage) => addChatMessage(msg));
    socket.on("error-msg", (msg: string) => {
      setError(msg);
      setTimeout(() => setError(null), 3000);
    });

    if (!gameState) {
      socket.emit("get-game-state");
    }

    return () => {
      socket.off("game-updated");
      socket.off("game-started");
      socket.off("chat-message");
      socket.off("error-msg");
    };
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setHandOrder((prev) => {
      const oldIndex = prev!.indexOf(active.id as string);
      const newIndex = prev!.indexOf(over.id as string);
      return arrayMove(prev!, oldIndex, newIndex);
    });
  }, []);

  if (!gameState) {
    return (
      <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center">
        <ConfirmLeaveModal open={showLeaveConfirm} onConfirm={() => { socket.emit("leave-room"); navigate("/lobby"); }} onCancel={() => setShowLeaveConfirm(false)} />
        <div className="text-center">
          <div className="text-4xl mb-4">🀄</div>
          <p className="text-[#f5f0e8]/40">等待游戏数据...</p>
          <button onClick={() => setShowLeaveConfirm(true)} className="mt-4 text-sm text-[#c23616] hover:underline">返回大厅</button>
        </div>
      </div>
    );
  }

  const myPlayer = gameState.players.find((p) => p.id === myId);
  const otherPlayers = gameState.players.filter((p) => p.id !== myId);
  const isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === myId;
  const isFinished = gameState.finishedDeclarations.some(d => d.playerId === myId);
  const phase = gameState.phase;
  const activePlayerCount = gameState.players.filter(p => !gameState.finishedDeclarations.some(d => d.playerId === p.id)).length;
  const isLastActivePlayer = activePlayerCount === 1 && !isFinished;

  const isFirstTurn = gameState.firstTurn && gameState.turnCount === 0;
  const handSize = myPlayer?.hand.length ?? 0;
  const needDraw = phase === "playing" && isMyTurn && !isFinished && !isFirstTurn && handSize % 2 === 1 && (!gameState.lastDiscardedTile || gameState.lastDiscardedTile.id === passedEatTileId);
  const canPlay = phase === "playing" && isMyTurn && !isFinished && handSize % 2 === 0;
  const isNextPlayerOfDiscarder = (() => {
    if (!gameState.lastDiscardedBy) return false;
    const discardIdx = gameState.players.findIndex(p => p.id === gameState.lastDiscardedBy);
    if (discardIdx === -1) return false;
    const dir = gameState.direction;
    const total = gameState.players.length;
    const finishedIds = new Set(gameState.finishedDeclarations.map(d => d.playerId));
    let idx = (discardIdx + dir + total) % total;
    let safety = 0;
    while (finishedIds.has(gameState.players[idx]?.id) && safety < total) {
      idx = (idx + dir + total) % total;
      safety++;
    }
    return gameState.players[idx]?.id === myId;
  })();
  const canEat = phase === "playing" && !isFinished && !isLastActivePlayer && gameState.lastDiscardedTile && gameState.lastDiscardedBy !== myId && isNextPlayerOfDiscarder && gameState.lastDiscardedTile.id !== passedEatTileId;
  const canPlayAfterEat = phase === "eating" && isMyTurn && !isFinished && !isLastActivePlayer;
  const mustPlayFuncCards = isLastActivePlayer ? (myPlayer?.hand.filter(t => t.isFunction && ["删", "享", "禁", "反", "换", "预"].includes(t.char)) || []) : [];
  const hasMustPlayFuncCard = mustPlayFuncCards.length > 0;
  const canDeclareWin = (phase === "playing" || phase === "eating") && !isFinished && myPlayer && myPlayer.hand.length >= 14 && !(isLastActivePlayer && hasMustPlayFuncCard);

  useEffect(() => {
    if (needDraw) {
      const timer = setTimeout(() => {
        socket.emit("draw-tile");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [needDraw]);

  useEffect(() => {
    if (spectatePlayerId) {
      const spectatedFinished = gameState.finishedDeclarations.some(d => d.playerId === spectatePlayerId);
      const spectatedExists = gameState.players.some(p => p.id === spectatePlayerId);
      if (spectatedFinished || !spectatedExists) {
        setSpectatePlayerId(null);
      }
    }
  }, [gameState.finishedDeclarations, gameState.players, spectatePlayerId]);

  useEffect(() => {
    if (handOrder) {
      socket.emit("update-layout", { handOrder, combinedGroups });
    }
  }, [handOrder, combinedGroups]);

  const orderedHand = (() => {
    if (!myPlayer) return [];
    if (!handOrder) {
      setHandOrder(myPlayer.hand.map((t) => t.id));
      return myPlayer.hand;
    }
    const tileMap = new Map(myPlayer.hand.map((t) => [t.id, t]));
    const ordered: PublicTile[] = [];
    for (const id of handOrder) {
      const t = tileMap.get(id);
      if (t) { ordered.push(t); tileMap.delete(id); }
    }
    for (const t of tileMap.values()) ordered.push(t);
    return ordered;
  })();

  const phaseLabel: Record<string, string> = {
    waiting: "等待中",
    playing: "游戏中",
    eating: "吃牌中",
    function: "功能牌",
    winning: "胡牌",
    "win-voting": "胡牌审批",
    voting: "投票中",
    "final-voting": "最终投票",
    ended: "已结束",
  };

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-[#f5f0e8] flex flex-col safe-top safe-bottom">
      <ConfirmLeaveModal open={showLeaveConfirm} onConfirm={() => { socket.emit("leave-room"); navigate("/lobby"); }} onCancel={() => setShowLeaveConfirm(false)} />
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-red-600/90 text-white text-sm font-medium shadow-lg"
        >
          {errorMessage}
        </motion.div>
      )}

      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-2 sm:p-3 gap-2 sm:gap-3">
        {phase === "waiting" ? (
          <WaitingRoom gameState={gameState} myId={myId} />
        ) : (
          <>
            {/* 顶部信息栏 */}
            <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#1a1a2e]/60 border border-white/[0.06]">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-[10px] sm:text-xs text-[#f5f0e8]/30">房间</span>
                <span className="font-mono text-xs sm:text-sm font-bold text-[#d4a574] tracking-wider">{gameState.roomId}</span>
                <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full ${
                  phase === "playing" ? "bg-green-500/20 text-green-400" :
                  phase === "win-voting" ? "bg-[#d4a574]/20 text-[#d4a574]" :
                  phase === "voting" || phase === "final-voting" ? "bg-[#d4a574]/20 text-[#d4a574]" :
                  phase === "ended" ? "bg-[#c23616]/20 text-[#c23616]" :
                  "bg-white/[0.05] text-[#f5f0e8]/40"
                }`}>
                  {phaseLabel[phase] || phase}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-[#f5f0e8]/40">
                <span className="hidden sm:inline">牌墙: {gameState.wallTop}</span>
                <span className="sm:hidden">墙:{gameState.wallTop}</span>
                <span className="hidden sm:inline">回合: {gameState.turnCount}</span>
                <span className="sm:hidden">R{gameState.turnCount}</span>
                <span className="hidden sm:inline">{gameState.direction === 1 ? "→ 顺时针" : "← 逆时针"}</span>
                <span className="sm:hidden">{gameState.direction === 1 ? "→" : "←"}</span>
                <button
                  onClick={() => setShowLeaveConfirm(true)}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[#f5f0e8]/50 hover:text-[#f5f0e8]/80 transition-colors text-xs"
                >
                  返回大厅
                </button>
              </div>
            </div>

            {/* 玩家座位（按顺序，含上下家箭头） */}
            <div className="flex items-center gap-1 flex-wrap sm:flex-nowrap">
              {gameState.players.map((p, idx) => {
                const isMe = p.id === myId;
                const isCurrent = gameState.players[gameState.currentPlayerIndex]?.id === p.id;
                const isTargetFinished = gameState.finishedDeclarations.some(d => d.playerId === p.id);
                const prevIdx = (idx - 1 + gameState.players.length) % gameState.players.length;
                const nextIdx = (idx + 1) % gameState.players.length;
                const prevName = gameState.players[prevIdx].name;
                const nextName = gameState.players[nextIdx].name;

                let actionLabel = "";
                if (!isTargetFinished) {
                  if (isCurrent) {
                    if (phase === "playing") {
                      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
                      const currentPlayerHandSize = currentPlayer?.handSize ?? currentPlayer?.hand?.length ?? 0;
                      actionLabel = currentPlayerHandSize % 2 === 1 ? "摸牌中..." : "出牌中...";
                    } else if (phase === "eating") {
                      actionLabel = "吃牌出牌中...";
                    } else if (phase === "function") {
                      actionLabel = "功能牌中...";
                    }
                  }
                  if (!actionLabel) {
                    actionLabel = `${p.handSize}张牌`;
                  }
                }

                const isSwapTarget = phase === "function" && gameState.functionCardState.type === "换" && (p.id === (gameState.functionCardState.data as Record<string, unknown>).targetPlayerId || p.id === (gameState.functionCardState.data as Record<string, unknown>).requesterId);
                const canSpectateThis = isFinished && !isMe && !isTargetFinished;
                const isSpectatingThis = spectatePlayerId === p.id;

                return (
                  <React.Fragment key={p.id}>
                    {idx > 0 && (
                      <span className="text-[#d4a574]/40 text-xs select-none">{gameState.direction === 1 ? "→" : "←"}</span>
                    )}
                    <div className="flex flex-col items-center gap-0.5">
                      <PlayerSeat
                        player={p}
                        isCurrent={isCurrent}
                        isMe={isMe}
                        direction={gameState.direction}
                        isFinished={isTargetFinished}
                        seatIndex={idx}
                        totalPlayers={gameState.players.length}
                        actionLabel={actionLabel}
                        isSwapTarget={isSwapTarget}
                        canSpectate={canSpectateThis}
                        isSpectating={isSpectatingThis}
                        onSpectate={() => setSpectatePlayerId(spectatePlayerId === p.id ? null : p.id)}
                      />
                      <div className="text-[8px] text-[#f5f0e8]/15 leading-tight text-center">
                        <span>上家:{prevName}</span>
                        <span className="mx-0.5">|</span>
                        <span>下家:{nextName}</span>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* 弃牌区 */}
            {gameState.discardPile.length > 0 && (
              <div className="rounded-xl bg-[#1a1a2e]/30 border border-white/[0.04] p-2 sm:p-3">
                <div className="text-[9px] sm:text-[10px] text-[#f5f0e8]/20 mb-1.5 sm:mb-2">弃牌堆 ({gameState.discardPile.length})</div>
                <div className="flex flex-wrap gap-0.5 sm:gap-1">
                  {gameState.discardPile.map((t) => <MiniTile key={t.id} tile={t} small />)}
                </div>
              </div>
            )}

            {/* 上家打出的牌 + 吃/跳过按钮 */}
            {gameState.lastDiscardedTile && phase === "playing" && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center gap-3 sm:gap-4 py-2 sm:py-3 rounded-xl bg-[#1a1a2e]/20"
              >
                <span className="text-[10px] sm:text-xs text-[#f5f0e8]/30">
                  {gameState.players.find((p) => p.id === gameState.lastDiscardedBy)?.name} 打出
                </span>
                <MiniTile tile={gameState.lastDiscardedTile} />
                {canEat && (
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => socket.emit("eat-tile")}
                      className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#4a7c59] text-white font-bold text-sm hover:bg-[#4a7c59]/80 transition-colors animate-pulse"
                    >
                      吃！
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (gameState.lastDiscardedTile) {
                          setPassedEatTileId(gameState.lastDiscardedTile.id);
                        }
                      }}
                      className="px-5 py-2.5 rounded-xl bg-white/[0.08] text-[#f5f0e8]/50 font-bold text-sm hover:bg-white/[0.15] transition-colors"
                    >
                      跳过
                    </motion.button>
                  </div>
                )}
              </motion.div>
            )}

            {/* 功能牌【删】- 选择目标玩家 */}
            {phase === "function" && gameState.functionCardState.type === "删" && gameState.functionCardState.waitingFor === myId && (
              <div className="rounded-xl bg-[#c23616]/10 border border-[#c23616]/20 p-4">
                <div className="text-sm text-[#c23616] font-medium mb-2">⚡ 功能牌【删】生效中</div>
                <div className="text-xs text-[#f5f0e8]/40 mb-3">选择一位玩家，随机删除其1张手牌并补摸1张</div>
                <div className="flex gap-3 justify-center flex-wrap">
                  {otherPlayers.filter(p => !gameState.finishedDeclarations.some(d => d.playerId === p.id)).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        socket.emit("execute-function", { action: "delete", data: { targetPlayerId: p.id } });
                      }}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] hover:bg-[#c23616]/20 hover:border-[#c23616]/30 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-white/[0.1] flex items-center justify-center text-sm font-bold text-[#f5f0e8]/60">
                        {p.name.charAt(0)}
                      </div>
                      <span className="text-sm text-[#f5f0e8]/60">{p.name}</span>
                      <span className="text-[10px] text-[#f5f0e8]/20">{p.handSize}张</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 功能牌等待区（非换、非预、非享、非删） */}
            {phase === "function" && gameState.functionCardState.waitingFor === myId && gameState.functionCardState.type !== "换" && gameState.functionCardState.type !== "预" && gameState.functionCardState.type !== "享" && gameState.functionCardState.type !== "删" && (
              <div className="rounded-xl bg-[#c23616]/10 border border-[#c23616]/20 p-4">
                <div className="text-sm text-[#c23616] font-medium mb-2">
                  ⚡ 功能牌【{gameState.functionCardState.type}】生效中
                </div>
                <div className="text-xs text-[#f5f0e8]/40 mb-3">
                  {gameState.functionCardState.type === "禁" && "下家将被跳过一个回合"}
                  {gameState.functionCardState.type === "反" && "出牌顺序已反转"}
                  {gameState.functionCardState.type === "替" && "这张牌可作为任意字使用，已加入手牌"}
                </div>
                <button onClick={() => socket.emit("finish-function")} className="px-4 py-2 rounded-xl bg-[#c23616] text-white text-sm font-medium hover:bg-[#c23616]/80 transition-colors">
                  确认，继续
                </button>
              </div>
            )}

            {/* 功能牌【预】- 拖拽排序牌墙 */}
            {phase === "function" && gameState.functionCardState.type === "预" && gameState.functionCardState.waitingFor === myId && gameState.functionCardState.data.topTiles && (() => {
              const topTiles = gameState.functionCardState.data.topTiles as PublicTile[];
              return <PreviewWallPanel topTiles={topTiles} onConfirm={(orderedIds) => socket.emit("reorder-wall", orderedIds)} />;
            })()}

            {/* 换牌功能牌 - 发起者选目标玩家 */}
            {phase === "function" && gameState.functionCardState.type === "换" && gameState.functionCardState.waitingFor === myId && !(gameState.functionCardState.data as Record<string, unknown>).targetPlayerId && (
              <div className="rounded-xl bg-[#c23616]/10 border border-[#c23616]/20 p-4">
                <div className="text-sm text-[#c23616] font-medium mb-2">⚡ 功能牌【换】生效中</div>
                <div className="text-xs text-[#f5f0e8]/40 mb-3">选择一位玩家进行换牌</div>
                <div className="flex gap-3 justify-center flex-wrap">
                  {otherPlayers.filter(p => !gameState.finishedDeclarations.some(d => d.playerId === p.id)).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        socket.emit("execute-function", { action: "swap", data: { targetPlayerId: p.id } });
                      }}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] hover:bg-[#d4a574]/20 hover:border-[#d4a574]/30 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-white/[0.1] flex items-center justify-center text-sm font-bold text-[#f5f0e8]/60">
                        {p.name.charAt(0)}
                      </div>
                      <span className="text-sm text-[#f5f0e8]/60">{p.name}</span>
                      <span className="text-[10px] text-[#f5f0e8]/20">{p.handSize}张</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 换牌功能牌 - 发起者选自己的牌 */}
            {phase === "function" && gameState.functionCardState.type === "换" && (gameState.functionCardState.data as Record<string, unknown>).requesterId === myId && (gameState.functionCardState.data as Record<string, unknown>).targetPlayerId && !(gameState.functionCardState.data as Record<string, unknown>).requesterTileId && (
              <div className="rounded-xl bg-[#c23616]/10 border border-[#c23616]/20 p-4">
                <div className="text-sm text-[#c23616] font-medium mb-2">⚡ 功能牌【换】选择你的牌</div>
                <div className="text-xs text-[#f5f0e8]/40 mb-3">
                  与 {otherPlayers.find(p => p.id === (gameState.functionCardState.data as Record<string, unknown>).targetPlayerId)?.name} 换牌，选择你要交换出去的牌
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => { if (selectedTileIds.length === 1) { socket.emit("swap-tile", { myTileId: selectedTileIds[0] }); setSelectedTileIds([]); } }}
                    className="px-4 py-2 rounded-lg bg-[#d4a574] text-[#0d0d1a] text-xs font-medium hover:bg-[#d4a574]/80 transition-colors disabled:opacity-30"
                    disabled={selectedTileIds.length !== 1}
                  >确认交换</button>
                </div>
              </div>
            )}

            {/* 换牌功能牌 - 目标玩家选牌 */}
            {phase === "function" && gameState.functionCardState.type === "换" && (gameState.functionCardState.data as Record<string, unknown>).targetPlayerId === myId && !(gameState.functionCardState.data as Record<string, unknown>).targetTileId && (
              <div className="rounded-xl bg-[#d4a574]/10 border border-[#d4a574]/20 p-4">
                <div className="text-sm text-[#d4a574] font-medium mb-2">⚡ {gameState.players.find(p => p.id === (gameState.functionCardState.data as Record<string, unknown>).requesterId)?.name} 对你使用了【换】</div>
                <div className="text-xs text-[#f5f0e8]/40 mb-3">选择你要交换出去的牌</div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => { if (selectedTileIds.length === 1) { socket.emit("swap-tile", { myTileId: selectedTileIds[0] }); setSelectedTileIds([]); } }}
                    className="px-4 py-2 rounded-lg bg-[#d4a574] text-[#0d0d1a] text-xs font-medium hover:bg-[#d4a574]/80 transition-colors disabled:opacity-30"
                    disabled={selectedTileIds.length !== 1}
                  >确认交换</button>
                </div>
              </div>
            )}

            {/* 换牌功能牌 - 等待对方选牌 */}
            {phase === "function" && gameState.functionCardState.type === "换" && ((gameState.functionCardState.data as Record<string, unknown>).requesterId === myId && (gameState.functionCardState.data as Record<string, unknown>).requesterTileId && !(gameState.functionCardState.data as Record<string, unknown>).targetTileId) && (
              <div className="rounded-xl bg-[#c23616]/10 border border-[#c23616]/20 p-4">
                <div className="text-sm text-[#c23616] font-medium mb-2">⚡ 等待对方选牌...</div>
                <div className="text-xs text-[#f5f0e8]/40">等待 {otherPlayers.find(p => p.id === (gameState.functionCardState.data as Record<string, unknown>).targetPlayerId)?.name} 选择交换的牌</div>
              </div>
            )}

            {/* 换牌功能牌 - 等待发起者选牌 */}
            {phase === "function" && gameState.functionCardState.type === "换" && ((gameState.functionCardState.data as Record<string, unknown>).targetPlayerId === myId && (gameState.functionCardState.data as Record<string, unknown>).targetTileId && !(gameState.functionCardState.data as Record<string, unknown>).requesterTileId) && (
              <div className="rounded-xl bg-[#d4a574]/10 border border-[#d4a574]/20 p-4">
                <div className="text-sm text-[#d4a574] font-medium mb-2">⚡ 等待对方选牌...</div>
                <div className="text-xs text-[#f5f0e8]/40">等待 {gameState.players.find(p => p.id === (gameState.functionCardState.data as Record<string, unknown>).requesterId)?.name} 选择交换的牌</div>
              </div>
            )}

            {/* 功能牌【享】- 选牌阶段 */}
            {phase === "function" && gameState.functionCardState.type === "享" && (gameState.functionCardState.data as Record<string, unknown>).phase === "offering" && (() => {
              const shareData = gameState.functionCardState.data as { phase: string; offeredTiles: { playerId: string }[]; pool: unknown[]; pickerOrder: string[] };
              const hasOffered = shareData.offeredTiles.some(o => o.playerId === myId);
              const offeredCount = shareData.offeredTiles.length;
              const totalCount = shareData.pickerOrder.length;
              const offeredNames = shareData.offeredTiles.map(o => gameState.players.find(p => p.id === o.playerId)?.name).filter(Boolean);
              return (
                <div className="rounded-xl bg-[#c23616]/10 border border-[#c23616]/20 p-4">
                  <div className="text-sm text-[#c23616] font-medium mb-2">⚡ 功能牌【享】共享选牌</div>
                  <div className="text-xs text-[#f5f0e8]/40 mb-1">每位玩家选择1张牌打入选牌堆 ({offeredCount}/{totalCount})</div>
                  {offeredNames.length > 0 && (
                    <div className="text-xs text-[#d4a574]/60 mb-2">已选牌：{offeredNames.join("、")}</div>
                  )}
                  {isFinished ? (
                    <div className="text-xs text-[#d4a574]/60 mt-2">🏆 已胡牌，无需选牌</div>
                  ) : hasOffered ? (
                    <div className="text-xs text-[#f5f0e8]/40 mt-2 animate-pulse">✅ 已选牌，等待其他玩家...</div>
                  ) : (
                    <>
                      <div className="text-xs text-[#f5f0e8]/40 mb-3">👇 从手牌中选择1张牌打出</div>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => { if (selectedTileIds.length === 1) { socket.emit("swap-tile", { myTileId: selectedTileIds[0] }); setSelectedTileIds([]); } }}
                          className="px-4 py-2 rounded-lg bg-[#c23616] text-white text-xs font-medium hover:bg-[#c23616]/80 transition-colors disabled:opacity-30"
                          disabled={selectedTileIds.length !== 1}
                        >打出选牌</button>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* 功能牌【享】- 挑选阶段 */}
            {phase === "function" && gameState.functionCardState.type === "享" && (gameState.functionCardState.data as Record<string, unknown>).phase === "picking" && (() => {
              const shareData = gameState.functionCardState.data as {
                phase: string;
                pool: { id: string; char: string; category: string; isFunction: boolean }[];
                currentPickerIndex: number;
                pickerOrder: string[];
              };
              const currentPickerId = shareData.pickerOrder[shareData.currentPickerIndex];
              const isMyPick = currentPickerId === myId;
              const currentPickerName = gameState.players.find(p => p.id === currentPickerId)?.name;
              const pickedCount = shareData.pickerOrder.length - shareData.pool.length;
              return (
                <div className="rounded-xl bg-[#c23616]/10 border border-[#c23616]/20 p-4">
                  <div className="text-sm text-[#c23616] font-medium mb-2">⚡ 功能牌【享】挑选阶段</div>
                  <div className="text-xs text-[#f5f0e8]/40 mb-3">
                    {isMyPick ? "🎯 轮到你从选牌堆中挑选1张牌" : `⏳ 等待 ${currentPickerName} 挑选...`}
                    <span className="ml-2">({pickedCount}/{shareData.pickerOrder.length}已选)</span>
                  </div>
                  <div className="flex gap-2 justify-center flex-wrap mb-3">
                    {shareData.pool.map((t) => {
                      const isFunc = t.isFunction;
                      const catColor = categoryColors[t.category] || "#6b6b6b";
                      return (
                        <button
                          key={t.id}
                          onClick={() => isMyPick && setSharePickTileId(t.id)}
                          className={`relative w-14 h-[4.5rem] rounded-lg overflow-hidden transition-all duration-200 ${
                            sharePickTileId === t.id
                              ? "ring-2 ring-[#c23616] ring-offset-2 ring-offset-[#0d0d1a] scale-105"
                              : ""
                          } ${!isMyPick ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:scale-105"}`}
                          style={{
                            background: "linear-gradient(145deg, #faf6ee 0%, #f0e8d8 50%, #e8dcc8 100%)",
                            boxShadow: sharePickTileId === t.id
                              ? "0 0 16px rgba(194,54,22,0.5)"
                              : "0 2px 8px rgba(0,0,0,0.3)",
                          }}
                        >
                          {isFunc ? (
                            <>
                              <div
                                className="absolute top-0 right-0 w-6 h-6"
                                style={{
                                  background: "linear-gradient(135deg, #c23616 0%, #c2361699 100%)",
                                  clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                                }}
                              />
                              <div className="absolute top-0 right-0 text-white/80 text-[7px] font-bold leading-tight text-right" style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
                                功能
                              </div>
                            </>
                          ) : (
                            <div
                              className="absolute top-0 right-0 w-4 h-4"
                              style={{
                                background: `linear-gradient(135deg, ${catColor} 0%, ${catColor}99 100%)`,
                                clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                              }}
                            />
                          )}
                          <div className="flex items-center justify-center h-full">
                            <span
                              className="text-2xl font-bold"
                              style={{
                                color: isFunc ? "#c23616" : "#1a1a2e",
                                textShadow: isFunc
                                  ? "1px 1px 0 rgba(255,255,255,0.8), -1px -1px 0 rgba(0,0,0,0.05)"
                                  : "1px 1px 0 rgba(255,255,255,0.6)",
                                fontFamily: "'Noto Serif SC', 'SimSun', serif",
                              }}
                            >
                              {t.char}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {isMyPick && (
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => { if (sharePickTileId) { socket.emit("swap-tile", { myTileId: sharePickTileId }); setSharePickTileId(null); } }}
                        className="px-6 py-2.5 rounded-xl bg-[#c23616] text-white text-sm font-bold hover:bg-[#c23616]/80 transition-colors disabled:opacity-30 shadow-lg shadow-[#c23616]/20"
                        disabled={!sharePickTileId}
                      >选择</button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 操作按钮区 */}
            <div className="flex items-center justify-between py-2">
              <div className="flex-1" />
              <div className="flex items-center gap-3">
                {isLastActivePlayer && isMyTurn && !isFinished && handSize % 2 === 0 && (
                  hasMustPlayFuncCard ? (
                    <div className="text-sm text-[#c23616] font-medium animate-pulse">请先打出功能牌【{mustPlayFuncCards.map(t => t.char).join("】【")}】，打完即可胡牌</div>
                  ) : (
                    <div className="text-sm text-[#d4a574] font-medium animate-pulse">你是最后一位玩家，可以胡牌了！</div>
                  )
                )}
                {canPlay && !showWinForm && selectedTileIds.length === 1 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { socket.emit("play-tile", selectedTileIds[0]); setSelectedTileIds([]); }}
                    className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-[#c23616] text-white font-bold text-base sm:text-lg hover:bg-[#c23616]/80 transition-colors shadow-lg shadow-[#c23616]/20"
                  >
                    打出
                  </motion.button>
                )}
                {canPlayAfterEat && !showWinForm && selectedTileIds.length === 1 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { socket.emit("play-after-eat", selectedTileIds[0]); setSelectedTileIds([]); }}
                    className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-[#c23616] text-white font-bold text-base sm:text-lg hover:bg-[#c23616]/80 transition-colors shadow-lg shadow-[#c23616]/20"
                  >
                    打出
                  </motion.button>
                )}
                {selectedTileIds.length >= 2 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setCombinedGroups(prev => [...prev, [...selectedTileIds]]);
                      setSelectedTileIds([]);
                    }}
                    className="px-5 sm:px-6 py-2.5 rounded-xl bg-[#4a7c59] text-white font-bold text-sm sm:text-base hover:bg-[#4a7c59]/80 transition-colors shadow-lg shadow-[#4a7c59]/20"
                  >
                    🔗 组合
                  </motion.button>
                )}
              </div>
              <div className="flex-1 flex justify-end">
                {canDeclareWin && !showWinForm && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowWinForm(true)}
                    className="px-5 sm:px-6 py-2.5 rounded-xl bg-[#d4a574] text-[#0d0d1a] font-bold text-sm sm:text-base hover:bg-[#d4a574]/80 transition-colors shadow-lg shadow-[#d4a574]/20"
                  >
                    🏆 胡牌
                  </motion.button>
                )}
              </div>
            </div>

            {/* 胡牌摊牌界面 */}
            <AnimatePresence>
              {showWinForm && myPlayer && (() => {
                const groupOfTile = new Map<string, number>();
                combinedGroups.forEach((group, gi) => {
                  group.forEach(id => groupOfTile.set(id, gi));
                });
                const winChars: string[] = [];
                let winPrevGroupIdx: number | undefined = undefined;
                orderedHand.forEach(t => {
                  const ch = editedTiles[t.id] || homophoneMap[t.id] || (t.isFunction ? "" : t.char);
                  if (!ch) { winPrevGroupIdx = undefined; return; }
                  const curGroupIdx = groupOfTile.get(t.id);
                  if (curGroupIdx !== undefined && curGroupIdx !== winPrevGroupIdx) {
                    winChars.push("  ");
                  } else if (curGroupIdx === undefined && winPrevGroupIdx !== undefined) {
                    winChars.push("  ");
                  }
                  winChars.push(ch);
                  winPrevGroupIdx = curGroupIdx;
                });
                const winSentence = winChars.join("").trim();

                return (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl bg-[#1a1a2e]/60 border border-[#d4a574]/20 p-4"
                  >
                    <h4 className="text-sm font-medium text-[#d4a574] mb-2">🏆 摊牌胡牌</h4>
                    <p className="text-xs text-[#f5f0e8]/30 mb-3">拖拽调整牌序 · 选相邻牌组合 · 点击【替】编辑 · 点击【复】复制 · 点击任意牌设谐音</p>

                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={orderedHand.map((t) => t.id)}
                        strategy={horizontalListSortingStrategy}
                      >
                        <div className="flex flex-wrap gap-2 justify-center items-end mb-3">
                          {(() => {
                            const tileIdToIndex = new Map(orderedHand.map((t, i) => [t.id, i]));
                            const tileMap = new Map(orderedHand.map(t => [t.id, t]));
                            const elements: React.ReactNode[] = [];
                            let i = 0;
                            while (i < orderedHand.length) {
                              const tile = orderedHand[i];
                              const gIdx = groupOfTile.get(tile.id);

                              if (gIdx !== undefined) {
                                const group = combinedGroups[gIdx];
                                const groupTiles = group.map(id => tileMap.get(id)!).filter(Boolean);
                                const isGroupSelected = group.every(id => selectedTileIds.includes(id));
                                elements.push(
                                  <div
                                    key={`group-${gIdx}`}
                                    className={`flex rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                                      isGroupSelected ? "ring-2 ring-[#4a7c59] ring-offset-2 ring-offset-[#0d0d1a]" : "ring-1 ring-[#4a7c59]/30"
                                    }`}
                                    onClick={() => {
                                      setCombinedGroups(prev => prev.filter((_, gi) => gi !== gIdx));
                                      setSelectedTileIds([]);
                                    }}
                                    title="点击取消组合"
                                  >
                                    {groupTiles.map((gt) => {
                                      const isFunc = gt.isFunction;
                                      const catColor = categoryColors[gt.category] || "#6b6b6b";
                                      const edited = editedTiles[gt.id];
                                      const homophone = homophoneMap[gt.id];
                                      const displayChar = edited || homophone || gt.char;
                                      const isTi = isFunc && gt.char === "替";
                                      const isFu = isFunc && gt.char === "复";
                                      return (
                                        <div
                                          key={gt.id}
                                          className="relative w-14 h-[4.5rem] overflow-hidden"
                                          style={{
                                            background: "linear-gradient(145deg, #faf6ee 0%, #f0e8d8 50%, #e8dcc8 100%)",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                                            borderRight: "1px solid rgba(0,0,0,0.08)",
                                          }}
                                        >
                                          {isFunc ? (
                                            <>
                                              <div
                                                className="absolute top-0 right-0 w-6 h-6"
                                                style={{
                                                  background: "linear-gradient(135deg, #c23616 0%, #c2361699 100%)",
                                                  clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                                                }}
                                              />
                                              <div className="absolute top-0 right-0 text-white/80 text-[7px] font-bold leading-tight text-right" style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
                                                功能
                                              </div>
                                            </>
                                          ) : (
                                            <div
                                              className="absolute top-0 right-0 w-4 h-4"
                                              style={{
                                                background: `linear-gradient(135deg, ${catColor} 0%, ${catColor}99 100%)`,
                                                clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                                              }}
                                            />
                                          )}
                                          <div className="flex items-center justify-center h-full">
                                            <span
                                              className="text-2xl font-bold"
                                              style={{
                                                color: isFunc ? "#c23616" : "#1a1a2e",
                                                textShadow: isFunc ? "1px 1px 0 rgba(255,255,255,0.8), -1px -1px 0 rgba(0,0,0,0.05)" : "1px 1px 0 rgba(255,255,255,0.6)",
                                                fontFamily: "'Noto Serif SC', 'SimSun', serif",
                                              }}
                                            >
                                              {displayChar}
                                            </span>
                                          </div>
                                          {homophone && !edited && !isFunc && (
                                            <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#4a7c59] rounded-full flex items-center justify-center">
                                              <span className="text-[8px] text-white font-bold">谐</span>
                                            </div>
                                          )}
                                          {edited && isTi && (
                                            <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#c23616] rounded-full flex items-center justify-center">
                                              <span className="text-[8px] text-white font-bold">替</span>
                                            </div>
                                          )}
                                          {edited && isFu && (
                                            <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#8b5cf6] rounded-full flex items-center justify-center">
                                              <span className="text-[8px] text-white font-bold">复</span>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                                i += groupTiles.length;
                              } else {
                                const isSelected = selectedTileIds.includes(tile.id);
                                const isTi = tile.isFunction && tile.char === "替";
                                const isFu = tile.isFunction && tile.char === "复";
                                const edited = editedTiles[tile.id];
                                const homophone = homophoneMap[tile.id];
                                elements.push(
                                  <SortableTile
                                    key={tile.id}
                                    tile={tile}
                                    selected={isSelected}
                                    disabled={false}
                                    displayChar={edited || homophone || undefined}
                                    editBadge={isTi && edited ? "替" : isFu && edited ? "复" : homophone && !tile.isFunction ? "谐" : undefined}
                                    editBadgeColor={isTi && edited ? "#c23616" : isFu && edited ? "#8b5cf6" : homophone && !tile.isFunction ? "#4a7c59" : undefined}
                                    isEditing={editingTileId === tile.id}
                                    onClick={() => {
                                      if (isTi || isFu) {
                                        if (selectedTileIds.length > 0) {
                                          if (isSelected) {
                                            setSelectedTileIds(prev => prev.filter(id => id !== tile.id));
                                          } else {
                                            const lastSelectedId = selectedTileIds[selectedTileIds.length - 1];
                                            const lastIdx = tileIdToIndex.get(lastSelectedId)!;
                                            const curIdx = tileIdToIndex.get(tile.id)!;
                                            if (Math.abs(curIdx - lastIdx) === 1) {
                                              setSelectedTileIds(prev => [...prev, tile.id]);
                                            } else {
                                              setSelectedTileIds([tile.id]);
                                            }
                                          }
                                          return;
                                        }
                                        if (isFu) {
                                          setEditingTileId(tile.id);
                                          return;
                                        }
                                        setEditingTileId(tile.id);
                                        setEditInput(edited || "");
                                        return;
                                      }
                                      if (isSelected) {
                                        setSelectedTileIds(prev => prev.filter(id => id !== tile.id));
                                      } else if (selectedTileIds.length === 0) {
                                        setSelectedTileIds([tile.id]);
                                      } else {
                                        const lastSelectedId = selectedTileIds[selectedTileIds.length - 1];
                                        const lastIdx = tileIdToIndex.get(lastSelectedId)!;
                                        const curIdx = tileIdToIndex.get(tile.id)!;
                                        if (Math.abs(curIdx - lastIdx) === 1) {
                                          setSelectedTileIds(prev => [...prev, tile.id]);
                                        } else {
                                          setSelectedTileIds([tile.id]);
                                        }
                                      }
                                    }}
                                  />
                                );
                                i++;
                              }
                            }
                            return elements;
                          })()}
                        </div>
                      </SortableContext>
                    </DndContext>

                    {selectedTileIds.length >= 2 && (
                      <div className="flex gap-2 justify-center mb-3">
                        <button
                          onClick={() => {
                            setCombinedGroups(prev => [...prev, [...selectedTileIds]]);
                            setSelectedTileIds([]);
                          }}
                          className="px-4 py-1.5 rounded-lg bg-[#4a7c59]/20 text-[#4a7c59] text-xs font-medium hover:bg-[#4a7c59]/30 transition-colors"
                        >组合选中的牌</button>
                        <button
                          onClick={() => setSelectedTileIds([])}
                          className="px-4 py-1.5 rounded-lg bg-white/[0.05] text-[#f5f0e8]/40 text-xs hover:bg-white/[0.1] transition-colors"
                        >取消选择</button>
                      </div>
                    )}

                    {editingTileId && (() => {
                      const editTile = orderedHand.find(t => t.id === editingTileId);
                      const isTi = editTile?.isFunction && editTile?.char === "替";
                      const isFu = editTile?.isFunction && editTile?.char === "复";
                      return (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                        >
                          {isFu ? (
                            <>
                              <div className="text-xs text-[#f5f0e8]/40 mb-2">
                                为【复】牌选择要复制的文字（当前：{editedTiles[editingTileId] || "未设置"}）
                              </div>
                              {(() => {
                                const handTilesForCopy = orderedHand.filter(t => t.id !== editingTileId && !t.isFunction);
                                const discardTilesForCopy = gameState.discardPile;
                                return (
                                  <>
                                    {handTilesForCopy.length > 0 && (
                                      <div className="mb-2">
                                        <div className="text-[10px] text-[#f5f0e8]/20 mb-1">手牌中选择：</div>
                                        <div className="flex flex-wrap gap-1.5">
                                          {handTilesForCopy.map(t => (
                                            <button
                                              key={t.id}
                                              onClick={() => {
                                                setEditedTiles(prev => ({ ...prev, [editingTileId!]: t.char }));
                                                setEditingTileId(null);
                                              }}
                                              className="w-10 h-12 rounded-md flex items-center justify-center text-lg font-bold transition-all hover:scale-110"
                                              style={{
                                                background: "linear-gradient(145deg, #faf6ee 0%, #f0e8d8 50%, #e8dcc8 100%)",
                                                color: "#1a1a2e",
                                                fontFamily: "'Noto Serif SC', 'SimSun', serif",
                                                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                                              }}
                                            >{t.char}</button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {discardTilesForCopy.length > 0 && (
                                      <div className="mb-2">
                                        <div className="text-[10px] text-[#f5f0e8]/20 mb-1">弃牌堆中选择：</div>
                                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                          {discardTilesForCopy.map(t => (
                                            <button
                                              key={t.id}
                                              onClick={() => {
                                                setEditedTiles(prev => ({ ...prev, [editingTileId!]: t.char }));
                                                setEditingTileId(null);
                                              }}
                                              className="w-10 h-12 rounded-md flex items-center justify-center text-lg font-bold transition-all hover:scale-110"
                                              style={{
                                                background: "linear-gradient(145deg, #faf6ee 0%, #f0e8d8 50%, #e8dcc8 100%)",
                                                color: "#1a1a2e",
                                                fontFamily: "'Noto Serif SC', 'SimSun', serif",
                                                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                                              }}
                                            >{t.char}</button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                              <div className="flex gap-2 mt-2">
                                {editedTiles[editingTileId] && (
                                  <button
                                    onClick={() => {
                                      setEditedTiles(prev => {
                                        const next = { ...prev };
                                        delete next[editingTileId!];
                                        return next;
                                      });
                                      setEditingTileId(null);
                                    }}
                                    className="px-4 py-2 rounded-lg bg-red-600/20 text-red-400 text-sm hover:bg-red-600/30 transition-colors"
                                  >清除</button>
                                )}
                                <button
                                  onClick={() => { setEditingTileId(null); }}
                                  className="px-4 py-2 rounded-lg bg-white/[0.05] text-[#f5f0e8]/40 text-sm hover:bg-white/[0.1] transition-colors"
                                >取消</button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-xs text-[#f5f0e8]/40 mb-2">
                                {isTi
                                  ? `为【替】牌设置文字（当前：${editedTiles[editingTileId] || "未设置"}）`
                                  : `为"${editTile?.char}"设置谐音字（当前：${homophoneMap[editingTileId] || "未设置"}）`
                                }
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={editInput}
                                  onChange={(e) => setEditInput(e.target.value.slice(0, 1))}
                                  maxLength={1}
                                  placeholder={isTi ? "输入一个字..." : "输入谐音字..."}
                                  className="flex-1 px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.1] text-[#f5f0e8] placeholder:text-[#f5f0e8]/15 focus:outline-none focus:border-[#d4a574]/50 text-sm text-center text-lg"
                                  autoFocus
                                />
                                <button
                                  onClick={() => {
                                    if (!editInput.trim()) return;
                                    if (isTi) {
                                      setEditedTiles(prev => ({ ...prev, [editingTileId]: editInput.trim() }));
                                    } else {
                                      setHomophoneMap(prev => ({ ...prev, [editingTileId]: editInput.trim() }));
                                    }
                                    setEditingTileId(null);
                                    setEditInput("");
                                  }}
                                  disabled={!editInput.trim()}
                                  className="px-4 py-2 rounded-lg bg-[#d4a574] text-[#0d0d1a] text-sm font-medium hover:bg-[#d4a574]/80 transition-colors disabled:opacity-30"
                                >确认</button>
                                {(() => {
                                  const hasExisting = isTi ? editedTiles[editingTileId] : homophoneMap[editingTileId];
                                  return hasExisting ? (
                                    <button
                                      onClick={() => {
                                        if (isTi) {
                                          setEditedTiles(prev => {
                                            const next = { ...prev };
                                            delete next[editingTileId];
                                            return next;
                                          });
                                        } else {
                                          setHomophoneMap(prev => {
                                            const next = { ...prev };
                                            delete next[editingTileId];
                                            return next;
                                          });
                                        }
                                        setEditingTileId(null);
                                        setEditInput("");
                                      }}
                                      className="px-4 py-2 rounded-lg bg-red-600/20 text-red-400 text-sm hover:bg-red-600/30 transition-colors"
                                    >清除</button>
                                  ) : null;
                                })()}
                                <button
                                  onClick={() => { setEditingTileId(null); setEditInput(""); }}
                                  className="px-4 py-2 rounded-lg bg-white/[0.05] text-[#f5f0e8]/40 text-sm hover:bg-white/[0.1] transition-colors"
                                >取消</button>
                              </div>
                            </>
                          )}
                        </motion.div>
                      );
                    })()}

                    {winSentence.length > 0 && (
                      <div className="mb-4 p-3 rounded-xl bg-[#d4a574]/10 border border-[#d4a574]/20">
                        <div className="text-xs text-[#d4a574] mb-1">组成的句子：</div>
                        <div className="text-lg text-[#f5f0e8] font-medium leading-relaxed">"{winSentence}"</div>
                      </div>
                    )}

                    {(() => {
                      const hasUnsetTi = orderedHand.some(t => t.isFunction && t.char === "替" && !editedTiles[t.id]);
                      const hasUnsetFu = orderedHand.some(t => t.isFunction && t.char === "复" && !editedTiles[t.id]);
                      return (hasUnsetTi || hasUnsetFu) ? (
                        <div className="mb-4 p-3 rounded-xl bg-[#c23616]/10 border border-[#c23616]/20">
                          {hasUnsetTi && <div className="text-xs text-[#c23616]">⚠️ 请先为所有【替】牌设置文字才能确认胡牌</div>}
                          {hasUnsetFu && <div className="text-xs text-[#8b5cf6]">⚠️ 请先为所有【复】牌复制文字才能确认胡牌</div>}
                        </div>
                      ) : null;
                    })()}

                    <div className="flex gap-2 justify-end">
                      <button onClick={() => {
                        setShowWinForm(false);
                        setEditedTiles({});
                        setHomophoneMap({});
                        setEditingTileId(null);
                      }} className="px-4 py-2 rounded-lg bg-white/[0.05] text-[#f5f0e8]/40 text-sm hover:bg-white/[0.1] transition-colors">取消</button>
                      <button
                        onClick={() => {
                          const groupOfTile2 = new Map<string, number>();
                          combinedGroups.forEach((group, gi) => {
                            group.forEach(id => groupOfTile2.set(id, gi));
                          });
                          const chars: string[] = [];
                          let prevGroupIdx: number | undefined = undefined;
                          orderedHand.forEach(t => {
                            const ch = editedTiles[t.id] || homophoneMap[t.id] || (t.isFunction ? "" : t.char);
                            if (!ch) { prevGroupIdx = undefined; return; }
                            const curGroupIdx = groupOfTile2.get(t.id);
                            if (curGroupIdx !== undefined && curGroupIdx !== prevGroupIdx) {
                              chars.push("  ");
                            } else if (curGroupIdx === undefined && prevGroupIdx !== undefined) {
                              chars.push("  ");
                            }
                            chars.push(ch);
                            prevGroupIdx = curGroupIdx;
                          });
                          const sentence = chars.join("").trim();
                          if (!sentence) return;
                          const homophones = Object.entries(homophoneMap).map(([tileId, homophone]) => {
                            const tile = orderedHand.find(t => t.id === tileId);
                            return { tileId, original: tile?.char || "", homophone };
                          });
                          const editedTilesArr = Object.entries(editedTiles).map(([tileId, edited]) => {
                            const tile = orderedHand.find(t => t.id === tileId);
                            return { tileId, original: tile?.char || "", edited };
                          });
                          socket.emit("declare-win", { sentence, homophones, editedTiles: editedTilesArr, combinedGroups });
                          setShowWinForm(false);
                          setEditedTiles({});
                          setHomophoneMap({});
                          setEditingTileId(null);
                        }}
                        disabled={(() => {
                          const hasUnsetTi = orderedHand.some(t => t.isFunction && t.char === "替" && !editedTiles[t.id]);
                          const hasUnsetFu = orderedHand.some(t => t.isFunction && t.char === "复" && !editedTiles[t.id]);
                          return hasUnsetTi || hasUnsetFu;
                        })()}
                        className="px-4 py-2 rounded-lg bg-[#d4a574] text-[#0d0d1a] text-sm font-medium hover:bg-[#d4a574]/80 transition-colors disabled:opacity-30"
                      >确认胡牌</button>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>

            {/* 观战模式 - 查看其他玩家手牌（只读） */}
            {isFinished && spectatePlayerId && (() => {
              const spectatedPlayer = gameState.players.find(p => p.id === spectatePlayerId);
              if (!spectatedPlayer) return null;
              const spectatedIsCurrent = gameState.players[gameState.currentPlayerIndex]?.id === spectatePlayerId;
              const spectatedIsFinished = gameState.finishedDeclarations.some(d => d.playerId === spectatePlayerId);

              const spectatedHandOrder = spectatedPlayer.handOrder;
              const spectatedCombinedGroups = spectatedPlayer.combinedGroups || [];

              const spectatedOrderedHand = (() => {
                if (!spectatedHandOrder) return spectatedPlayer.hand;
                const tileMap = new Map(spectatedPlayer.hand.map((t) => [t.id, t]));
                const ordered: PublicTile[] = [];
                for (const id of spectatedHandOrder) {
                  const t = tileMap.get(id);
                  if (t) { ordered.push(t); tileMap.delete(id); }
                }
                for (const t of tileMap.values()) ordered.push(t);
                return ordered;
              })();

              return (
                <div className="rounded-xl p-4 bg-[#4a7c59]/10 border border-[#4a7c59]/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <PlayerSeat
                        player={spectatedPlayer}
                        isCurrent={spectatedIsCurrent}
                        isMe={false}
                        direction={gameState.direction}
                        isFinished={spectatedIsFinished}
                        seatIndex={gameState.players.findIndex(p => p.id === spectatePlayerId)}
                        totalPlayers={gameState.players.length}
                        isSpectating={true}
                      />
                      <span className="text-xs text-[#4a7c59] font-medium">👁 观战中（只读）</span>
                    </div>
                    <button
                      onClick={() => setSpectatePlayerId(null)}
                      className="px-3 py-1.5 rounded-lg bg-[#4a7c59]/20 border border-[#4a7c59]/30 text-[#4a7c59] text-xs font-medium hover:bg-[#4a7c59]/30 transition-colors"
                    >
                      返回我的视角
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center items-end">
                    {(() => {
                      const tileMap = new Map(spectatedOrderedHand.map(t => [t.id, t]));
                      const groupOfTile = new Map<string, number>();
                      spectatedCombinedGroups.forEach((group, gi) => {
                        group.forEach(id => groupOfTile.set(id, gi));
                      });

                      const elements: React.ReactNode[] = [];
                      let i = 0;
                      while (i < spectatedOrderedHand.length) {
                        const tile = spectatedOrderedHand[i];
                        const groupIdx = groupOfTile.get(tile.id);

                        if (groupIdx !== undefined) {
                          const group = spectatedCombinedGroups[groupIdx];
                          const groupTiles = group.map(id => tileMap.get(id)!).filter(Boolean);
                          elements.push(
                            <div
                              key={`group-${groupIdx}`}
                              className="flex rounded-lg overflow-hidden ring-1 ring-[#4a7c59]/30"
                            >
                              {groupTiles.map((gt) => {
                                const isFunc = gt.isFunction;
                                const catColor = categoryColors[gt.category] || "#6b6b6b";
                                return (
                                  <div
                                    key={gt.id}
                                    className="relative w-14 h-[4.5rem] overflow-hidden select-none"
                                    style={{
                                      background: "linear-gradient(145deg, #faf6ee 0%, #f0e8d8 50%, #e8dcc8 100%)",
                                      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                                      borderRight: "1px solid rgba(0,0,0,0.08)",
                                    }}
                                  >
                                    {isFunc ? (
                                      <>
                                        <div
                                          className="absolute top-0 right-0 w-6 h-6"
                                          style={{
                                            background: "linear-gradient(135deg, #c23616 0%, #c2361699 100%)",
                                            clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                                          }}
                                        />
                                        <div className="absolute top-0 right-0 text-white/80 text-[7px] font-bold leading-tight text-right" style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
                                          功能
                                        </div>
                                      </>
                                    ) : (
                                      <div
                                        className="absolute top-0 right-0 w-4 h-4"
                                        style={{
                                          background: `linear-gradient(135deg, ${catColor} 0%, ${catColor}99 100%)`,
                                          clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                                        }}
                                      />
                                    )}
                                    <div className="flex items-center justify-center h-full">
                                      <span
                                        className="text-2xl font-bold"
                                        style={{
                                          color: isFunc ? "#c23616" : "#1a1a2e",
                                          textShadow: isFunc ? "1px 1px 0 rgba(255,255,255,0.8), -1px -1px 0 rgba(0,0,0,0.05)" : "1px 1px 0 rgba(255,255,255,0.6)",
                                          fontFamily: "'Noto Serif SC', 'SimSun', serif",
                                        }}
                                      >
                                        {gt.char}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                          i += groupTiles.length;
                        } else {
                          const isFunc = tile.isFunction;
                          const catColor = categoryColors[tile.category] || "#6b6b6b";
                          elements.push(
                            <div
                              key={tile.id}
                              className="relative w-14 h-[4.5rem] rounded-lg overflow-hidden select-none"
                              style={{
                                background: "linear-gradient(145deg, #faf6ee 0%, #f0e8d8 50%, #e8dcc8 100%)",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                              }}
                            >
                              {isFunc ? (
                                <>
                                  <div
                                    className="absolute top-0 right-0 w-6 h-6"
                                    style={{
                                      background: "linear-gradient(135deg, #c23616 0%, #c2361699 100%)",
                                      clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                                    }}
                                  />
                                  <div className="absolute top-0 right-0 text-white/80 text-[7px] font-bold leading-tight text-right" style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
                                    功能
                                  </div>
                                </>
                              ) : (
                                <div
                                  className="absolute top-0 right-0 w-4 h-4"
                                  style={{
                                    background: `linear-gradient(135deg, ${catColor} 0%, ${catColor}99 100%)`,
                                    clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                                  }}
                                />
                              )}
                              <div className="flex items-center justify-center h-full">
                                <span
                                  className="text-2xl font-bold"
                                  style={{
                                    color: isFunc ? "#c23616" : "#1a1a2e",
                                    textShadow: isFunc ? "1px 1px 0 rgba(255,255,255,0.8), -1px -1px 0 rgba(0,0,0,0.05)" : "1px 1px 0 rgba(255,255,255,0.6)",
                                    fontFamily: "'Noto Serif SC', 'SimSun', serif",
                                  }}
                                >
                                  {tile.char}
                                </span>
                              </div>
                            </div>
                          );
                          i++;
                        }
                      }
                      return elements;
                    })()}
                  </div>
                  <p className="text-center text-xs text-[#4a7c59]/50 mt-2">👁 观战模式 · 只能查看不能操作</p>
                </div>
              );
            })()}

            {/* 我的手牌 - 可拖拽排序 */}
            {myPlayer && !(isFinished && spectatePlayerId) && (
              <div className={`rounded-xl p-2 sm:p-4 transition-all duration-300 ${isMyTurn ? "bg-[#1a1a2e]/60 border border-[#c23616]/20" : "bg-[#1a1a2e]/40 border border-white/[0.06]"}`}>
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-2">
                    <PlayerSeat player={myPlayer} isCurrent={isMyTurn} isMe={true} direction={gameState.direction} isFinished={isFinished} seatIndex={gameState.players.findIndex(p => p.id === myId)} totalPlayers={gameState.players.length} actionLabel={isFinished ? undefined : isMyTurn ? (phase === "playing" ? (handSize % 2 === 1 ? "摸牌中..." : "出牌中...") : phase === "eating" ? "吃牌出牌中..." : phase === "function" ? "功能牌中..." : `${myPlayer.hand.length}张牌`) : `${myPlayer.hand.length}张牌`} />
                    {isFinished && (
                      <span className="text-[10px] sm:text-xs text-[#4a7c59]/60">点击上方玩家头像可观战</span>
                    )}
                  </div>
                  <span className="text-[10px] sm:text-xs text-[#f5f0e8]/20">{myPlayer.hand.length}张 · 拖拽排序</span>
                </div>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={orderedHand.map((t) => t.id)}
                    strategy={horizontalListSortingStrategy}
                  >
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center items-end overflow-x-auto scrollbar-hide pb-1">
                      {(() => {
                        const tileIdToIndex = new Map(orderedHand.map((t, i) => [t.id, i]));
                        const tileMap = new Map(orderedHand.map(t => [t.id, t]));
                        const groupOfTile = new Map<string, number>();
                        combinedGroups.forEach((group, gi) => {
                          group.forEach(id => groupOfTile.set(id, gi));
                        });

                        const elements: React.ReactNode[] = [];
                        let i = 0;
                        while (i < orderedHand.length) {
                          const tile = orderedHand[i];
                          const groupIdx = groupOfTile.get(tile.id);

                          if (groupIdx !== undefined) {
                            const group = combinedGroups[groupIdx];
                            const groupTiles = group.map(id => tileMap.get(id)!).filter(Boolean);
                            const isGroupSelected = group.every(id => selectedTileIds.includes(id));
                              elements.push(
                              <div
                                key={`group-${groupIdx}`}
                                className={`flex rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                                  isGroupSelected ? "ring-2 ring-[#4a7c59] ring-offset-2 ring-offset-[#0d0d1a]" : "ring-1 ring-[#4a7c59]/30"
                                }`}
                                onClick={() => {
                                  setCombinedGroups(prev => prev.filter((_, gi) => gi !== groupIdx));
                                  setSelectedTileIds([]);
                                }}
                                title="点击取消组合"
                              >
                                {groupTiles.map((gt) => {
                                  const isFunc = gt.isFunction;
                                  const catColor = categoryColors[gt.category] || "#6b6b6b";
                                  return (
                                    <div
                                      key={gt.id}
                                      className="relative w-14 h-[4.5rem] overflow-hidden"
                                      style={{
                                        background: "linear-gradient(145deg, #faf6ee 0%, #f0e8d8 50%, #e8dcc8 100%)",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                                        borderRight: "1px solid rgba(0,0,0,0.08)",
                                      }}
                                    >
                                      {isFunc ? (
                                        <>
                                          <div
                                            className="absolute top-0 right-0 w-6 h-6"
                                            style={{
                                              background: "linear-gradient(135deg, #c23616 0%, #c2361699 100%)",
                                              clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                                            }}
                                          />
                                          <div className="absolute top-0 right-0 text-white/80 text-[7px] font-bold leading-tight text-right" style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
                                            功能
                                          </div>
                                        </>
                                      ) : (
                                        <div
                                          className="absolute top-0 right-0 w-4 h-4"
                                          style={{
                                            background: `linear-gradient(135deg, ${catColor} 0%, ${catColor}99 100%)`,
                                            clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                                          }}
                                        />
                                      )}
                                      <div className="flex items-center justify-center h-full">
                                        <span
                                          className="text-2xl font-bold"
                                          style={{
                                            color: isFunc ? "#c23616" : "#1a1a2e",
                                            textShadow: isFunc ? "1px 1px 0 rgba(255,255,255,0.8), -1px -1px 0 rgba(0,0,0,0.05)" : "1px 1px 0 rgba(255,255,255,0.6)",
                                            fontFamily: "'Noto Serif SC', 'SimSun', serif",
                                          }}
                                        >
                                          {gt.char}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                            i += groupTiles.length;
                          } else {
                            const isSelected = selectedTileIds.includes(tile.id);
                            elements.push(
                              <SortableTile
                                key={tile.id}
                                tile={tile}
                                selected={isSelected}
                                disabled={false}
                                onClick={() => {
                                  const canSelectForCombine = phase === "playing" || phase === "eating" || phase === "function";
                                  const canSelectForAction = canPlay || canPlayAfterEat || (phase === "function" && gameState.functionCardState.type === "换" && (gameState.functionCardState.waitingFor === myId || (gameState.functionCardState.data as Record<string, unknown>).requesterId === myId || (gameState.functionCardState.data as Record<string, unknown>).targetPlayerId === myId)) || (phase === "function" && gameState.functionCardState.type === "享" && (gameState.functionCardState.data as Record<string, unknown>).phase === "offering" && !isFinished && !(gameState.functionCardState.data as { offeredTiles: { playerId: string }[] }).offeredTiles.some(o => o.playerId === myId));
                                  if (!canSelectForCombine && !canSelectForAction) return;

                                  if (isSelected) {
                                    setSelectedTileIds(prev => prev.filter(id => id !== tile.id));
                                  } else if (selectedTileIds.length === 0) {
                                    setSelectedTileIds([tile.id]);
                                  } else {
                                    const lastSelectedId = selectedTileIds[selectedTileIds.length - 1];
                                    const lastIdx = tileIdToIndex.get(lastSelectedId)!;
                                    const curIdx = tileIdToIndex.get(tile.id)!;
                                    if (Math.abs(curIdx - lastIdx) === 1) {
                                      setSelectedTileIds(prev => [...prev, tile.id]);
                                    } else {
                                      setSelectedTileIds([tile.id]);
                                    }
                                  }
                                }}
                              />
                            );
                            i++;
                          }
                        }
                        return elements;
                      })()}
                    </div>
                  </SortableContext>
                </DndContext>
                {isMyTurn && (canPlay || canPlayAfterEat) && (
                  <p className="text-center text-xs text-[#f5f0e8]/20 mt-2">👆 点击选牌打出 · 选相邻多张可组合 · 拖拽调整顺序</p>
                )}
              </div>
            )}

            {/* 聊天面板 */}
            <ChatPanel messages={chatMessages} onSend={(msg) => socket.emit("send-message", msg)} />

            {/* 牌局播报 */}
            {gameState.gameLog.length > 0 && (
              <div className="rounded-xl bg-[#1a1a2e]/40 border border-white/[0.06] flex flex-col">
                <div className="px-3 py-2 border-b border-white/[0.06] text-xs text-[#f5f0e8]/40 font-medium">
                  📢 牌局播报
                </div>
                <div className="overflow-y-auto p-2 space-y-1 max-h-32">
                  {[...gameState.gameLog].reverse().slice(0, 30).map((entry) => {
                    let displayMessage = entry.message;
                    if (entry.visibleTileChar && entry.visiblePlayerId) {
                      const visiblePlayerIds = entry.visiblePlayerId.split("|");
                      const visibleTileChars = entry.visibleTileChar.split("|");
                      const canSee = visiblePlayerIds.some(pid => pid === myId);
                      if (canSee) {
                        if (visiblePlayerIds.length === 1) {
                          displayMessage = displayMessage.replace("摸了一张牌", `摸了1张"${visibleTileChars[0]}"字牌`);
                        } else if (visiblePlayerIds.length === 2) {
                          const myIndex = visiblePlayerIds.indexOf(myId);
                          const otherIndex = myIndex === 0 ? 1 : 0;
                          const myChar = visibleTileChars[myIndex];
                          const otherChar = visibleTileChars[otherIndex];
                          const otherName = gameState.players.find(p => p.id === visiblePlayerIds[otherIndex])?.name || "对方";
                          displayMessage = displayMessage.replace("交换了1张牌", `交换了1张牌（你给出"${myChar}"，得到"${otherChar}"）`);
                        }
                      }
                    }
                    return (
                      <div key={entry.id} className="text-xs text-[#f5f0e8]/50">
                        <span className="text-[#f5f0e8]/20 mr-1.5">{new Date(entry.time).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                        {displayMessage}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <WinApprovalVotingPanel gameState={gameState} myId={myId} onVote={(approved) => socket.emit("win-approval-vote", approved)} />
      <FinalVotingPanel gameState={gameState} myId={myId} onVote={(targetPlayerId) => socket.emit("final-vote", targetPlayerId)} />
      <GameEndPanel gameState={gameState} myId={myId} />
    </div>
  );
}
