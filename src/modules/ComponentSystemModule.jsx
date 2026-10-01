import React, { useState, useEffect, useRef } from 'react';
import { Layers, Box, Eye, EyeOff, ShieldCheck, Heart, Zap, Sparkles, AlertTriangle } from 'lucide-react';
import CodeSnippetViewer from '../components/CodeSnippetViewer';
import { sounds } from '../utils/sound';

export default function ComponentSystemModule() {
  // Enabled Components
  const [components, setComponents] = useState({
    transform: true,
    spriteRenderer: true,
    rigidBody: true,
    boxCollider: true,
    playerInput: true,
    health: true,
    glowEffect: true
  });

  // Player Physics & Pos State
  const [playerX, setPlayerX] = useState(180);
  const [playerY, setPlayerY] = useState(80); // distance from ground
  const [vy, setVy] = useState(0);
  const [hp, setHp] = useState(100);
  const [statusMessage, setStatusMessage] = useState('');

  const keysRef = useRef({});

  // Toggle Component
  const toggleComponent = (key) => {
    sounds.click();
    setComponents(prev => {
      const next = { ...prev, [key]: !prev[key] };

      if (key === 'boxCollider' && !next.boxCollider && next.rigidBody) {
        setStatusMessage('⚠️ BoxCollider devre dışı bırakıldı! Karakter zeminin içinden düşüyor!');
      } else if (key === 'rigidBody' && !next.rigidBody) {
        setStatusMessage('🛑 RigidBody devre dışı: Yerçekimi durdu, karakter asılı kaldı!');
      } else if (key === 'spriteRenderer' && !next.spriteRenderer) {
        setStatusMessage('👻 SpriteRenderer kapalı: Karakter görünmez oldu ama hala fiziksel olarak dünyada var!');
      } else {
        setStatusMessage('');
      }

      return next;
    });
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.code] = true;
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code) && components.playerInput && components.rigidBody) {
        // Jump only if on ground or close
        if (playerY <= 5) {
          sounds.jump();
          setVy(350);
        }
      }
    };
    const handleKeyUp = (e) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [components.playerInput, components.rigidBody, playerY]);

  // Game Loop for ECS Sandbox
  useEffect(() => {
    let animId;
    let lastTime = performance.now();

    const loop = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      // 1. Player Input Component handling
      if (components.playerInput && components.transform) {
        if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) {
          setPlayerX(x => Math.min(x + 200 * dt, 420));
        }
        if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) {
          setPlayerX(x => Math.max(x - 200 * dt, 20));
        }
      }

      // 2. RigidBody Component handling (Gravity & Velocity)
      if (components.rigidBody && components.transform) {
        setVy(v => v - 700 * dt); // gravity pulling down
        setPlayerY(y => {
          let nextY = y + vy * dt;

          // 3. BoxCollider Component handling
          if (components.boxCollider) {
            // Ground at y = 0
            if (nextY <= 0) {
              nextY = 0;
              setVy(0);
            }
          } else {
            // If fallen off screen, reset
            if (nextY < -150) {
              nextY = 120;
              setVy(0);
            }
          }

          return nextY;
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [components, vy]);

  const handleManualJump = () => {
    if (components.playerInput && components.rigidBody && playerY <= 5) {
      sounds.jump();
      setVy(350);
    }
  };

  const handleResetPos = () => {
    sounds.click();
    setPlayerX(180);
    setPlayerY(80);
    setVy(0);
    setHp(100);
    setStatusMessage('Karakter konumu sıfırlandı.');
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-sky-950/30 p-6 rounded-2xl border border-purple-800/40 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            5. Varlık-Bileşen Mimarisi (Entity-Component System / ECS)
          </h2>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed max-w-4xl">
          Modern oyun motorlarında (Unity, Godot, Unreal) karakterler karmaşık sınıf hiyerarşileri yerine 
          <strong> Lego gibi birbirine takılan Bileşenlerden (Components)</strong> oluşur. 
          Varlık (Entity) sadece boş bir kutudur; içine <code className="text-purple-300 font-mono">RigidBody</code> koyarsanız yerçekimi kazanır, 
          <code className="text-purple-300 font-mono">Collider</code> koyarsanız duvara çarpar.
          Aşağıdaki denetçiden bileşenleri canlı olarak kapatıp açın ve sonuçlarını izleyin!
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Interactive World Simulation */}
        <div className="lg:col-span-7 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-300 tracking-wider">
              Canlı Simülasyon Dünyası
            </span>
            <button
              onClick={handleResetPos}
              className="text-[11px] text-sky-400 hover:text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 transition"
            >
              Karakteri Başa Al
            </button>
          </div>

          {/* Canvas-like viewport */}
          <div className="h-64 bg-[#080d16] rounded-xl border border-slate-800 relative overflow-hidden flex flex-col justify-end p-4">
            
            {/* Ground */}
            <div className={`absolute bottom-0 left-0 right-0 h-16 transition-colors duration-300 border-t-2 ${
              components.boxCollider 
                ? 'bg-slate-800/90 border-emerald-500' 
                : 'bg-slate-900/40 border-dashed border-red-500/50'
            } flex items-center px-4 justify-between`}>
              <span className="text-[11px] font-mono text-slate-400">
                {components.boxCollider ? '🧱 Katı Zemin (Collider Aktif)' : '👻 Hayalet Zemin (Collider Kapalı)'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Y = 0</span>
            </div>

            {/* Entity (Player Character) */}
            {components.transform ? (
              <div
                className="absolute transition-all duration-75 flex flex-col items-center"
                style={{
                  left: `${playerX}px`,
                  bottom: `${playerY + 64}px`, // 64px is ground height
                }}
              >
                {/* Health Bar Component */}
                {components.health && (
                  <div className="w-12 bg-slate-950 rounded-full h-1.5 border border-slate-700 mb-1 overflow-hidden">
                    <div className="bg-emerald-400 h-full w-full"></div>
                  </div>
                )}

                {/* BoxCollider Boundary Visualizer */}
                <div className={`relative ${components.boxCollider ? 'border-2 border-emerald-400/80 rounded-lg p-0.5' : 'border-2 border-dashed border-red-500/40 rounded-lg p-0.5'}`}>
                  
                  {/* SpriteRenderer Component */}
                  {components.spriteRenderer ? (
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-xl shadow-lg ${
                      components.glowEffect ? 'glow-purple bg-gradient-to-tr from-purple-600 to-indigo-500' : 'bg-slate-700'
                    }`}>
                      🧙‍♂️
                    </div>
                  ) : (
                    <div className="w-11 h-11 rounded-lg border border-dashed border-sky-400/60 bg-sky-950/20 flex items-center justify-center text-[10px] text-sky-300 font-mono">
                      Görünmez
                    </div>
                  )}

                  {/* RigidBody Velocity Indicator */}
                  {components.rigidBody && Math.abs(vy) > 10 && (
                    <span className="absolute -right-7 top-2 text-[9px] font-mono text-amber-400">
                      {vy > 0 ? '▲' : '▼'}{Math.abs(Math.round(vy))}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-rose-400 text-xs font-mono">
                ❌ Transform bileşeni kapalı: Varlık uzay-zamanda konumsuz!
              </div>
            )}

            {/* Notification Banner */}
            {statusMessage && (
              <div className="absolute top-3 left-3 right-3 bg-amber-950/90 border border-amber-500/60 text-amber-200 text-xs p-2 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}
          </div>

          {/* Quick Player controls */}
          <div className="flex items-center justify-between text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400">Hızlı Test Kontrolleri:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPlayerX(x => Math.max(x - 30, 20))}
                disabled={!components.playerInput}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded text-slate-300"
              >
                ◀ Sol
              </button>
              <button
                onClick={handleManualJump}
                disabled={!components.playerInput || !components.rigidBody}
                className="px-3 py-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 rounded text-white font-semibold"
              >
                ▲ Zıpla
              </button>
              <button
                onClick={() => setPlayerX(x => Math.min(x + 30, 420))}
                disabled={!components.playerInput}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded text-slate-300"
              >
                Sağ ▶
              </button>
            </div>
          </div>
        </div>

        {/* Right: Component Inspector (Unity / Godot style Inspector) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs uppercase font-bold text-slate-200 tracking-wider">
                  Varlık Denetçisi (Inspector)
                </h4>
              </div>
              <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                Entity: "Oyuncu_01"
              </span>
            </div>

            {/* List of Modular Components */}
            <div className="space-y-2">
              
              {/* Transform */}
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">Transform</span>
                    <span className="text-[10px] text-slate-500 font-mono">({Math.round(playerX)}, {Math.round(playerY)})</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Dünyadaki konum, rotasyon ve boyut</p>
                </div>
                <input
                  type="checkbox"
                  checked={components.transform}
                  onChange={() => toggleComponent('transform')}
                  className="w-4 h-4 accent-purple-500 cursor-pointer"
                />
              </div>

              {/* SpriteRenderer */}
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">SpriteRenderer</span>
                    <span className="text-[10px] text-slate-400">(2D Görsel Çizici)</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Karakterin ekranda görünmesini sağlar</p>
                </div>
                <input
                  type="checkbox"
                  checked={components.spriteRenderer}
                  onChange={() => toggleComponent('spriteRenderer')}
                  className="w-4 h-4 accent-purple-500 cursor-pointer"
                />
              </div>

              {/* RigidBody */}
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">RigidBody (Fizik Motoru)</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Yerçekimi ve hız formüllerini uygular</p>
                </div>
                <input
                  type="checkbox"
                  checked={components.rigidBody}
                  onChange={() => toggleComponent('rigidBody')}
                  className="w-4 h-4 accent-purple-500 cursor-pointer"
                />
              </div>

              {/* BoxCollider */}
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">BoxCollider</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Katı sınır kutusu (Zeminden düşmeyi önler)</p>
                </div>
                <input
                  type="checkbox"
                  checked={components.boxCollider}
                  onChange={() => toggleComponent('boxCollider')}
                  className="w-4 h-4 accent-purple-500 cursor-pointer"
                />
              </div>

              {/* PlayerInput */}
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">PlayerInputController</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Klavyeden gelen tuşları karaktere aktarır</p>
                </div>
                <input
                  type="checkbox"
                  checked={components.playerInput}
                  onChange={() => toggleComponent('playerInput')}
                  className="w-4 h-4 accent-purple-500 cursor-pointer"
                />
              </div>

              {/* HealthComponent */}
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">HealthComponent</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Can değerini tutar ve hasarı yönetir</p>
                </div>
                <input
                  type="checkbox"
                  checked={components.health}
                  onChange={() => toggleComponent('health')}
                  className="w-4 h-4 accent-purple-500 cursor-pointer"
                />
              </div>

            </div>
          </div>

          <CodeSnippetViewer
            title="Unity C# / Godot Mantığı: Bileşen Tasarımı"
            language="csharp"
            code={`// Unity'de bir karaktere bileşen ekleme:
GameObject player = new GameObject("Oyuncu");

player.AddComponent<Transform>();
player.AddComponent<SpriteRenderer>();
player.AddComponent<Rigidbody2D>();
player.AddComponent<BoxCollider2D>();
player.AddComponent<PlayerController>();

// Eğer zıplamasını istemiyorsan, kodu baştan yazmazsın;
// sadece o bileşeni silersin veya kapatırsın!`}
          />
        </div>
      </div>
    </div>
  );
}
