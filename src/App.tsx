import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Lobby from "@/pages/Lobby";
import GamePage from "@/pages/GamePage";
import Home from "@/pages/Home";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/game" element={<GamePage />} />
      </Routes>
    </Router>
  );
}
