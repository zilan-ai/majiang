import { useState, useEffect, useCallback } from "react";
import { useGameStore, RoomInfo, PublicGameState } from "@/store/useGameStore";
import { connectSocket, disconnectSocket, isSocketConnected } from "@/lib/socket";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

function PasswordModal({ open, roomName, isError, onConfirm, onCancel }: { open: boolean; roomName: string; isError: boolean; onConfirm: (password: string) => void; onCancel: () => void }) {
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (open) setPassword("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl bg-[#1a1a2e] border border-white/[0.1] p-6 shadow-2xl max-w-xs w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">{isError ? "❌" : "🔒"}</div>
          <h3 className="text-lg font-bold text-[#f5f0e8]">
            {isError ? "密码错误" : "该房间需要密码"}
          </h3>
          <p className="text-sm text-[#f5f0e8]/40 mt-1">
            {isError ? "你输入的密码不正确，请重新输入" : `加入「${roomName}」需要密码`}
          </p>
        </div>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && password.trim() && onConfirm(password.trim())}
          placeholder="输入密码..."
          maxLength={20}
          autoFocus
          className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-[#f5f0e8] placeholder:text-[#f5f0e8]/20 focus:outline-none focus:border-[#d4a574]/50 transition-colors text-center text-lg tracking-widest mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-white/[0.06] text-[#f5f0e8]/60 font-medium hover:bg-white/[0.1] transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => password.trim() && onConfirm(password.trim())}
            disabled={!password.trim()}
            className="flex-1 py-2.5 rounded-xl bg-[#d4a574] text-[#0d0d1a] font-medium hover:bg-[#d4a574]/80 transition-colors disabled:opacity-30"
          >
            确认加入
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function PasswordErrorPanel({ roomName, onRetry, onBack }: { roomName: string; onRetry: () => void; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-[#0d0d1a] text-[#f5f0e8] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl bg-[#1a1a2e] border border-red-500/30 p-8 shadow-2xl max-w-sm w-full text-center"
      >
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-[#f5f0e8] mb-2">密码错误</h2>
        <p className="text-sm text-[#f5f0e8]/40 mb-6">
          加入「{roomName}」的密码不正确，请重新输入
        </p>
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-3 rounded-xl bg-white/[0.06] text-[#f5f0e8]/60 font-medium hover:bg-white/[0.1] transition-colors"
          >
            返回大厅
          </button>
          <button
            onClick={onRetry}
            className="flex-1 py-3 rounded-xl bg-[#d4a574] text-[#0d0d1a] font-bold hover:bg-[#d4a574]/80 transition-colors"
          >
            重新输入
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Lobby() {
  const { myName, setMyName, setMyId, setRoomId, setGameState, rooms, setRooms, setConnected, isConnected, errorMessage, setError } = useGameStore();
  const [nameInput, setNameInput] = useState(myName || "");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [passwordModalRoom, setPasswordModalRoom] = useState<{ roomId: string; roomName: string } | null>(null);
  const [passwordErrorRoom, setPasswordErrorRoom] = useState<{ roomId: string; roomName: string } | null>(null);
  const navigate = useNavigate();

  const setupSocketListeners = useCallback(() => {
    const socket = connectSocket();

    socket.off("connect");
    socket.off("disconnect");
    socket.off("rooms-updated");
    socket.off("room-created");
    socket.off("room-joined");
    socket.off("game-started");
    socket.off("connect_error");
    socket.off("error-msg");

    socket.on("connect", () => {
      setConnected(true);
      setMyId(socket.id!);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket] 连接错误:", err.message);
      setConnected(false);
    });

    socket.on("rooms-updated", (list: RoomInfo[]) => {
      setRooms(list);
    });

    socket.on("room-created", (data: { roomId: string; gameState: PublicGameState }) => {
      setRoomId(data.roomId);
      setGameState(data.gameState);
      navigate("/game");
    });

    socket.on("room-joined", (data: { roomId: string; gameState: PublicGameState }) => {
      setRoomId(data.roomId);
      setGameState(data.gameState);
      setPasswordErrorRoom(null);
      setPasswordModalRoom(null);
      navigate("/game");
    });

    socket.on("game-started", (state: PublicGameState) => {
      setGameState(state);
      navigate("/game");
    });

    socket.on("error-msg", (msg: string) => {
      if (msg === "房间密码错误" && passwordModalRoom) {
        setPasswordErrorRoom(passwordModalRoom);
        setPasswordModalRoom(null);
      } else {
        setError(msg);
        setTimeout(() => setError(null), 3000);
      }
    });

    if (socket.connected) {
      setConnected(true);
      setMyId(socket.id!);
    }

    socket.emit("get-rooms");

    return socket;
  }, [navigate, setConnected, setMyId, setRoomId, setRooms, passwordModalRoom, setError]);

  useEffect(() => {
    const socket = setupSocketListeners();

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("rooms-updated");
      socket.off("room-created");
      socket.off("room-joined");
      socket.off("game-started");
      socket.off("connect_error");
      socket.off("error-msg");
    };
  }, [setupSocketListeners]);

  const handleSetName = () => {
    if (!nameInput.trim()) return;
    setMyName(nameInput.trim());
    const socket = connectSocket();
    socket.emit("set-name", nameInput.trim());
  };

  const handleCreateRoom = () => {
    const socket = connectSocket();
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit("create-room", { roomName: `${myName}的房间`, password: createPassword.trim() || undefined });
  };

  const handleJoinRoom = (roomId: string, password?: string) => {
    const socket = connectSocket();
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit("join-room", { roomId, password: password || undefined });
    setRoomId(roomId);
  };

  const handleRoomClick = (room: RoomInfo) => {
    if (room.hasPassword) {
      setPasswordModalRoom({ roomId: room.id, roomName: room.name });
    } else {
      handleJoinRoom(room.id);
    }
  };

  const handleQuickJoin = () => {
    if (!joinRoomId.trim()) return;
    const targetRoom = rooms.find(r => r.id === joinRoomId.trim().toUpperCase());
    if (targetRoom?.hasPassword) {
      setPasswordModalRoom({ roomId: targetRoom.id, roomName: targetRoom.name });
    } else {
      handleJoinRoom(joinRoomId.trim().toUpperCase());
    }
  };

  if (passwordErrorRoom) {
    return (
      <PasswordErrorPanel
        roomName={passwordErrorRoom.roomName}
        onRetry={() => {
          setPasswordModalRoom(passwordErrorRoom);
          setPasswordErrorRoom(null);
        }}
        onBack={() => {
          setPasswordErrorRoom(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-[#f5f0e8] flex items-center justify-center p-4 relative">
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[#f5f0e8]/50 hover:text-[#f5f0e8]/80 transition-colors text-xs"
      >
        返回
      </button>
      <PasswordModal
        open={!!passwordModalRoom}
        roomName={passwordModalRoom?.roomName || ""}
        isError={false}
        onConfirm={(password) => {
          if (passwordModalRoom) {
            handleJoinRoom(passwordModalRoom.roomId, password);
          }
        }}
        onCancel={() => setPasswordModalRoom(null)}
      />
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-red-600/90 text-white text-sm font-medium shadow-lg"
        >
          {errorMessage}
        </motion.div>
      )}
      <div className="max-w-lg w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-[#f5f0e8] via-[#d4a574] to-[#c23616]">
            文字麻将
          </h1>
          <p className="text-[#f5f0e8]/40 text-sm tracking-widest">脑洞大开版 · 多人对战</p>
        </div>

        {!myName ? (
          <div className="rounded-2xl bg-[#1a1a2e]/60 border border-white/[0.06] p-8">
            <h2 className="text-lg font-medium mb-4 text-center">输入你的名字</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSetName()}
                placeholder="你的昵称..."
                maxLength={10}
                className="flex-1 px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-[#f5f0e8] placeholder:text-[#f5f0e8]/20 focus:outline-none focus:border-[#c23616]/50 transition-colors"
              />
              <button
                onClick={handleSetName}
                className="px-6 py-3 rounded-xl bg-[#c23616] text-white font-medium hover:bg-[#c23616]/80 transition-colors"
              >
                进入
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#1a1a2e]/60 border border-white/[0.06] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">欢迎，{myName}</h2>
                <span className={`text-xs px-2 py-1 rounded-full ${isConnected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                  {isConnected ? "已连接" : "未连接"}
                </span>
              </div>

              <div className="mb-4">
                <div className="text-sm text-[#f5f0e8]/40 mb-2">🔒 房间密码（可选，留空则无需密码）</div>
                <input
                  type="text"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="留空则无需密码..."
                  maxLength={20}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-[#f5f0e8] placeholder:text-[#f5f0e8]/20 focus:outline-none focus:border-[#d4a574]/50 transition-colors text-sm"
                />
              </div>

              <button
                onClick={handleCreateRoom}
                className="w-full py-3 rounded-xl bg-[#c23616] text-white font-bold text-lg hover:bg-[#c23616]/80 transition-colors"
              >
                🎴 创建房间{createPassword.trim() ? " 🔒" : ""}
              </button>
            </div>

            <div className="rounded-2xl bg-[#1a1a2e]/60 border border-white/[0.06] p-6">
              <h2 className="text-lg font-medium mb-4">加入房间</h2>
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleQuickJoin()}
                  placeholder="输入房间号..."
                  maxLength={5}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-[#f5f0e8] placeholder:text-[#f5f0e8]/20 focus:outline-none focus:border-[#d4a574]/50 transition-colors text-center text-xl tracking-[0.3em] font-mono"
                />
                <button
                  onClick={handleQuickJoin}
                  className="px-6 py-3 rounded-xl bg-[#d4a574] text-[#0d0d1a] font-medium hover:bg-[#d4a574]/80 transition-colors"
                >
                  加入
                </button>
              </div>

              {rooms.length > 0 && (
                <div>
                  <h3 className="text-xs text-[#f5f0e8]/30 mb-2 tracking-wider">可用房间</h3>
                  <div className="space-y-2">
                    {rooms.map((room) => (
                      <div
                        key={room.id}
                        className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {room.hasPassword && <span className="text-[#d4a574] mr-1">🔒</span>}
                            {room.name}
                          </div>
                          <div className="text-xs text-[#f5f0e8]/30">
                            {room.playerCount}/{room.maxPlayers}人
                            {room.isPlaying && " · 游戏中"}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRoomClick(room)}
                          disabled={room.isPlaying || room.playerCount >= room.maxPlayers}
                          className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[#d4a574]/20 text-[#d4a574] hover:bg-[#d4a574]/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {room.hasPassword ? "🔒 加入" : "加入"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {rooms.length === 0 && (
                <p className="text-center text-[#f5f0e8]/20 text-sm py-4">暂无房间，创建一个吧</p>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
