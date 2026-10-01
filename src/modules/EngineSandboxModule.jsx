import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Play, RotateCcw, Eye, ShieldAlert, Sparkles, Trophy, Sliders, ArrowUp, ArrowRight, ArrowLeft, Heart, Skull } from 'lucide-react';
import { sounds } from '../utils/sound';

export default function EngineSandboxModule() {
  const canvasRef = useRef(null);

  // Engine Developer Debug Flags
  const [showHitboxes, setShowHitboxes] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [showRaycast, setShowRaycast] = useState(true);

  // Physics Tweak Sliders
  const [gravity, setGravity] = useState(850);
  const [moveSpeed, setMoveSpeed] = useState(240);
  const [jumpForce, setJumpForce] = useState(480);
  const [friction, setFriction] = useState(0.82);
  const [allowDoubleJump, setAllowDoubleJump] = useState(true);

  // Game Score, Health & Status
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [won, setWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [fps, setFps] = useState(60);

  // Mutable Game World
  const worldRef = useRef({
    player: {
      x: 50,
      y: 200,
      w: 24,
      h: 30,
      vx: 0,
      vy: 0,
      isGrounded: false,
      jumpsLeft: 2,
      facing: 1
    },
    movingPlatform: {
      x: 240,
      y: 190,
      w: 110,
      h: 16,
      vx: 60,
      minX: 180,
      maxX: 360,
      color: '#0284c7'
    },
    platforms: [
      { x: 0, y: 320, w: 700, h: 40, color: '#334155' }, // Ground floor
      { x: 100, y: 240, w: 90, h: 16, color: '#475569' },
      { x: 440, y: 140, w: 100, h: 16, color: '#475569' },
      { x: 570, y: 200, w: 100, h: 16, color: '#475569' },
    ],
    enemies: [
      { x: 450, y: 116, w: 24, h: 24, vx: 50, minX: 440, maxX: 516, alive: true },
      { x: 200, y: 296, w: 24, h: 24, vx: -60, minX: 120, maxX: 350, alive: true },
    ],
    coins: [
      { x: 140, y: 200, r: 8, collected: false },
      { x: 300, y: 150, r: 8, collected: false },
      { x: 480, y: 100, r: 8, collected: false },
      { x: 620, y: 160, r: 8, collected: false },
    ],
    particles: [],
    flag: { x: 635, y: 140, w: 25, h: 60 },
    keys: {}
  });

  const handleResetGame = () => {
    sounds.click();
    const w = worldRef.current;
    w.player.x = 50;
    w.player.y = 200;
    w.player.vx = 0;
    w.player.vy = 0;
    w.player.isGrounded = false;
    w.player.jumpsLeft = 2;
    w.coins.forEach(c => (c.collected = false));
    w.enemies.forEach(e => (e.alive = true));
    w.particles = [];
    setScore(0);
    setLives(3);
    setWon(false);
    setGameOver(false);
  };

  const spawnParticles = (x, y, color = '#fbbf24', count = 15) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 180 + 60;
      worldRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 0.5,
        maxLife: 0.5,
        color
      });
    }
  };

  // Presets
  const applyPreset = (type) => {
    sounds.click();
    if (type === 'normal') {
      setGravity(850);
      setMoveSpeed(240);
      setJumpForce(480);
      setFriction(0.82);
    } else if (type === 'moon') {
      setGravity(280);
      setMoveSpeed(200);
      setJumpForce(360);
      setFriction(0.92);
    } else if (type === 'sonic') {
      setGravity(1100);
      setMoveSpeed(450);
      setJumpForce(620);
      setFriction(0.85);
    } else if (type === 'ice') {
      setGravity(850);
      setMoveSpeed(260);
      setJumpForce(480);
      setFriction(0.98); // very slippery
    }
  };

  // Keyboard events with preventDefault
  useEffect(() => {
    const onKeyDown = (e) => {
      if (['Space', 'ArrowUp', 'KeyW', 'ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }
      worldRef.current.keys[e.code] = true;

      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code) && !won && !gameOver) {
        const p = worldRef.current.player;
        if (p.isGrounded) {
          p.vy = -jumpForce;
          p.isGrounded = false;
          p.jumpsLeft = allowDoubleJump ? 1 : 0;
          sounds.jump();
          spawnParticles(p.x + p.w / 2, p.y + p.h, '#e2e8f0', 8);
        } else if (allowDoubleJump && p.jumpsLeft > 0) {
          // Double jump in mid-air
          p.vy = -jumpForce * 0.9;
          p.jumpsLeft -= 1;
          sounds.jump();
          spawnParticles(p.x + p.w / 2, p.y + p.h, '#38bdf8', 12);
        }
      }
    };

    const onKeyUp = (e) => {
      worldRef.current.keys[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [jumpForce, allowDoubleJump, won, gameOver]);

  // Main Game Loop Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let lastTime = performance.now();
    let frameCounter = 0;
    let lastFpsUpdate = performance.now();

    const loop = (currentTime) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      // FPS tracking
      frameCounter++;
      if (currentTime - lastFpsUpdate >= 500) {
        setFps(Math.round((frameCounter * 1000) / (currentTime - lastFpsUpdate)));
        frameCounter = 0;
        lastFpsUpdate = currentTime;
      }

      const world = worldRef.current;
      const p = world.player;
      const keys = world.keys;

      if (!won && !gameOver) {
        // 1. UPDATE MOVING PLATFORM
        const mp = world.movingPlatform;
        mp.x += mp.vx * dt;
        if (mp.x <= mp.minX || mp.x >= mp.maxX) {
          mp.vx = -mp.vx;
        }

        // 2. UPDATE PATROLLING ENEMIES
        world.enemies.forEach(en => {
          if (en.alive) {
            en.x += en.vx * dt;
            if (en.x <= en.minX || en.x >= en.maxX) {
              en.vx = -en.vx;
            }
          }
        });

        // 3. INPUT & HORIZONTAL VELOCITY
        let moveDir = 0;
        if (keys['ArrowRight'] || keys['KeyD']) {
          moveDir += 1;
          p.facing = 1;
        }
        if (keys['ArrowLeft'] || keys['KeyA']) {
          moveDir -= 1;
          p.facing = -1;
        }

        if (moveDir !== 0) {
          p.vx = moveDir * moveSpeed;
        } else {
          p.vx *= Math.pow(friction, dt * 60);
        }

        // 4. GRAVITY & VERTICAL VELOCITY
        p.vy += gravity * dt;

        // 5. APPLY VELOCITY TO POSITION
        p.x += p.vx * dt;
        if (p.x < 0) { p.x = 0; p.vx = 0; }
        if (p.x + p.w > canvas.width) { p.x = canvas.width - p.w; p.vx = 0; }

        p.y += p.vy * dt;

        // 6. PLATFORM COLLISION RESOLUTION (Static + Moving Platforms)
        p.isGrounded = false;
        const allPlatforms = [...world.platforms, mp];

        for (const plat of allPlatforms) {
          if (
            p.x < plat.x + plat.w &&
            p.x + p.w > plat.x &&
            p.y + p.h >= plat.y &&
            p.y + p.h <= plat.y + 18 &&
            p.vy >= 0
          ) {
            p.y = plat.y - p.h;
            p.vy = 0;
            p.isGrounded = true;
            p.jumpsLeft = allowDoubleJump ? 1 : 0;

            // If riding the moving platform, transfer velocity!
            if (plat === mp) {
              p.x += mp.vx * dt;
            }
            break;
          }
        }

        // 7. ENEMY COLLISION & STOMP LOGIC
        world.enemies.forEach(en => {
          if (en.alive) {
            // Check bounding box overlap
            if (
              p.x < en.x + en.w &&
              p.x + p.w > en.x &&
              p.y < en.y + en.h &&
              p.y + p.h > en.y
            ) {
              // Stomp check: If player is falling and player feet are near top of enemy
              if (p.vy > 50 && p.y + p.h <= en.y + 14) {
                en.alive = false;
                p.vy = -380; // Bounce up!
                sounds.stomp();
                spawnParticles(en.x + en.w / 2, en.y + en.h / 2, '#f43f5e', 20);
                setScore(s => s + 250);
              } else {
                // Hurt player!
                sounds.hit();
                spawnParticles(p.x + p.w / 2, p.y + p.h / 2, '#ef4444', 15);
                setLives(l => {
                  const nextL = l - 1;
                  if (nextL <= 0) setGameOver(true);
                  return nextL;
                });
                // Knockback
                p.x = 50;
                p.y = 200;
                p.vy = 0;
              }
            }
          }
        });

        // 8. COIN TRIGGER CHECKS
        world.coins.forEach((c) => {
          if (!c.collected) {
            const coinDist = Math.hypot(p.x + p.w / 2 - c.x, p.y + p.h / 2 - c.y);
            if (coinDist < p.w / 2 + c.r + 4) {
              c.collected = true;
              sounds.coin();
              spawnParticles(c.x, c.y, '#fbbf24', 14);
              setScore(s => s + 100);
            }
          }
        });

        // 9. GOAL FLAG CHECK
        const flag = world.flag;
        if (
          p.x < flag.x + flag.w &&
          p.x + p.w > flag.x &&
          p.y < flag.y + flag.h &&
          p.y + p.h > flag.y
        ) {
          sounds.powerup();
          spawnParticles(flag.x, flag.y, '#10b981', 35);
          setWon(true);
        }

        // Fall off bottom pit protection
        if (p.y > canvas.height + 50) {
          sounds.hit();
          setLives(l => {
            const nextL = l - 1;
            if (nextL <= 0) setGameOver(true);
            return nextL;
          });
          p.x = 50;
          p.y = 200;
          p.vy = 0;
        }
      }

      // 10. UPDATE PARTICLES
      const remainingParticles = [];
      for (const pt of world.particles) {
        pt.life -= dt;
        if (pt.life > 0) {
          pt.x += pt.vx * dt;
          pt.y += pt.vy * dt;
          remainingParticles.push(pt);
        }
      }
      world.particles = remainingParticles;

      // ==========================================
      // RENDERING ENGINE
      // ==========================================

      // Background Sky
      ctx.fillStyle = '#0a0e17';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Star dots
      ctx.fillStyle = '#1e293b';
      for (let i = 0; i < 24; i++) {
        const sx = (i * 37) % canvas.width;
        const sy = (i * 29) % 200;
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Draw Static Platforms
      for (const plat of world.platforms) {
        ctx.fillStyle = plat.color;
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(plat.x, plat.y, plat.w, 3);

        if (showHitboxes) {
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
          ctx.setLineDash([]);
        }
      }

      // Draw Moving Platform
      const mp = world.movingPlatform;
      ctx.fillStyle = mp.color;
      ctx.fillRect(mp.x, mp.y, mp.w, mp.h);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(mp.x, mp.y, mp.w, 3);

      if (showHitboxes) {
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(mp.x, mp.y, mp.w, mp.h);
      }

      // Draw Enemies
      for (const en of world.enemies) {
        if (en.alive) {
          ctx.fillStyle = '#e11d48';
          ctx.fillRect(en.x, en.y, en.w, en.h);

          // Enemy eyes
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(en.x + (en.vx > 0 ? 14 : 3), en.y + 4, 5, 5);
          ctx.fillStyle = '#000000';
          ctx.fillRect(en.x + (en.vx > 0 ? 16 : 4), en.y + 5, 2, 2);

          if (showHitboxes) {
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 1;
            ctx.strokeRect(en.x, en.y, en.w, en.h);
          }
        }
      }

      // Draw Coins
      for (const c of world.coins) {
        if (!c.collected) {
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(c.x - 2, c.y - 4, 3, 3);

          if (showHitboxes) {
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.strokeRect(c.x - c.r, c.y - c.r, c.r * 2, c.r * 2);
            ctx.setLineDash([]);
          }
        }
      }

      // Draw Goal Flag
      const flag = world.flag;
      ctx.fillStyle = '#64748b';
      ctx.fillRect(flag.x, flag.y, 4, flag.h);
      ctx.fillStyle = won ? '#10b981' : '#f43f5e';
      ctx.beginPath();
      ctx.moveTo(flag.x + 4, flag.y);
      ctx.lineTo(flag.x + 24, flag.y + 12);
      ctx.lineTo(flag.x + 4, flag.y + 24);
      ctx.fill();

      // Draw Player
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.scale(p.facing, 1);

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2, -p.h / 2 + 5, 6, 6);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(5, -p.h / 2 + 7, 3, 3);

      ctx.restore();

      // Draw Particles
      for (const pt of world.particles) {
        const alpha = pt.life / pt.maxLife;
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3.5 * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // DEBUG: Hitbox
      if (showHitboxes) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(p.x, p.y, p.w, p.h);
      }

      // DEBUG: Ground Raycast
      if (showRaycast) {
        ctx.strokeStyle = p.isGrounded ? '#10b981' : '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x + p.w / 2, p.y + p.h);
        ctx.lineTo(p.x + p.w / 2, p.y + p.h + 12);
        ctx.stroke();

        ctx.fillStyle = p.isGrounded ? '#10b981' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(p.x + p.w / 2, p.y + p.h + 12, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // DEBUG: Velocity Vector
      if (showVectors && (Math.abs(p.vx) > 10 || Math.abs(p.vy) > 10)) {
        const vScale = 0.08;
        const startX = p.x + p.w / 2;
        const startY = p.y + p.h / 2;
        const endX = startX + p.vx * vScale;
        const endY = startY + p.vy * vScale;

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [showHitboxes, showVectors, showRaycast, gravity, moveSpeed, friction, won, gameOver, allowDoubleJump]);

  const handleTouchJump = () => {
    const p = worldRef.current.player;
    if (p.isGrounded) {
      p.vy = -jumpForce;
      p.isGrounded = false;
      p.jumpsLeft = allowDoubleJump ? 1 : 0;
      sounds.jump();
    } else if (allowDoubleJump && p.jumpsLeft > 0) {
      p.vy = -jumpForce * 0.9;
      p.jumpsLeft -= 1;
      sounds.jump();
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/30 p-6 rounded-2xl border border-cyan-800/40 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg">
            <Cpu className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            6. Canlı Oyun Motoru Laboratuvarı (Playground)
          </h2>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed max-w-4xl">
          Tüm bu öğrendiğiniz parçaların (Döngü, Vektörler, Çarpışma, Raycast, Hareketli Platformlar, Düşman Ezme) 
          birleştiği tam teşekküllü bir <strong>2D Platformer Motoru</strong>! Düşmanların kafasına zıplayarak ezin, 
          hareketli mavi platforma binip hızını taşıyın ve motor parametrelerini canlı değiştirin!
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Canvas & HUD Area */}
        <div className="lg:col-span-8 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          
          {/* Top Bar: Stats & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-cyan-400">
                ⚡ FPS: {fps}
              </span>
              <span className="text-xs font-mono font-bold bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Skor: {score}
              </span>
              <div className="flex items-center gap-1 text-xs font-bold bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-rose-400">
                <Heart className="w-3.5 h-3.5 fill-rose-500" />
                <span>x {lives}</span>
              </div>
            </div>

            <button
              onClick={handleResetGame}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Bölümü Sıfırla</span>
            </button>
          </div>

          {/* Canvas Viewport */}
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#0a0e17]">
            <canvas
              ref={canvasRef}
              width={680}
              height={360}
              className="w-full h-[360px] block"
            />

            {/* Victory Overlay */}
            {won && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 animate-fadeIn">
                <Trophy className="w-14 h-14 text-amber-400 mb-3 animate-bounce" />
                <h3 className="text-2xl font-black text-white">TEBRİKLER! BÖLÜM BİTTİ!</h3>
                <p className="text-slate-300 text-xs mt-1 mb-4">
                  Tüm fizik ve çarpışma algoritmalarını başarıyla geçtiniz. Toplam Skor: {score}
                </p>
                <button
                  onClick={handleResetGame}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/30 transition"
                >
                  Tekrar Oyna
                </button>
              </div>
            )}

            {/* Game Over Overlay */}
            {gameOver && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 animate-fadeIn">
                <Skull className="w-14 h-14 text-rose-500 mb-3 animate-pulse" />
                <h3 className="text-2xl font-black text-rose-400">OYUN BİTTİ!</h3>
                <p className="text-slate-300 text-xs mt-1 mb-4">
                  Canlarınız tükendi. Düşmanların tepesine basarak onları ezebilirsiniz!
                </p>
                <button
                  onClick={handleResetGame}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/30 transition"
                >
                  Yeniden Dene
                </button>
              </div>
            )}
          </div>

          {/* On-screen touch/click game buttons */}
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 hidden sm:inline">
              Kontroller: <strong>A / D</strong> ile yürü, <strong>Boşluk</strong> ile zıpla (Çift Zıplama aktif!)
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onMouseDown={() => { worldRef.current.keys['ArrowLeft'] = true; }}
                onMouseUp={() => { worldRef.current.keys['ArrowLeft'] = false; }}
                onTouchStart={() => { worldRef.current.keys['ArrowLeft'] = true; }}
                onTouchEnd={() => { worldRef.current.keys['ArrowLeft'] = false; }}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 active:bg-sky-600 rounded-lg text-slate-300 flex items-center justify-center text-xs font-bold transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleTouchJump}
                className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-400 rounded-lg text-white text-xs font-bold shadow-md shadow-sky-600/30 flex items-center gap-1.5 transition"
              >
                <ArrowUp className="w-4 h-4" />
                <span>Zıpla</span>
              </button>
              <button
                onMouseDown={() => { worldRef.current.keys['ArrowRight'] = true; }}
                onMouseUp={() => { worldRef.current.keys['ArrowRight'] = false; }}
                onTouchStart={() => { worldRef.current.keys['ArrowRight'] = true; }}
                onTouchEnd={() => { worldRef.current.keys['ArrowRight'] = false; }}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 active:bg-sky-600 rounded-lg text-slate-300 flex items-center justify-center text-xs font-bold transition"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Engine Developer HUD Controls & Physics Presets */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Debug View Toggles */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Eye className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs uppercase font-bold text-slate-200 tracking-wider">
                Geliştirici Röntgeni (Debug HUD)
              </h4>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-200 block">Hitbox Sınırları</span>
                  <span className="text-[10px] text-slate-400">Yeşil/Kırmızı çarpışma kutuları</span>
                </div>
                <input
                  type="checkbox"
                  checked={showHitboxes}
                  onChange={(e) => setShowHitboxes(e.target.checked)}
                  className="w-4 h-4 accent-cyan-400"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-200 block">Hız Vektör Oku</span>
                  <span className="text-[10px] text-slate-400">Yön ve hızı mavi okla çizer</span>
                </div>
                <input
                  type="checkbox"
                  checked={showVectors}
                  onChange={(e) => setShowVectors(e.target.checked)}
                  className="w-4 h-4 accent-cyan-400"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-200 block">Zemin Işını (Raycast)</span>
                  <span className="text-[10px] text-slate-400">Ayak altından zemini arayan lazer</span>
                </div>
                <input
                  type="checkbox"
                  checked={showRaycast}
                  onChange={(e) => setShowRaycast(e.target.checked)}
                  className="w-4 h-4 accent-cyan-400"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-200 block">Çift Zıplama (Double Jump)</span>
                  <span className="text-[10px] text-slate-400">Havadayken 2. kez sıçrama</span>
                </div>
                <input
                  type="checkbox"
                  checked={allowDoubleJump}
                  onChange={(e) => setAllowDoubleJump(e.target.checked)}
                  className="w-4 h-4 accent-cyan-400"
                />
              </label>
            </div>
          </div>

          {/* Live Engine Physics Controls */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs uppercase font-bold text-slate-200 tracking-wider">
                  Canlı Motor Ayarları
                </h4>
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-2 font-medium">Hazır Dünyalar:</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => applyPreset('normal')}
                  className="p-2 bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 text-slate-300 font-medium transition"
                >
                  🌍 Normal Dünya
                </button>
                <button
                  onClick={() => applyPreset('moon')}
                  className="p-2 bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 text-slate-300 font-medium transition"
                >
                  🌕 Ay Yerçekimi
                </button>
                <button
                  onClick={() => applyPreset('sonic')}
                  className="p-2 bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 text-slate-300 font-medium transition"
                >
                  ⚡ Hızlı Mod
                </button>
                <button
                  onClick={() => applyPreset('ice')}
                  className="p-2 bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 text-slate-300 font-medium transition"
                >
                  🧊 Buz Pisti (Kaygan)
                </button>
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Yerçekimi:</span>
                  <span className="font-mono text-amber-400 font-bold">{gravity}</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="1600"
                  step="50"
                  value={gravity}
                  onChange={(e) => setGravity(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Zıplama Kuvveti:</span>
                  <span className="font-mono text-sky-400 font-bold">{jumpForce}</span>
                </div>
                <input
                  type="range"
                  min="250"
                  max="750"
                  step="25"
                  value={jumpForce}
                  onChange={(e) => setJumpForce(Number(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
