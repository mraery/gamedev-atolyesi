import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, MoveRight, ArrowDown, Sparkles, Compass, Sliders, Info } from 'lucide-react';
import CodeSnippetViewer from '../components/CodeSnippetViewer';
import { sounds } from '../utils/sound';

export default function PhysicsVectorModule() {
  const canvasRef = useRef(null);

  // Simulation Parameters
  const [gravity, setGravity] = useState(800); // px / s^2
  const [launchSpeed, setLaunchSpeed] = useState(550);
  const [launchAngle, setLaunchAngle] = useState(45); // degrees
  const [bounciness, setBounciness] = useState(0.75); // restitution
  const [airFriction, setAirFriction] = useState(0.998); // damping
  const [showDecomposition, setShowDecomposition] = useState(true);

  // Ball State
  const ballRef = useRef({
    x: 60,
    y: 320,
    vx: 0,
    vy: 0,
    radius: 14,
    color: '#38bdf8',
    isLaunched: false,
    trail: []
  });

  const [telemetry, setTelemetry] = useState({
    x: 60,
    y: 320,
    vx: 0,
    vy: 0,
    speed: 0
  });

  const isDraggingRef = useRef(false);

  // Launch the ball
  const handleLaunch = () => {
    sounds.jump();
    const rad = (launchAngle * Math.PI) / 180;
    ballRef.current.x = 60;
    ballRef.current.y = 320;
    ballRef.current.vx = launchSpeed * Math.cos(rad);
    ballRef.current.vy = -launchSpeed * Math.sin(rad); // negative because canvas Y is down
    ballRef.current.isLaunched = true;
    ballRef.current.trail = [];
  };

  const handleReset = () => {
    sounds.click();
    ballRef.current.x = 60;
    ballRef.current.y = 320;
    ballRef.current.vx = 0;
    ballRef.current.vy = 0;
    ballRef.current.isLaunched = false;
    ballRef.current.trail = [];
    setTelemetry({ x: 60, y: 320, vx: 0, vy: 0, speed: 0 });
  };

  // Main Canvas Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let lastTime = performance.now();

    const render = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05); // cap dt to avoid tunneling
      lastTime = time;

      const ball = ballRef.current;
      const groundY = canvas.height - 30;

      // Update physics if launched and not being dragged
      if (ball.isLaunched && !isDraggingRef.current) {
        // 1. Apply gravity to vertical velocity
        ball.vy += gravity * dt;

        // 2. Apply air damping
        ball.vx *= Math.pow(airFriction, dt * 60);
        ball.vy *= Math.pow(airFriction, dt * 60);

        // 3. Update position
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        // Add trail point
        if (
          ball.trail.length === 0 ||
          Math.hypot(
            ball.x - ball.trail[ball.trail.length - 1].x,
            ball.y - ball.trail[ball.trail.length - 1].y
          ) > 12
        ) {
          ball.trail.push({ x: ball.x, y: ball.y });
          if (ball.trail.length > 50) ball.trail.shift();
        }

        // 4. Ground Collision & Bounce
        if (ball.y + ball.radius >= groundY) {
          ball.y = groundY - ball.radius;
          ball.vy = -ball.vy * bounciness;
          ball.vx *= 0.95; // ground friction

          if (Math.abs(ball.vy) > 60) {
            sounds.playTone(180 + Math.abs(ball.vy) * 0.4, 'sine', 0.05, 0.15, 0.01);
          } else if (Math.abs(ball.vy) < 15) {
            ball.vy = 0; // stop jittering
          }
        }

        // Right Wall Bounce
        if (ball.x + ball.radius >= canvas.width) {
          ball.x = canvas.width - ball.radius;
          ball.vx = -ball.vx * bounciness;
          sounds.playTone(320, 'square', 0.05, 0.1, 0.01);
        }

        // Left Wall Bounce
        if (ball.x - ball.radius <= 0) {
          ball.x = ball.radius;
          ball.vx = -ball.vx * bounciness;
          sounds.playTone(320, 'square', 0.05, 0.1, 0.01);
        }
      }

      // Update telemetry state
      setTelemetry({
        x: Math.round(ball.x),
        y: Math.round(ball.y),
        vx: Math.round(ball.vx),
        vy: Math.round(ball.vy),
        speed: Math.round(Math.hypot(ball.vx, ball.vy))
      });

      // Clear Screen
      ctx.fillStyle = '#0b101a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Grid lines
      ctx.strokeStyle = '#182234';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Coordinate System Labels
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText('(0, 0) Sol-Üst', 8, 16);
      ctx.fillText('+X (Sağa Doğru Pozitif)', canvas.width - 150, 16);
      ctx.fillText('+Y (Aşağı Doğru Pozitif!)', 8, canvas.height - 38);

      // Draw Ground
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, groundY, canvas.width, 30);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();

      // Draw Trajectory Trail
      if (ball.trail.length > 1) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(ball.trail[0].x, ball.trail[0].y);
        for (let i = 1; i < ball.trail.length; i++) {
          ctx.lineTo(ball.trail[i].x, ball.trail[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Aiming Guide if not launched
      if (!ball.isLaunched) {
        const rad = (launchAngle * Math.PI) / 180;
        const guideLen = launchSpeed * 0.15;
        const targetX = ball.x + guideLen * Math.cos(rad);
        const targetY = ball.y - guideLen * Math.sin(rad);

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Angle arc
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 35, -rad, 0);
        ctx.stroke();
        ctx.fillStyle = '#f59e0b';
        ctx.font = '10px monospace';
        ctx.fillText(`${launchAngle}°`, ball.x + 42, ball.y - 10);
      }

      // Draw Vector Decomposition (Vx and Vy triangle)
      if (showDecomposition && Math.hypot(ball.vx, ball.vy) > 20) {
        const vScale = 0.12;
        const endX = ball.x + ball.vx * vScale;
        const endY = ball.y + ball.vy * vScale;

        // Horizontal component (Vx) - Cyan
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(endX, ball.y);
        ctx.stroke();

        // Vertical component (Vy) - Purple
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.7)';
        ctx.beginPath();
        ctx.moveTo(endX, ball.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      // Draw Ball
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Velocity Vector Arrow (Blue)
      if (Math.hypot(ball.vx, ball.vy) > 10) {
        const arrowScale = 0.12;
        const endX = ball.x + ball.vx * arrowScale;
        const endY = ball.y + ball.vy * arrowScale;

        ctx.strokeStyle = '#38bdf8';
        ctx.fillStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(endY - ball.y, endX - ball.x);
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - 8 * Math.cos(angle - Math.PI / 6),
          endY - 8 * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          endX - 8 * Math.cos(angle + Math.PI / 6),
          endY - 8 * Math.sin(angle + Math.PI / 6)
        );
        ctx.fill();
      }

      // Draw Gravity Vector Arrow (Orange, points straight down)
      if (gravity > 0 && ball.isLaunched) {
        const gLength = 35;
        const gX = ball.x;
        const gY = ball.y + ball.radius + 6;
        ctx.strokeStyle = '#f59e0b';
        ctx.fillStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gX, gY);
        ctx.lineTo(gX, gY + gLength);
        ctx.stroke();

        // Arrow head
        ctx.beginPath();
        ctx.moveTo(gX, gY + gLength);
        ctx.lineTo(gX - 4, gY + gLength - 6);
        ctx.lineTo(gX + 4, gY + gLength - 6);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gravity, bounciness, airFriction, launchAngle, launchSpeed, showDecomposition]);

  // Pos helper for mouse & touch
  const getCanvasPos = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  // Drag ball with mouse/touch
  const startDrag = (clientX, clientY) => {
    const { x, y } = getCanvasPos(clientX, clientY);
    const ball = ballRef.current;
    const dist = Math.hypot(x - ball.x, y - ball.y);
    if (dist <= ball.radius + 20) {
      isDraggingRef.current = true;
      ball.vx = 0;
      ball.vy = 0;
      ball.isLaunched = true;
      ball.trail = [];
    }
  };

  const moveDrag = (clientX, clientY) => {
    if (!isDraggingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasPos(clientX, clientY);
    const ball = ballRef.current;
    ball.x = Math.max(ball.radius, Math.min(canvas.width - ball.radius, x));
    ball.y = Math.max(ball.radius, Math.min(canvas.height - 30 - ball.radius, y));
  };

  const endDrag = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      sounds.jump();
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {/* Module Title & Explanation */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-sky-950/30 p-6 rounded-2xl border border-amber-800/40 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
            <MoveRight className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            2. Koordinat Sistemi, Vektörler ve Fizik
          </h2>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed max-w-4xl">
          Bilgisayar ekranlarında <strong>Y ekseni ters çalışır</strong>: Sol-Üst köşe (0,0)'dır. 
          Aşağı indikçe Y değeri <em>artar</em>! Yerçekimi bu yüzden Y hızına <span className="text-amber-400 font-mono">+pozitif</span> 
          ekleme yapar. Oyunlardaki tüm hareket üçleme ile gerçekleşir: 
          <strong> Konum (Position)</strong>, <strong>Hız (Velocity)</strong> ve <strong>İvme (Acceleration/Yerçekimi)</strong>.
        </p>
      </div>

      {/* Physics Canvas & Interactive Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Interactive Canvas */}
        <div className="lg:col-span-8 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-200">İnteraktif Fizik Alanı</span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">(Topu fareyle veya dokunarak tutup fırlatabilirsiniz)</span>
            </div>

            {/* Live Telemetry Pill */}
            <div className="flex items-center gap-3 text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-slate-400">P: ({telemetry.x}, {telemetry.y})</span>
              <span className="text-sky-400 font-bold">V: ({telemetry.vx}, {telemetry.vy})</span>
              <span className="text-amber-400 font-bold">Hız: {telemetry.speed} px/s</span>
            </div>
          </div>

          {/* Canvas */}
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#0b101a]">
            <canvas
              ref={canvasRef}
              width={700}
              height={360}
              onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
              onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
              onMouseUp={endDrag}
              onTouchStart={(e) => {
                if (e.touches.length > 0) {
                  startDrag(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchMove={(e) => {
                if (e.touches.length > 0) {
                  moveDrag(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchEnd={endDrag}
              className="w-full h-[360px] cursor-grab active:cursor-grabbing block touch-none"
            />

            {/* Legend / Key */}
            <div className="absolute bottom-10 left-3 bg-slate-950/90 backdrop-blur border border-slate-800 rounded-lg p-2.5 text-[11px] space-y-1 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-sky-400"></span>
                <span className="text-slate-300">Mavi Ok: <strong>Hız Vektörü (V)</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-amber-400"></span>
                <span className="text-slate-300">Sarı Ok: <strong>Yerçekimi İvmesi (g)</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-emerald-400"></span>
                <span className="text-slate-300">Yeşil Çizgi: <strong>Zemin Çarpışması</strong></span>
              </div>
            </div>
          </div>

          {/* Action Buttons & Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-3">
              <button
                onClick={handleLaunch}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Topu Fırlat</span>
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs border border-slate-700 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Sıfırla</span>
              </button>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                checked={showDecomposition}
                onChange={(e) => setShowDecomposition(e.target.checked)}
                className="w-4 h-4 accent-sky-400"
              />
              <span>Vektör Bileşenlerini Göster (Vx & Vy)</span>
            </label>
          </div>
        </div>

        {/* Right: Physics Sliders & Code */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Controls Panel */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs uppercase font-bold text-slate-200 tracking-wider">Fizik Parametreleri</h4>
            </div>

            {/* Gravity Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Yerçekimi (Gravity):</span>
                <span className="font-mono text-amber-400 font-bold">{gravity} px/s²</span>
              </div>
              <input
                type="range"
                min="0"
                max="1800"
                step="50"
                value={gravity}
                onChange={(e) => setGravity(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                <span>0 (Uzay)</span>
                <span>400 (Ay)</span>
                <span>800 (Dünya)</span>
                <span>1800 (Ağır)</span>
              </div>
            </div>

            {/* Launch Angle Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Fırlatma Açısı:</span>
                <span className="font-mono text-sky-400 font-bold">{launchAngle}°</span>
              </div>
              <input
                type="range"
                min="10"
                max="85"
                step="5"
                value={launchAngle}
                onChange={(e) => setLaunchAngle(Number(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            {/* Launch Speed Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Fırlatma Hızı:</span>
                <span className="font-mono text-emerald-400 font-bold">{launchSpeed} px/s</span>
              </div>
              <input
                type="range"
                min="200"
                max="900"
                step="50"
                value={launchSpeed}
                onChange={(e) => setLaunchSpeed(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            {/* Bounciness (Restitution) */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Esneklik / Sekme (Bounciness):</span>
                <span className="font-mono text-purple-400 font-bold">{bounciness}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.95"
                step="0.05"
                value={bounciness}
                onChange={(e) => setBounciness(Number(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                <span>0.1 (Çamur)</span>
                <span>0.7 (Basketbol)</span>
                <span>0.95 (Süper Top)</span>
              </div>
            </div>
          </div>

          {/* Math Snippet */}
          <CodeSnippetViewer
            title="Her Karede Çalışan Fizik Matematiği"
            language="javascript"
            code={`// 1. Açıdan X ve Y Hızlarını Çıkarma (Trigonometri):
const rad = (aci * Math.PI) / 180;
velocity.x = hiz * Math.cos(rad);
velocity.y = -hiz * Math.sin(rad); // Ters Y !

// 2. Yerçekimi dikey hıza ivme katar:
velocity.y += gravity * dt;

// 3. Hız, konumu değiştirir:
position.x += velocity.x * dt;
position.y += velocity.y * dt;

// 4. Zemine çarparsa ters yöne seker:
if (position.y >= zeminY) {
  position.y = zeminY;
  velocity.y = -velocity.y * bounciness;
}`}
            note="Eğer bounciness 0.8 ise, top her yere çarptığında kinetik enerjisinin %20'sini kaybeder."
          />
        </div>
      </div>
    </div>
  );
}
