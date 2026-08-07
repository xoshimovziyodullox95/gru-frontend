// src/components/pages/GamePage.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Trophy, Zap, Coins, Play, Pause,
  ChevronLeft, ChevronRight, ChevronDown, RotateCw, ChevronsDown,
} from 'lucide-react';
import { updateUserCoins } from '../services/user';
import toast from 'react-hot-toast';
import '../../styles/game.css';

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const SHAPES = [
  [[1,1,1,1]],           // I
  [[1,1],[1,1]],         // O
  [[0,1,0],[1,1,1]],     // T
  [[0,1,1],[1,1,0]],     // S
  [[1,1,0],[0,1,1]],     // Z
  [[1,0,0],[1,1,1]],     // J
  [[0,0,1],[1,1,1]],     // L
];

const COLORS = ['#22d3ee', '#eab308', '#a855f7', '#22c55e', '#ef4444', '#3b82f6', '#f97316'];

export default function GamePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isPremium = user?.isPremium || user?.user_metadata?.isPremium || false;

  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [started, setStarted] = useState(false);

  const canvasRef = useRef(null);
  const nextCanvasRef = useRef(null);
  const boardWrapRef = useRef(null);
  const boardRef = useRef(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
  const currentPieceRef = useRef(null);
  const nextPieceRef = useRef(null);
  const dropIntervalRef = useRef(800);
  const lastDropRef = useRef(Date.now());
  const gameLoopRef = useRef(null);
  const levelRef = useRef(1);

  const isPremiumRef = useRef(isPremium);
  const gameOverRef = useRef(false);
  const isPausedRef = useRef(false);

  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { levelRef.current = level; }, [level]);

  const getRandomPiece = () => {
    const index = Math.floor(Math.random() * SHAPES.length);
    return {
      shape: SHAPES[index],
      color: COLORS[index],
      x: Math.floor(COLS / 2) - 1,
      y: 0,
    };
  };

  const drawBoard = useCallback((ctx, board) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * BLOCK, 0);
      ctx.lineTo(x * BLOCK, ROWS * BLOCK);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * BLOCK);
      ctx.lineTo(COLS * BLOCK, y * BLOCK);
      ctx.stroke();
    }

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (board[y][x]) {
          ctx.fillStyle = board[y][x];
          ctx.fillRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, BLOCK - 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.strokeRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, BLOCK - 2);
        }
      }
    }
  }, []);

  const drawPiece = (ctx, piece, offsetX = 0, offsetY = 0) => {
    ctx.fillStyle = piece.color;
    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          ctx.fillRect((piece.x + x + offsetX) * BLOCK + 1,
                      (piece.y + y + offsetY) * BLOCK + 1,
                      BLOCK - 2, BLOCK - 2);
        }
      });
    });
  };

  const drawNextPiece = () => {
    const nextCtx = nextCanvasRef.current?.getContext('2d');
    if (!nextCtx || !nextPieceRef.current) return;

    nextCtx.clearRect(0, 0, 120, 120);
    nextCtx.fillStyle = '#1e2937';
    nextCtx.fillRect(0, 0, 120, 120);

    const piece = nextPieceRef.current;
    const offsetX = piece.shape[0].length === 4 ? -0.5 : 0;
    const offsetY = piece.shape.length === 1 ? 1 : 0;

    drawPiece(nextCtx, piece, offsetX, offsetY);
  };

  const collide = (piece, board) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (!piece.shape[y][x]) continue;
        const newX = piece.x + x;
        const newY = piece.y + y;
        if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
        if (newY < 0) continue;
        if (board[newY][newX]) return true;
      }
    }
    return false;
  };

  const mergePiece = (piece, board) => {
    const newBoard = board.map(row => [...row]);
    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const boardY = piece.y + y;
          const boardX = piece.x + x;
          if (boardY >= 0) newBoard[boardY][boardX] = piece.color;
        }
      });
    });
    return newBoard;
  };

  const clearLines = (board) => {
    let linesCleared = 0;
    const newBoard = board.filter(row => {
      const isFull = row.every(cell => cell !== 0);
      if (isFull) linesCleared++;
      return !isFull;
    });

    while (newBoard.length < ROWS) {
      newBoard.unshift(Array(COLS).fill(0));
    }

    return { newBoard, linesCleared };
  };

  const flashClearedRows = (rowIndices) => {
    const wrap = boardWrapRef.current;
    if (!wrap) return;
    const canvas = canvasRef.current;
    const scaleY = canvas.clientHeight / (ROWS * BLOCK);
    rowIndices.forEach((rowIdx) => {
      const el = document.createElement('div');
      el.className = 'line-flash';
      el.style.top = `${rowIdx * BLOCK * scaleY}px`;
      el.style.height = `${BLOCK * scaleY}px`;
      wrap.appendChild(el);
      setTimeout(() => el.remove(), 260);
    });
  };

  const redraw = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && currentPieceRef.current) {
      drawBoard(ctx, boardRef.current);
      drawPiece(ctx, currentPieceRef.current);
    }
  };

  const endGame = (finalCoins) => {
    if (finalCoins > 0) {
      updateUserCoins(finalCoins)
        .then(() => toast.success(`🎉 ${finalCoins} coin qo'shildi!`))
        .catch(() => {});
    }
  };

  const drop = () => {
    const piece = currentPieceRef.current;
    if (!piece) return;

    piece.y += 1;

    if (collide(piece, boardRef.current)) {
      piece.y -= 1;

      const fullRows = [];
      boardRef.current.forEach((row, idx) => {
        const merged = mergePiece(piece, boardRef.current);
        if (merged[idx].every(cell => cell !== 0)) fullRows.push(idx);
      });

      const newBoard = mergePiece(piece, boardRef.current);
      const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);

      if (linesCleared > 0) {
        if (fullRows.length) flashClearedRows(fullRows);
        setLines(prev => prev + linesCleared);
        const points = [0, 100, 300, 500, 800][linesCleared] * levelRef.current;
        setScore(prev => prev + points);

        const earned = isPremiumRef.current ? linesCleared * 3 : linesCleared * 2;
        setCoinsEarned(prev => {
          const next = prev + earned;
          return next;
        });
      }

      boardRef.current = clearedBoard;

      currentPieceRef.current = nextPieceRef.current;
      nextPieceRef.current = getRandomPiece();

      drawNextPiece();

      if (collide(currentPieceRef.current, boardRef.current)) {
        setGameOver(true);
        setCoinsEarned(prev => {
          endGame(prev);
          return prev;
        });
        return;
      }
    }

    redraw();
  };

  const gameLoop = useCallback(() => {
    if (gameOverRef.current || isPausedRef.current) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const now = Date.now();
    if (now - lastDropRef.current > dropIntervalRef.current) {
      drop();
      lastDropRef.current = now;
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, []);

  const startGame = () => {
    boardRef.current = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    currentPieceRef.current = getRandomPiece();
    nextPieceRef.current = getRandomPiece();

    setScore(0);
    setLines(0);
    setLevel(1);
    setCoinsEarned(0);
    setGameOver(false);
    setIsPaused(false);
    setStarted(true);

    dropIntervalRef.current = 800;

    const ctx = canvasRef.current.getContext('2d');
    ctx.canvas.width = COLS * BLOCK;
    ctx.canvas.height = ROWS * BLOCK;

    drawBoard(ctx, boardRef.current);
    drawPiece(ctx, currentPieceRef.current);
    drawNextPiece();

    lastDropRef.current = Date.now();
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  const moveLeft = () => {
    if (gameOverRef.current || isPausedRef.current || !currentPieceRef.current) return;
    const piece = currentPieceRef.current;
    piece.x -= 1;
    if (collide(piece, boardRef.current)) piece.x += 1;
    redraw();
  };
  const moveRight = () => {
    if (gameOverRef.current || isPausedRef.current || !currentPieceRef.current) return;
    const piece = currentPieceRef.current;
    piece.x += 1;
    if (collide(piece, boardRef.current)) piece.x -= 1;
    redraw();
  };
  const softDrop = () => {
    if (gameOverRef.current || isPausedRef.current) return;
    drop();
    lastDropRef.current = Date.now();
  };
  const rotatePiece = () => {
    if (gameOverRef.current || isPausedRef.current || !currentPieceRef.current) return;
    const piece = currentPieceRef.current;
    const rotated = piece.shape[0].map((_, i) => piece.shape.map(row => row[i]).reverse());
    const oldShape = piece.shape;
    piece.shape = rotated;
    if (collide(piece, boardRef.current)) piece.shape = oldShape;
    redraw();
  };
  const hardDrop = () => {
    if (gameOverRef.current || isPausedRef.current || !currentPieceRef.current) return;
    const piece = currentPieceRef.current;
    while (!collide(piece, boardRef.current)) piece.y += 1;
    piece.y -= 1;
    drop();
    lastDropRef.current = Date.now();
  };

  useEffect(() => {
    const handleKey = (e) => {
      switch (e.key) {
        case 'ArrowLeft': moveLeft(); break;
        case 'ArrowRight': moveRight(); break;
        case 'ArrowDown': softDrop(); break;
        case ' ':
        case 'ArrowUp': rotatePiece(); break;
        default: return;
      }
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (lines >= level * 5) {
      setLevel(prev => prev + 1);
      dropIntervalRef.current = Math.max(150, 800 - (level * 60));
    }
  }, [lines, level]);

  useEffect(() => () => {
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
  }, []);

  return (
    <div className="game-page">
      <button className="game-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} /> Orqaga
      </button>

      <div className="game-container tetris-container">
        <div className="game-header">
          <h1>🧩 TETRIS</h1>
          <div className="game-stats">
            <div className="stat-item"><Trophy size={16} /><span>{score}</span></div>
            <div className="stat-item"><span>Lvl</span><strong>{level}</strong></div>
            <div className="stat-item"><Coins size={16} /><span>{coinsEarned}</span></div>
            {isPremium && <div className="stat-item premium-badge"><Zap size={16} /><span>x1.5</span></div>}
          </div>
        </div>

        <div className="tetris-main">
          <div className="tetris-board-wrap" ref={boardWrapRef}>
            <canvas ref={canvasRef} className="tetris-canvas" />
          </div>

          <div className="tetris-sidebar">
            <div>
              <p>Keyingisi</p>
              <canvas ref={nextCanvasRef} width={120} height={120} className="next-canvas" />
            </div>

            <div className="controls-info">
              <p>← → : Harakat</p>
              <p>↓ : Tez tushirish</p>
              <p>Space / ↑ : Burish</p>
            </div>
          </div>
        </div>

        {started && !gameOver && (
          <>
            <button
              className="game-btn pause-btn"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? <Play size={20} /> : <Pause size={20} />}
              {isPaused ? 'Davom ettirish' : 'Pauza'}
            </button>

            <div className="touch-controls">
              <div className="tc-row">
                <button className="tc-btn" onClick={moveLeft} aria-label="Chapga"><ChevronLeft size={22} /></button>
                <button className="tc-btn tc-primary" onClick={rotatePiece} aria-label="Burish"><RotateCw size={22} /></button>
                <button className="tc-btn" onClick={moveRight} aria-label="O'ngga"><ChevronRight size={22} /></button>
              </div>
              <div className="tc-row">
                <button className="tc-btn" onClick={softDrop} aria-label="Sekin tushirish"><ChevronDown size={22} /></button>
                <button className="tc-btn" onClick={hardDrop} aria-label="Tez tushirish"><ChevronsDown size={22} /></button>
              </div>
            </div>
          </>
        )}

        {(gameOver || !started) && (
          <div className="game-overlay">
            <h2>{gameOver ? "🏆 O'yin tugadi!" : "🧩 TETRIS"}</h2>
            {gameOver && (
              <div className="game-result">
                <div className="result-item"><span>Ball</span><strong>{score}</strong></div>
                <div className="result-item"><span>Level</span><strong>{level}</strong></div>
                <div className="result-item"><span>Coin</span><strong>+{coinsEarned}</strong></div>
              </div>
            )}
            {!gameOver && <p>Bloklarni tizib qatorlarni to'ldiring, coin yig'ing!</p>}
            <button className="game-btn" onClick={startGame}>
              {gameOver ? "🔄 Qayta boshlash" : "🚀 Boshlash"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}