import React, { useState, useEffect, useRef } from 'react';
import { Video, Sliders, ArrowLeft, ArrowRight, Vibrate, Eye, Layers } from 'lucide-react';
import CodeSnippetViewer from '../components/CodeSnippetViewer';
import { sounds } from '../utils/sound';

export default function CameraModule() {
  const canvasRef = useRef(null);

  // Camera Settings
  const [lerpSpeed, setLerpSpeed] = useState(4.5); // smoothing factor
  const [enableDeadzone, setEnableDeadzone] = useState(true);
  const [enableParallax, setEnableParallax] = useState(true);
  const [trauma, setTrauma] = useState(0); // for screen shake

  // Mutable Game State
  const stateRef = useRef({
    player: { x: 300, y: 240, vx: 0 },
    camera: { x: 300, y: 0 },
    keys: {},
    trauma: 0
  });

  const triggerShake = () => {
    sounds.hit();
    stateRef.current.trauma = 18;
    setTrauma(18);
  };

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) stateRef.current.keys['left'] = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) stateRef.current.keys['right'] = true;
    };
    const onKeyUp = (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) stateRef.current.keys['left'] = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) stateRef.current.keys['right'] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Main Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let lastTime = performance.now();

    const render = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const state = stateRef.current;
      const p = state.player;
      const cam = state.camera;

      // 1. Move Player
      let moveDir = 0;
      if (state.keys['right']) moveDir += 1;
      if (state.keys['left']) moveDir -= 1;

      p.vx = moveDir * 280;
      p.x += p.vx * dt;
      p.x = Math.max(50, Math.min(2000, p.x)); // world boundaries (0 to 2000px)

      // 2. Camera Lerp & Deadzone Logic
      let targetCamX = p.x;
      const deadzoneWidth = 140;

      if (enableDeadzone) {
        if (p.x > cam.x + deadzoneWidth / 2) {
          targetCamX = p.x - deadzoneWidth / 2;
        } else if (p.x < cam.x - deadzoneWidth / 2) {
          targetCamX = p.x + deadzoneWidth / 2;
        } else {
          targetCamX = cam.x; // Stay inside deadzone
        }
      }

      // Smooth Linear Interpolation (Lerp)
      cam.x += (targetCamX - cam.x) * lerpSpeed * dt;

      // 3. Screen Shake Trauma Decay
      let shakeX = 0;
      let shakeY = 0;
      if (state.trauma > 0) {
        shakeX = (Math.random() - 0.5) * state.trauma * 2;
        shakeY = (Math.random() - 0.5) * state.trauma * 2;
        state.trauma = Math.max(0, state.trauma - dt * 25);
      }

      // ==========================================
      // RENDERING (CAMERA VIEWPORT)
      // ==========================================
      ctx.save();
      ctx.fillStyle = '#0a0e17';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Camera Transform matrix with shake
      const viewportCenterX = canvas.width / 2;
      ctx.translate(viewportCenterX - cam.x + shakeX, shakeY);

      // 1. Distant Background Mountains (Parallax Factor: 0.15x)
      const mountainParallax = enableParallax ? 0.15 : 1.0;
      ctx.fillStyle = '#1e1b4b';
      for (let i = 0; i < 8; i++) {
        const mx = i * 350 + (cam.x * (1 - mountainParallax));
        ctx.beginPath();
        ctx.moveTo(mx - 150, 320);
        ctx.lineTo(mx, 120);
        ctx.lineTo(mx + 150, 320);
        ctx.fill();
      }

      // 2. Midground Hills (Parallax Factor: 0.5x)
      const hillParallax = enableParallax ? 0.5 : 1.0;
      ctx.fillStyle = '#1e293b';
      for (let i = 0; i < 14; i++) {
        const hx = i * 200 + (cam.x * (1 - hillParallax));
        ctx.beginPath();
        ctx.arc(hx, 320, 110, Math.PI, 0);
        ctx.fill();
      }

      // 3. World Ground & Blocks (Foreground: 1.0x)
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 270, 2100, 70);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(0, 270, 2100, 4);

      // World Props (Houses, Pillars across the 2000px world)
      for (let x = 100; x < 2000; x += 300) {
        ctx.fillStyle = '#475569';
        ctx.fillRect(x, 210, 40, 60);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(x + 12, 225, 16, 16); // glowing window
      }

      // 4. Draw Player
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(p.x - 12, p.y, 24, 30);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(p.x - (p.vx >= 0 ? 0 : 8), p.y + 6, 6, 6);

      // 5. Draw Deadzone Visualizer overlay in world
      if (enableDeadzone) {
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(cam.x - deadzoneWidth / 2, 80, deadzoneWidth, 200);
        ctx.setLineDash([]);
      }

      ctx.restore();

      // UI HUD (Viewport Overlay)
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText(`Kamera X: ${Math.round(cam.x)} | Oyuncu X: ${Math.round(p.x)}`, 10, 20);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [lerpSpeed, enableDeadzone, enableParallax]);

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-950/40 via-slate-900 to-sky-950/30 p-6 rounded-2xl border border-teal-800/40 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg">
            <Video className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Kamera Matematiği, Lerp & Parallaks (Parallax Scrolling)
          </h2>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed max-w-4xl">
          Geniş haritalı oyunlarda harita hareket etmez; <strong>Kamera</strong> oyuncunun peşinden gider! 
          Kamerayı oyuncuya küt diye bağlarsanız görüntü titrek ve rahatsız edici olur. 
          Oyun motorları yumuşak takip için <strong>Lerp (Doğrusal Enterpolasyon)</strong>, 
          gereksiz kaymaları önlemek için <strong>Ölü Alan (Deadzone)</strong> ve 
          3D derinlik hissi için <strong>Parallaks Katmanları</strong> kullanır.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Canvas Area */}
        <div className="lg:col-span-8 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-300 tracking-wider">
              Kamera Görüş Alanı (Viewport)
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Dünya Genişliği: 2000px
            </span>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#0a0e17]">
            <canvas
              ref={canvasRef}
              width={640}
              height={340}
              className="w-full h-[340px] block"
            />
          </div>

          {/* Interactive Player controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400">
              Yürümek İçin <strong>A / D</strong> tuşlarını veya butonları basılı tutun:
            </span>
            <div className="flex items-center gap-2">
              <button
                onMouseDown={() => { stateRef.current.keys['left'] = true; }}
                onMouseUp={() => { stateRef.current.keys['left'] = false; }}
                onTouchStart={() => { stateRef.current.keys['left'] = true; }}
                onTouchEnd={() => { stateRef.current.keys['left'] = false; }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:bg-teal-600 rounded-lg text-slate-200 text-xs font-bold transition flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Sola Koş
              </button>
              <button
                onMouseDown={() => { stateRef.current.keys['right'] = true; }}
                onMouseUp={() => { stateRef.current.keys['right'] = false; }}
                onTouchStart={() => { stateRef.current.keys['right'] = true; }}
                onTouchEnd={() => { stateRef.current.keys['right'] = false; }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:bg-teal-600 rounded-lg text-slate-200 text-xs font-bold transition flex items-center gap-1"
              >
                Sağa Koş <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Controls & Math */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-400" />
                <h4 className="text-xs uppercase font-bold text-slate-200 tracking-wider">
                  Kamera Parametreleri
                </h4>
              </div>
            </div>

            {/* Lerp Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Yumuşak Takip (Lerp Hızı):</span>
                <span className="font-mono text-teal-400 font-bold">{lerpSpeed}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="15.0"
                step="0.5"
                value={lerpSpeed}
                onChange={(e) => setLerpSpeed(Number(e.target.value))}
                className="w-full accent-teal-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                <span>1 (Tembel Takip)</span>
                <span>5 (İdeal Sinematik)</span>
                <span>15 (Sert/Robotik)</span>
              </div>
            </div>

            {/* Deadzone Toggle */}
            <label className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer text-xs">
              <div>
                <span className="font-bold text-slate-200 block">Ölü Alan (Deadzone)</span>
                <span className="text-[10px] text-slate-400">Kırmızı kutu içinde kamera kıpırdamaz</span>
              </div>
              <input
                type="checkbox"
                checked={enableDeadzone}
                onChange={(e) => setEnableDeadzone(e.target.checked)}
                className="w-4 h-4 accent-teal-400"
              />
            </label>

            {/* Parallax Toggle */}
            <label className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer text-xs">
              <div>
                <span className="font-bold text-slate-200 block">Parallaks Katmanları</span>
                <span className="text-[10px] text-slate-400">Uzak dağlar daha yavaş kayar</span>
              </div>
              <input
                type="checkbox"
                checked={enableParallax}
                onChange={(e) => setEnableParallax(e.target.checked)}
                className="w-4 h-4 accent-teal-400"
              />
            </label>

            {/* Screen Shake Button */}
            <button
              onClick={triggerShake}
              className="w-full p-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition"
            >
              <Vibrate className="w-4 h-4" />
              <span>📳 Ekranı Sars (Screen Shake / Vuruş Hissi)</span>
            </button>
          </div>

          <CodeSnippetViewer
            title="Kamera Takip ve Deprem Kodu"
            language="javascript"
            code={`// 1. Lerp (Doğrusal Enterpolasyon) Yumuşatması:
camera.x += (target.x - camera.x) * lerpHizi * dt;

// 2. Ekran Sarsıntısı (Screen Shake / Trauma):
if (trauma > 0) {
  camera.x += (Math.random() - 0.5) * trauma;
  camera.y += (Math.random() - 0.5) * trauma;
  trauma = Math.max(0, trauma - sönüm * dt);
}

// 3. Parallaks Arka Planı:
daglar.x = camera.x * 0.15; // Çok yavaş kayar
agaclar.x = camera.x * 0.50; // Orta hızda kayar`}
            note="Unity'de Cinemachine, Godot'ta Camera2D düğümü bu formülleri arka planda çalıştırır."
          />
        </div>
      </div>
    </div>
  );
}
