import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Flame, Snowflake, Zap, Sliders, RotateCcw, Play, Pause } from 'lucide-react';
import CodeSnippetViewer from '../components/CodeSnippetViewer';
import { sounds } from '../utils/sound';

export default function ParticleSystemModule() {
  const canvasRef = useRef(null);

  // Emitter parameters
  const [preset, setPreset] = useState('fire');
  const [particleCount, setParticleCount] = useState(120);
  const [gravity, setGravity] = useState(-150); // Negative = floats up like fire
  const [speed, setSpeed] = useState(140);
  const [lifetime, setLifetime] = useState(1.2);
  const [spread, setSpread] = useState(360); // degrees
  const [continuous, setContinuous] = useState(true);
  const [activeCount, setActiveCount] = useState(0);

  const particlesRef = useRef([]);
  const emitterPosRef = useRef({ x: 300, y: 220 });

  // Preset Configurations
  const applyPreset = (type) => {
    sounds.click();
    setPreset(type);
    particlesRef.current = [];

    if (type === 'fire') {
      setGravity(-180);
      setSpeed(120);
      setLifetime(0.9);
      setSpread(60);
      setContinuous(true);
    } else if (type === 'explosion') {
      setGravity(300);
      setSpeed(350);
      setLifetime(0.8);
      setSpread(360);
      setContinuous(false);
      triggerBurst(300, 180, 150);
    } else if (type === 'snow') {
      setGravity(40);
      setSpeed(30);
      setLifetime(4.0);
      setSpread(45);
      setContinuous(true);
    } else if (type === 'magic') {
      setGravity(-40);
      setSpeed(160);
      setLifetime(1.5);
      setSpread(360);
      setContinuous(true);
    }
  };

  // Spawn particle
  const spawnParticle = (originX, originY) => {
    const baseAngle = preset === 'fire' ? -Math.PI / 2 : preset === 'snow' ? Math.PI / 2 : Math.random() * Math.PI * 2;
    const spreadRad = ((spread * Math.PI) / 180) * (Math.random() - 0.5);
    const angle = baseAngle + spreadRad;
    const spd = speed * (0.6 + Math.random() * 0.8);

    let colors = ['#f59e0b', '#ef4444', '#f97316'];
    if (preset === 'snow') colors = ['#e2e8f0', '#93c5fd', '#ffffff'];
    if (preset === 'magic') colors = ['#a855f7', '#ec4899', '#38bdf8'];
    if (preset === 'explosion') colors = ['#fbbf24', '#f97316', '#ef4444', '#ffffff'];

    const chosenColor = colors[Math.floor(Math.random() * colors.length)];

    return {
      x: originX,
      y: originY,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: lifetime * (0.7 + Math.random() * 0.6),
      maxLife: lifetime,
      size: Math.random() * 5 + 3,
      color: chosenColor
    };
  };

  const triggerBurst = (x, y, count = 50) => {
    sounds.explosion();
    for (let i = 0; i < count; i++) {
      particlesRef.current.push(spawnParticle(x, y));
    }
  };

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let lastTime = performance.now();
    let emitTimer = 0;

    const render = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      // Continuous emission
      if (continuous) {
        emitTimer += dt;
        const rate = 1 / (particleCount * 0.8);
        while (emitTimer >= rate) {
          emitTimer -= rate;
          const posX = preset === 'snow' ? Math.random() * canvas.width : emitterPosRef.current.x;
          const posY = preset === 'snow' ? -10 : emitterPosRef.current.y;
          particlesRef.current.push(spawnParticle(posX, posY));
        }
      }

      // Update & Filter Particles
      const nextParticles = [];
      for (const p of particlesRef.current) {
        p.life -= dt;
        if (p.life > 0) {
          // Physics
          p.vy += gravity * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          nextParticles.push(p);
        }
      }
      particlesRef.current = nextParticles;
      setActiveCount(nextParticles.length);

      // Render
      ctx.fillStyle = '#080b12';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Additive blend mode for luminous particles
      ctx.globalCompositeOperation = 'lighter';

      for (const p of particlesRef.current) {
        const progress = p.life / p.maxLife; // 1 down to 0
        const currentSize = p.size * progress;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, progress);

        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      // Draw Emitter Source Icon
      if (preset !== 'snow') {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(emitterPosRef.current.x, emitterPosRef.current.y, 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [continuous, gravity, speed, lifetime, spread, particleCount, preset]);

  // Click on canvas to burst
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    emitterPosRef.current = { x, y };
    triggerBurst(x, y, 60);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-950/40 via-slate-900 to-amber-950/30 p-6 rounded-2xl border border-orange-800/40 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-orange-500/20 text-orange-400 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Parçacık Sistemleri (Particle Systems & VFX)
          </h2>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed max-w-4xl">
          Patlamalar, mermi kıvılcımları, ateş, duman, büyü haresi ve kar yağışı gibi görsel efektler 
          yüzlerce küçük <strong>Parçacık (Particle)</strong> ile üretilir. Her parçacık kendi 
          <em> konumuna, hızına, ömrüne (lifetime) ve şeffaflık değişimine (alpha fade)</em> sahiptir. 
          Aşağıdaki ekranda istediğiniz yere tıklayarak patlama yaratabilir veya parametrelerle oynayabilirsiniz!
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Canvas */}
        <div className="lg:col-span-8 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-200">Parçacık Sahnesi</span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">(Ekrana tıklayarak patlama tetikleyin)</span>
            </div>

            <span className="text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-orange-400">
              Aktif Parçacık: {activeCount}
            </span>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#080b12]">
            <canvas
              ref={canvasRef}
              width={640}
              height={360}
              onClick={handleCanvasClick}
              className="w-full h-[360px] cursor-crosshair block"
            />
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-slate-400 mr-2">Hazır Efektler:</span>
            <button
              onClick={() => applyPreset('fire')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                preset === 'fire' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>🔥 Ateş</span>
            </button>
            <button
              onClick={() => applyPreset('explosion')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                preset === 'explosion' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>💥 Patlama</span>
            </button>
            <button
              onClick={() => applyPreset('magic')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                preset === 'magic' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>✨ Büyü Haresi</span>
            </button>
            <button
              onClick={() => applyPreset('snow')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                preset === 'snow' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Snowflake className="w-3.5 h-3.5" />
              <span>❄️ Kar Yağışı</span>
            </button>
          </div>
        </div>

        {/* Sliders & Math */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-orange-400" />
                <h4 className="text-xs uppercase font-bold text-slate-200 tracking-wider">
                  Yayıcı (Emitter) Ayarları
                </h4>
              </div>
            </div>

            {/* Gravity */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Yerçekimi (Aşağı + / Yukarı -):</span>
                <span className="font-mono text-orange-400 font-bold">{gravity}</span>
              </div>
              <input
                type="range"
                min="-400"
                max="500"
                step="25"
                value={gravity}
                onChange={(e) => setGravity(Number(e.target.value))}
                className="w-full accent-orange-400 cursor-pointer"
              />
            </div>

            {/* Speed */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Başlangıç Hızı:</span>
                <span className="font-mono text-sky-400 font-bold">{speed} px/s</span>
              </div>
              <input
                type="range"
                min="20"
                max="500"
                step="20"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            {/* Lifetime */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Yaşam Süresi (Ömür):</span>
                <span className="font-mono text-emerald-400 font-bold">{lifetime} sn</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="4.0"
                step="0.1"
                value={lifetime}
                onChange={(e) => setLifetime(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            {/* Spread */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Yayılma Açısı (Spread):</span>
                <span className="font-mono text-purple-400 font-bold">{spread}°</span>
              </div>
              <input
                type="range"
                min="10"
                max="360"
                step="10"
                value={spread}
                onChange={(e) => setSpread(Number(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer"
              />
            </div>
          </div>

          <CodeSnippetViewer
            title="Parçacık Güncelleme Döngüsü"
            language="javascript"
            code={`// Her karede çalışan parçacık döngüsü:
particles.forEach((p, index) => {
  p.life -= dt; // Ömür azalt
  if (p.life <= 0) {
    particles.splice(index, 1); // Öleni sil
    return;
  }

  // Fizik ve hareket
  p.vy += gravity * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;

  // Yaşlandıkça şeffaflaş ve küçül
  let alpha = p.life / p.maxLife;
  drawCircle(p.x, p.y, p.size * alpha, alpha);
});`}
            note="Oyun motorları binlerce parçacığı GPU (ekran kartı) üzerinde Compute Shader ile tek seferde hesaplar."
          />
        </div>
      </div>
    </div>
  );
}
