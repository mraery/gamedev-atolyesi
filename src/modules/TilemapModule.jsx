import React, { useState, useEffect, useRef } from 'react';
import { Grid, Paintbrush, Eraser, Play, RotateCcw, Sparkles, Layers, Box } from 'lucide-react';
import CodeSnippetViewer from '../components/CodeSnippetViewer';
import { sounds } from '../utils/sound';

export default function TilemapModule() {
  const canvasRef = useRef(null);

  const TILE_SIZE = 32;
  const COLS = 20;
  const ROWS = 10;

  // Selected tool: 0 = Empty, 1 = Ground, 2 = Brick, 3 = Coin, 4 = Spikes
  const [selectedTool, setSelectedTool] = useState(1);
  const [isTestMode, setIsTestMode] = useState(false);

  // Initial Grid (2D array)
  const [grid, setGrid] = useState(() => {
    const initial = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    // Default ground at bottom
    for (let c = 0; c < COLS; c++) initial[ROWS - 1][c] = 1;
    // Some starter platforms
    initial[ROWS - 3][3] = 2;
    initial[ROWS - 3][4] = 2;
    initial[ROWS - 3][5] = 2;
    initial[ROWS - 4][4] = 3; // Coin
    initial[ROWS - 5][8] = 2;
    initial[ROWS - 5][9] = 2;
    initial[ROWS - 6][9] = 3; // Coin
    return initial;
  });

  // Player physics state for test mode
  const playerRef = useRef({
    x: 40,
    y: 100,
    vx: 0,
    vy: 0,
    w: 22,
    h: 26,
    isGrounded: false
  });

  const keysRef = useRef({});
  const isPaintingRef = useRef(false);

  // Tools list
  const tools = [
    { id: 1, name: 'Zemin (Ground)', color: 'bg-emerald-600', icon: '🟩' },
    { id: 2, name: 'Tuğla (Brick)', color: 'bg-amber-700', icon: '🧱' },
    { id: 3, name: 'Altın (Coin)', color: 'bg-yellow-500', icon: '🪙' },
    { id: 4, name: 'Diken (Spikes)', color: 'bg-rose-600', icon: '🔺' },
    { id: 0, name: 'Silgi (Boşalt)', color: 'bg-slate-700', icon: '🧹' },
  ];

  // Paint cell helper
  const paintCell = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const c = Math.floor(x / TILE_SIZE);
    const r = Math.floor(y / TILE_SIZE);

    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      setGrid(prev => {
        if (prev[r][c] === selectedTool) return prev;
        const copy = prev.map(row => [...row]);
        copy[r][c] = selectedTool;
        return copy;
      });
    }
  };

  // Keyboard controls in test mode
  useEffect(() => {
    const onKeyDown = (e) => {
      keysRef.current[e.code] = true;
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code) && isTestMode) {
        e.preventDefault();
        const p = playerRef.current;
        if (p.isGrounded) {
          sounds.jump();
          p.vy = -460;
          p.isGrounded = false;
        }
      }
    };
    const onKeyUp = (e) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [isTestMode]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let lastTime = performance.now();

    const render = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const p = playerRef.current;

      // Update Player if Test Mode is active
      if (isTestMode) {
        let moveDir = 0;
        if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) moveDir += 1;
        if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) moveDir -= 1;

        p.vx = moveDir * 200;
        p.vy += 800 * dt; // Gravity

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Tilemap collision checking (Grid math!)
        p.isGrounded = false;

        // Check tile beneath player's feet
        const footY = p.y + p.h;
        const leftCol = Math.floor((p.x + 2) / TILE_SIZE);
        const rightCol = Math.floor((p.x + p.w - 2) / TILE_SIZE);
        const groundRow = Math.floor(footY / TILE_SIZE);

        if (groundRow >= 0 && groundRow < ROWS) {
          for (let col = leftCol; col <= rightCol; col++) {
            if (col >= 0 && col < COLS) {
              const tileType = grid[groundRow][col];
              // Solid tiles: 1 (Ground), 2 (Brick)
              if ([1, 2].includes(tileType) && p.vy >= 0) {
                p.y = groundRow * TILE_SIZE - p.h;
                p.vy = 0;
                p.isGrounded = true;
              } else if (tileType === 3) {
                // Coin pickup
                sounds.coin();
                setGrid(prev => {
                  const copy = prev.map(r => [...r]);
                  copy[groundRow][col] = 0;
                  return copy;
                });
              } else if (tileType === 4) {
                // Spikes hit
                sounds.hit();
                p.x = 40;
                p.y = 100;
                p.vy = 0;
              }
            }
          }
        }

        // Screen bounds
        if (p.x < 0) p.x = 0;
        if (p.x + p.w > canvas.width) p.x = canvas.width - p.w;
        if (p.y > canvas.height + 40) {
          p.x = 40;
          p.y = 100;
          p.vy = 0;
        }
      }

      // ==========================
      // DRAW CANVAS
      // ==========================
      ctx.fillStyle = '#0a0e17';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Grid Tiles
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const tile = grid[r][c];
          const tx = c * TILE_SIZE;
          const ty = r * TILE_SIZE;

          // Subtle grid border
          ctx.strokeStyle = '#182234';
          ctx.lineWidth = 1;
          ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);

          if (tile === 1) {
            // Ground
            ctx.fillStyle = '#10b981';
            ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#059669';
            ctx.fillRect(tx, ty + 6, TILE_SIZE, TILE_SIZE - 6);
          } else if (tile === 2) {
            // Brick
            ctx.fillStyle = '#b45309';
            ctx.fillRect(tx + 1, ty + 1, TILE_SIZE - 2, TILE_SIZE - 2);
            ctx.strokeStyle = '#78350f';
            ctx.strokeRect(tx + 1, ty + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          } else if (tile === 3) {
            // Coin
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(tx + TILE_SIZE / 2, ty + TILE_SIZE / 2, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#f59e0b';
            ctx.stroke();
          } else if (tile === 4) {
            // Spikes
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath();
            ctx.moveTo(tx, ty + TILE_SIZE);
            ctx.lineTo(tx + TILE_SIZE / 2, ty + 6);
            ctx.lineTo(tx + TILE_SIZE, ty + TILE_SIZE);
            ctx.fill();
          }
        }
      }

      // Draw Player if Test Mode
      if (isTestMode) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(p.x + (p.vx >= 0 ? 12 : 4), p.y + 5, 5, 5);

        // Highlight the current occupied tile in red
        const occupiedCol = Math.floor((p.x + p.w / 2) / TILE_SIZE);
        const occupiedRow = Math.floor((p.y + p.h / 2) / TILE_SIZE);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(occupiedCol * TILE_SIZE, occupiedRow * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [grid, isTestMode]);

  const handleResetMap = () => {
    sounds.click();
    const blank = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    for (let c = 0; c < COLS; c++) blank[ROWS - 1][c] = 1;
    setGrid(blank);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-amber-950/30 p-6 rounded-2xl border border-emerald-800/40 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <Grid className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Tilemap (Kareli Harita) & Grid Mimarisi
          </h2>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed max-w-4xl">
          Super Mario veya Terraria gibi oyunlarda 50.000 tuğla için 50.000 ayrı nesne oluşturulmaz! 
          Bunun yerine harita <strong>2 Boyutlu bir Sayı Matrisinde (2D Array)</strong> tutulur: 
          0 = Boşluk, 1 = Zemin, 2 = Tuğla, 3 = Altın. 
          Karakterin hangi karede olduğunu bulmak sadece basit bir bölme işlemidir: 
          <code className="text-emerald-400 font-mono">kareX = Math.floor(oyuncuX / kareBoyutu)</code>.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Level Canvas / Editor */}
        <div className="lg:col-span-8 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Paintbrush className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">Harita Tasarımcısı (Tilemap Painter)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sounds.jump();
                  setIsTestMode(!isTestMode);
                  playerRef.current.x = 40;
                  playerRef.current.y = 100;
                  playerRef.current.vy = 0;
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  isTestMode ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isTestMode ? 'Tasarıma Dön' : 'Karakterle Test Et'}</span>
              </button>

              <button
                onClick={handleResetMap}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                title="Haritayı Temizle"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#0a0e17]">
            <canvas
              ref={canvasRef}
              width={COLS * TILE_SIZE}
              height={ROWS * TILE_SIZE}
              onMouseDown={(e) => {
                if (!isTestMode) {
                  isPaintingRef.current = true;
                  paintCell(e.clientX, e.clientY);
                }
              }}
              onMouseMove={(e) => {
                if (!isTestMode && isPaintingRef.current) {
                  paintCell(e.clientX, e.clientY);
                }
              }}
              onMouseUp={() => { isPaintingRef.current = false; }}
              className={`w-full h-auto block ${isTestMode ? 'cursor-default' : 'cursor-cell'}`}
            />
          </div>

          {/* Palette Tools */}
          {!isTestMode ? (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-slate-400 mr-2 font-medium">Boya Fırçası:</span>
              {tools.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    sounds.click();
                    setSelectedTool(t.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                    selectedTool === t.id
                      ? 'border-emerald-400 bg-emerald-950/50 text-emerald-200 ring-2 ring-emerald-500/30'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-2.5 bg-sky-950/30 border border-sky-800/40 rounded-xl text-xs text-sky-200 flex items-center justify-between">
              <span>🎮 Test Modu Aktif: <strong>A / D</strong> ile yürü, <strong>Boşluk</strong> ile zıpla! Çizdiğiniz bloklara çarpışmayı deneyin.</span>
            </div>
          )}
        </div>

        {/* Math & Code */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
            <h4 className="text-xs uppercase font-bold text-slate-200 tracking-wider border-b border-slate-800 pb-2">
              Bellekteki 2D Dizi Görünümü
            </h4>
            <p className="text-[11px] text-slate-400">
              Aşağıdaki matris, yukarıda boyadığınız haritanın bilgisayar hafızasındaki birebir sayısal karşılığıdır:
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[10px] text-emerald-400 max-h-36 overflow-auto">
              [
              {grid.slice(ROWS - 4).map((row, idx) => (
                <div key={idx} className="tracking-widest">
                  &nbsp;&nbsp;[{row.join(', ')}],
                </div>
              ))}
              &nbsp;&nbsp;...
              ]
            </div>
          </div>

          <CodeSnippetViewer
            title="O(1) Hızında Çarpışma Tespiti"
            language="javascript"
            code={`// 1. Oyuncunun altındaki karenin satır/sütununu bul:
const col = Math.floor(player.x / TILE_SIZE);
const row = Math.floor((player.y + player.h) / TILE_SIZE);

// 2. Anında matrise bak (0(1) hızında, for döngüsü yok!):
const tile = map[row][col];

if (tile === 1 || tile === 2) {
  // Katı zemin bulundu!
  player.y = row * TILE_SIZE - player.h;
  player.vy = 0;
  player.isGrounded = true;
}`}
            note="100.000 blokluk devasa bir haritada bile bu matematik anında 0.00001 milisaniyede sonucu verir."
          />
        </div>
      </div>
    </div>
  );
}
