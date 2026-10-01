import React, { useState, useEffect, useRef } from 'react';
import { Boxes, Check, X, ShieldAlert, Sparkles, Coins, Zap, HelpCircle, Activity } from 'lucide-react';
import CodeSnippetViewer from '../components/CodeSnippetViewer';
import { sounds } from '../utils/sound';

export default function CollisionModule() {
  const canvasRef = useRef(null);
  const [colMode, setColMode] = useState('aabb'); // 'aabb', 'circle', 'tunneling'
  const [isTriggerMode, setIsTriggerMode] = useState(false);
  const [coinsCollected, setCoinsCollected] = useState(0);

  // Box A (Draggable Player)
  const [boxA, setBoxA] = useState({ x: 80, y: 120, w: 80, h: 80 });
  // Box B (Static Target)
  const [boxB, setBoxB] = useState({ x: 320, y: 110, w: 100, h: 100 });

  // Circle A & B
  const [circleA, setCircleA] = useState({ x: 120, y: 160, r: 45 });
  const [circleB, setCircleB] = useState({ x: 370, y: 160, r: 55 });

  // Tunneling Simulation State
  const [bulletSpeed, setBulletSpeed] = useState(1200); // px/s
  const [useCCD, setUseCCD] = useState(false); // Continuous Collision Detection
  const [tunnelingStatus, setTunnelingStatus] = useState('Hazır');
  const bulletRef = useRef({ x: 40, y: 160, prevX: 40, active: false, speed: 1200 });

  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const prevCollidingRef = useRef(false);

  // AABB Collision Condition Calculations
  const c1 = boxA.x < boxB.x + boxB.w;
  const c2 = boxA.x + boxA.w > boxB.x;
  const c3 = boxA.y < boxB.y + boxB.h;
  const c4 = boxA.y + boxA.h > boxB.y;
  const isAABBColliding = c1 && c2 && c3 && c4;

  // Circle Collision Calculation
  const dx = circleA.x - circleB.x;
  const dy = circleA.y - circleB.y;
  const distance = Math.hypot(dx, dy);
  const radiiSum = circleA.r + circleB.r;
  const isCircleColliding = distance <= radiiSum;

  const isCurrentlyColliding = colMode === 'aabb' ? isAABBColliding : isCircleColliding;

  // Sound triggers on collision state change
  useEffect(() => {
    if (colMode !== 'tunneling' && isCurrentlyColliding && !prevCollidingRef.current) {
      if (isTriggerMode) {
        sounds.coin();
        setCoinsCollected(c => c + 1);
      } else {
        sounds.hit();
      }
    }
    prevCollidingRef.current = isCurrentlyColliding;
  }, [isCurrentlyColliding, isTriggerMode, colMode]);

  // Fire bullet for Tunneling demo
  const fireBullet = () => {
    sounds.laser();
    bulletRef.current = {
      x: 30,
      y: 160,
      prevX: 30,
      active: true,
      speed: bulletSpeed
    };
    setTunnelingStatus('Mermi fırlatıldı...');
  };

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let lastTime = performance.now();

    const render = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      // Background
      ctx.fillStyle = '#0b101a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = '#182234';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      if (colMode === 'aabb') {
        // Draw Box B (Target / Obstacle)
        ctx.fillStyle = isCurrentlyColliding ? 'rgba(244, 63, 94, 0.25)' : 'rgba(30, 41, 59, 0.7)';
        ctx.fillRect(boxB.x, boxB.y, boxB.w, boxB.h);
        ctx.strokeStyle = isCurrentlyColliding ? '#f43f5e' : '#64748b';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxB.x, boxB.y, boxB.w, boxB.h);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px monospace';
        ctx.fillText(isTriggerMode ? '🪙 [Tetikleyici / Coin]' : '🧱 [Kutu B / Engel]', boxB.x + 8, boxB.y - 8);

        // Draw Box A (Player)
        ctx.fillStyle = isCurrentlyColliding ? 'rgba(56, 189, 248, 0.35)' : 'rgba(56, 189, 248, 0.2)';
        ctx.fillRect(boxA.x, boxA.y, boxA.w, boxA.h);
        ctx.strokeStyle = isCurrentlyColliding ? '#f43f5e' : '#38bdf8';
        ctx.lineWidth = 3;
        ctx.strokeRect(boxA.x, boxA.y, boxA.w, boxA.h);

        ctx.fillStyle = '#38bdf8';
        ctx.fillText('🤖 [Kutu A / Oyuncu]', boxA.x, boxA.y - 8);

        // Highlight Overlap
        if (isCurrentlyColliding) {
          const overlapX = Math.max(boxA.x, boxB.x);
          const overlapY = Math.max(boxA.y, boxB.y);
          const overlapW = Math.min(boxA.x + boxA.w, boxB.x + boxB.w) - overlapX;
          const overlapH = Math.min(boxA.y + boxA.h, boxB.y + boxB.h) - overlapY;
          if (overlapW > 0 && overlapH > 0) {
            ctx.fillStyle = 'rgba(244, 63, 94, 0.6)';
            ctx.fillRect(overlapX, overlapY, overlapW, overlapH);
          }
        }
      } else if (colMode === 'circle') {
        // Circle Mode
        ctx.fillStyle = isCurrentlyColliding ? 'rgba(244, 63, 94, 0.25)' : 'rgba(30, 41, 59, 0.7)';
        ctx.beginPath();
        ctx.arc(circleB.x, circleB.y, circleB.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isCurrentlyColliding ? '#f43f5e' : '#64748b';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px monospace';
        ctx.fillText('🎯 [Daire B / r=' + circleB.r + ']', circleB.x - 40, circleB.y - circleB.r - 8);

        // Center line
        ctx.strokeStyle = isCurrentlyColliding ? '#f43f5e' : '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(circleA.x, circleA.y);
        ctx.lineTo(circleB.x, circleB.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Circle A
        ctx.fillStyle = isCurrentlyColliding ? 'rgba(56, 189, 248, 0.35)' : 'rgba(56, 189, 248, 0.2)';
        ctx.beginPath();
        ctx.arc(circleA.x, circleA.y, circleA.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isCurrentlyColliding ? '#f43f5e' : '#38bdf8';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.fillText('🤖 [Daire A / r=' + circleA.r + ']', circleA.x - 40, circleA.y - circleA.r - 8);
      } else {
        // ===================================
        // TUNNELING / CCD DEMO MODE
        // ===================================
        const wallX = 300;
        const wallW = 14; // Thin wall!
        const wallH = 200;
        const wallY = 60;

        // Draw Thin Wall
        ctx.fillStyle = '#475569';
        ctx.fillRect(wallX, wallY, wallW, wallH);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.strokeRect(wallX, wallY, wallW, wallH);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '11px monospace';
        ctx.fillText(`İnce Duvar (${wallW}px)`, wallX - 25, wallY - 10);

        const b = bulletRef.current;
        if (b.active) {
          b.prevX = b.x;
          b.x += b.speed * dt;

          if (!useCCD) {
            // DISCRETE (FAULTY) CHECK: only check current frame point
            if (b.x >= wallX && b.x <= wallX + wallW) {
              sounds.hit();
              b.active = false;
              setTunnelingStatus('💥 ÇARPIŞTI! (Duvara denk geldi)');
            } else if (b.x > canvas.width) {
              sounds.attack();
              b.active = false;
              setTunnelingStatus('👻 TÜNELLEME HATASI: Mermi duvarı atlayıp içinden geçti!');
            }
          } else {
            // CONTINUOUS (CCD / RAYCAST) CHECK: line between prevX and x
            if (b.prevX < wallX && b.x >= wallX) {
              sounds.hit();
              b.x = wallX;
              b.active = false;
              setTunnelingStatus('🛡️ CCD / RAYCAST BAŞARILI: İki kare arasındaki ışın duvarı yakaladı!');
            } else if (b.x > canvas.width) {
              b.active = false;
            }
          }
        }

        // Draw Bullet & Path
        if (useCCD && b.prevX !== b.x) {
          // Draw Raycast line
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(b.prevX, b.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.fillStyle = useCCD ? '#10b981' : '#f43f5e';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = '10px monospace';
        ctx.fillText('Mermi', b.x - 14, b.y - 12);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [boxA, boxB, circleA, circleB, colMode, isCurrentlyColliding, isTriggerMode, useCCD]);

  // Coordinate helper for mouse/touch
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

  // Drag handlers
  const startDrag = (clientX, clientY) => {
    const { x, y } = getCanvasPos(clientX, clientY);

    if (colMode === 'aabb') {
      if (x >= boxA.x && x <= boxA.x + boxA.w && y >= boxA.y && y <= boxA.y + boxA.h) {
        isDraggingRef.current = true;
        dragOffsetRef.current = { x: x - boxA.x, y: y - boxA.y };
      }
    } else if (colMode === 'circle') {
      const dist = Math.hypot(x - circleA.x, y - circleA.y);
      if (dist <= circleA.r + 10) {
        isDraggingRef.current = true;
        dragOffsetRef.current = { x: x - circleA.x, y: y - circleA.y };
      }
    }
  };

  const moveDrag = (clientX, clientY) => {
    if (!isDraggingRef.current) return;
    const { x, y } = getCanvasPos(clientX, clientY);

    if (colMode === 'aabb') {
      setBoxA(prev => ({
        ...prev,
        x: Math.round(x - dragOffsetRef.current.x),
        y: Math.round(y - dragOffsetRef.current.y)
      }));
    } else if (colMode === 'circle') {
      setCircleA(prev => ({
        ...prev,
        x: Math.round(x - dragOffsetRef.current.x),
        y: Math.round(y - dragOffsetRef.current.y)
      }));
    }
  };

  const endDrag = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/30 p-6 rounded-2xl border border-rose-800/40 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg">
            <Boxes className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            3. Çarpışma Algılama (Hitbox & Collision Detection)
          </h2>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed max-w-4xl">
          Oyunlarda nesnelerin birbirinin içinden hayalet gibi geçmemesi için her karede 
          <strong> Çarpışma Algılama (Collision Detection)</strong> çalışır. 
          En yaygın iki yöntem: <strong>AABB (Kutu Çarpışması)</strong> ve <strong>Daire Çarpışması</strong>'dır. 
          Ayrıca yüksek hızda duvarın içinden geçme hatasını (Tunneling) <strong>Raycast / CCD</strong> ile nasıl çözdüğümüzü test edin!
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Canvas & Status */}
        <div className="lg:col-span-7 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          
          {/* Controls bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sounds.click();
                  setColMode('aabb');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  colMode === 'aabb' 
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' 
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                AABB (Kutu-Kutu)
              </button>
              <button
                onClick={() => {
                  sounds.click();
                  setColMode('circle');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  colMode === 'circle' 
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' 
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Daire-Daire
              </button>
              <button
                onClick={() => {
                  sounds.click();
                  setColMode('tunneling');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  colMode === 'tunneling' 
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30' 
                    : 'bg-slate-800 text-amber-400 hover:text-amber-300'
                }`}
              >
                ⚡ Tünelleme (CCD Lab)
              </button>
            </div>

            {colMode !== 'tunneling' && (
              <button
                onClick={() => {
                  sounds.click();
                  setIsTriggerMode(!isTriggerMode);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  isTriggerMode 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>{isTriggerMode ? 'Tetikleyici (Trigger/Coin)' : 'Katı Engel (Solid Collider)'}</span>
              </button>
            )}
          </div>

          {/* Interactive Canvas */}
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#0b101a]">
            <canvas
              ref={canvasRef}
              width={540}
              height={320}
              onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
              onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
              onMouseUp={endDrag}
              onTouchStart={(e) => {
                if (e.touches.length > 0) startDrag(e.touches[0].clientX, e.touches[0].clientY);
              }}
              onTouchMove={(e) => {
                if (e.touches.length > 0) moveDrag(e.touches[0].clientX, e.touches[0].clientY);
              }}
              onTouchEnd={endDrag}
              className="w-full h-[320px] cursor-grab active:cursor-grabbing block touch-none"
            />

            {/* Collision Status Badge */}
            {colMode !== 'tunneling' ? (
              <div className="absolute top-3 right-3">
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg ${
                  isCurrentlyColliding 
                    ? 'bg-rose-500 text-white shadow-rose-500/40 animate-pulse' 
                    : 'bg-slate-800/90 text-slate-400 border border-slate-700'
                }`}>
                  {isCurrentlyColliding ? (
                    <>
                      <ShieldAlert className="w-4 h-4" />
                      <span>💥 ÇARPIŞMA VAR!</span>
                    </>
                  ) : (
                    <span>TEMAS YOK</span>
                  )}
                </span>
              </div>
            ) : (
              <div className="absolute top-3 right-3">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-950/90 text-amber-400 border border-amber-500/30">
                  {tunnelingStatus}
                </span>
              </div>
            )}

            {isTriggerMode && colMode !== 'tunneling' && (
              <div className="absolute bottom-3 left-3 bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800 text-xs text-amber-400 font-mono flex items-center gap-1.5">
                <Coins className="w-4 h-4" />
                <span>Toplanan: {coinsCollected}</span>
              </div>
            )}
          </div>

          {colMode === 'tunneling' && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={fireBullet}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-lg text-xs shadow-md shadow-amber-500/20"
                >
                  🚀 Mermiyi Ateşle
                </button>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCCD}
                    onChange={(e) => setUseCCD(e.target.checked)}
                    className="w-4 h-4 accent-emerald-400"
                  />
                  <span>Sürekli Çarpışma (Raycast CCD) Aktif</span>
                </label>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>Hız: {bulletSpeed} px/s</span>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400">
            💡 {colMode === 'tunneling' 
              ? 'CCD kapalıyken yüksek hızlı mermi ince duvarı bir karede atlar ve tünelleme hatası oluşur. CCD açıldığında iki kare arasındaki mesafe ışınla taranarak yakalanır!'
              : 'Mavi oyuncu şeklini farenizle veya parmağınızla tutup sürükleyerek engelle çarpıştırın.'}
          </p>
        </div>

        {/* Live Math Conditions Checklist */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs uppercase font-bold text-slate-200 tracking-wider">
                {colMode === 'aabb' ? 'AABB Formül Denetimi' : colMode === 'circle' ? 'Daire Formül Denetimi' : 'Tünelleme Analizi'}
              </h4>
              <span className="text-[11px] font-mono text-slate-400">
                {colMode === 'aabb' ? "4 Koşulun 4'ü de Doğru Olmalı" : colMode === 'circle' ? 'Pisagor Mesafesi' : 'Raycast vs Ayrık'}
              </span>
            </div>

            {colMode === 'aabb' ? (
              <div className="space-y-2.5">
                <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                  c1 ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' : 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                }`}>
                  <div className="space-y-0.5">
                    <span className="font-mono font-bold block">1. A.sol &lt; B.sağ</span>
                    <span className="text-[10px] text-slate-400">{boxA.x} &lt; {boxB.x + boxB.w}</span>
                  </div>
                  {c1 ? <Check className="w-5 h-5 text-emerald-400" /> : <X className="w-5 h-5 text-rose-500" />}
                </div>

                <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                  c2 ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' : 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                }`}>
                  <div className="space-y-0.5">
                    <span className="font-mono font-bold block">2. A.sağ &gt; B.sol</span>
                    <span className="text-[10px] text-slate-400">{boxA.x + boxA.w} &gt; {boxB.x}</span>
                  </div>
                  {c2 ? <Check className="w-5 h-5 text-emerald-400" /> : <X className="w-5 h-5 text-rose-500" />}
                </div>

                <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                  c3 ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' : 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                }`}>
                  <div className="space-y-0.5">
                    <span className="font-mono font-bold block">3. A.üst &lt; B.alt</span>
                    <span className="text-[10px] text-slate-400">{boxA.y} &lt; {boxB.y + boxB.h}</span>
                  </div>
                  {c3 ? <Check className="w-5 h-5 text-emerald-400" /> : <X className="w-5 h-5 text-rose-500" />}
                </div>

                <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                  c4 ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' : 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                }`}>
                  <div className="space-y-0.5">
                    <span className="font-mono font-bold block">4. A.alt &gt; B.üst</span>
                    <span className="text-[10px] text-slate-400">{boxA.y + boxA.h} &gt; {boxB.y}</span>
                  </div>
                  {c4 ? <Check className="w-5 h-5 text-emerald-400" /> : <X className="w-5 h-5 text-rose-500" />}
                </div>
              </div>
            ) : colMode === 'circle' ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Merkezler Arası Mesafe:</span>
                    <span className="font-mono text-white font-bold">{Math.round(distance)} px</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Yarıçaplar Toplamı (r1 + r2):</span>
                    <span className="font-mono text-amber-400 font-bold">{radiiSum} px</span>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  isCircleColliding ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' : 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                }`}>
                  <div>
                    <span className="font-mono font-bold block">Mesafe &le; (r1 + r2)</span>
                    <span className="text-[11px] text-slate-400">{Math.round(distance)} &le; {radiiSum}</span>
                  </div>
                  {isCircleColliding ? <Check className="w-6 h-6 text-emerald-400" /> : <X className="w-6 h-6 text-rose-500" />}
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 space-y-1">
                  <strong className="text-white block">Neden Tünelleme Olur?</strong>
                  <p className="text-[11px] text-slate-400">
                    Kare 1'de mermi duvarın solundadır (x=280). Kare 2'de mermi duvarın sağına geçmiştir (x=330).
                    Duvar ise x=300'dedir. Bilgisayar sadece kare sonlarındaki konuma baktığı için duvarın içinden geçtiğini hiç fark etmez!
                  </p>
                </div>
                <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-emerald-200 text-xs">
                  <strong className="block mb-0.5">💡 Çözüm: Raycasting (Işın Süpürme)</strong>
                  <span>İki kare arasında çizgi (Ray) çekilir ve yolda kesişen ilk engel vurulmuş sayılır.</span>
                </div>
              </div>
            )}
          </div>

          <CodeSnippetViewer
            title="AABB Çarpışma Fonksiyonu"
            language="javascript"
            code={`function checkCollision(A, B) {
  return (
    A.x < B.x + B.w && // A'nın solu B'nin sağından küçük
    A.x + A.w > B.x && // A'nın sağı B'nin solundan büyük
    A.y < B.y + B.h && // A'nın üstü B'nin altından küçük
    A.y + A.h > B.y    // A'nın altı B'nin üstünden büyük
  );
}`}
          />
        </div>
      </div>
    </div>
  );
}
