import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, StepForward, RotateCcw, AlertTriangle, CheckCircle2, Zap, Gauge } from 'lucide-react';
import CodeSnippetViewer from '../components/CodeSnippetViewer';
import { sounds } from '../utils/sound';

export default function GameLoopModule() {
  // Stepper State
  const [isPlaying, setIsPlaying] = useState(true);
  const [loopStep, setLoopStep] = useState('update'); // 'input', 'update', 'render'
  const [frameCount, setFrameCount] = useState(0);

  // Delta Time Simulator State
  const [targetFps, setTargetFps] = useState(60);
  const [raceRunning, setRaceRunning] = useState(false);
  const [posBad, setPosBad] = useState(0);
  const [posGood, setPosGood] = useState(0);
  const [raceWinner, setRaceWinner] = useState(null);
  const [elapsedRealTime, setElapsedRealTime] = useState(0);

  const raceRef = useRef(null);
  const lastTimeRef = useRef(performance.now());
  const raceStartTimeRef = useRef(0);

  // Game Loop Stepper automatic progress when playing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setFrameCount(f => f + 1);
      setLoopStep(prev => {
        if (prev === 'input') return 'update';
        if (prev === 'update') return 'render';
        return 'input';
      });
    }, 400); // Visual slow-motion for educational clarity
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Step 1 Frame manually
  const handleManualStep = () => {
    sounds.click();
    setIsPlaying(false);
    setLoopStep(prev => {
      if (prev === 'input') return 'update';
      if (prev === 'update') return 'render';
      setFrameCount(f => f + 1);
      return 'input';
    });
  };

  // Delta Time Race Loop
  useEffect(() => {
    let animId;
    let lastTime = performance.now();
    let accumulatedTime = 0;
    const frameDuration = 1000 / targetFps;

    const loop = (currentTime) => {
      const realDt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (raceRunning) {
        accumulatedTime += realDt * 1000;

        // Simulate the chosen FPS tick rate
        while (accumulatedTime >= frameDuration) {
          accumulatedTime -= frameDuration;
          const simulatedDt = 1 / targetFps;

          setPosBad(prev => {
            // Bad logic: fixed pixels per frame regardless of frame rate
            const next = prev + 3.5;
            if (next >= 100 && !raceWinner) {
              setRaceWinner('bad');
              sounds.hit();
            }
            return Math.min(next, 100);
          });

          setPosGood(prev => {
            // Good logic: speed in pixels/sec * simulated delta time
            // 210 pixels/sec
            const next = prev + (210 * simulatedDt) / 4; // scaled for % width
            if (next >= 100 && !raceWinner) {
              setRaceWinner('good');
              sounds.coin();
            }
            return Math.min(next, 100);
          });
        }

        setElapsedRealTime(((currentTime - raceStartTimeRef.current) / 1000).toFixed(2));
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [raceRunning, targetFps, raceWinner]);

  const startRace = () => {
    sounds.jump();
    setPosBad(0);
    setPosGood(0);
    setRaceWinner(null);
    setElapsedRealTime(0);
    raceStartTimeRef.current = performance.now();
    setRaceRunning(true);
  };

  const resetRace = () => {
    sounds.click();
    setRaceRunning(false);
    setPosBad(0);
    setPosGood(0);
    setRaceWinner(null);
    setElapsedRealTime(0);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {/* Header / Intro */}
      <div className="bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/30 p-6 rounded-2xl border border-sky-800/40 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg">
            <Zap className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            1. Oyun Döngüsü (The Game Loop) & Delta Time
          </h2>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed max-w-4xl">
          Geleneksel yazılımlar (örneğin bir Word belgesi veya web formu) kullanıcı bir butona basana kadar uyur 
          ve bekler (<span className="text-sky-300 font-semibold">Olay Güdümlü / Event-driven</span>). 
          Oyunlar ise bir saniye bile durmaz! Saniyede ortalama <strong>60 kez</strong> çalışan sonsuz bir döngü 
          içinde dünyayı sürekli günceller ve ekrana çizer.
        </p>
      </div>

      {/* Interactive Loop Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Loop Diagram & Controls */}
        <div className="lg:col-span-7 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-bold tracking-widest text-slate-400">
                Sürekli Çalışan Motor Döngüsü
              </span>
              <span className="text-xs font-mono bg-slate-800 text-sky-400 px-3 py-1 rounded-full border border-slate-700">
                Kare (Frame): #{frameCount}
              </span>
            </div>

            {/* Loop Steps Visual Nodes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-6">
              
              {/* Step 1: Input */}
              <div className={`p-4 rounded-xl border transition-all duration-300 ${
                loopStep === 'input'
                  ? 'bg-amber-500/10 border-amber-400 shadow-lg shadow-amber-500/20 glow-warning scale-[1.03]'
                  : 'bg-slate-950/60 border-slate-800 opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-400">1. GİRİŞ (INPUT)</span>
                  {loopStep === 'input' && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>}
                </div>
                <p className="text-[11px] text-slate-300">
                  Klavyeden basılan tuşlar, fare hareketleri veya gamepad sinyalleri yakalanır.
                </p>
              </div>

              {/* Step 2: Update */}
              <div className={`p-4 rounded-xl border transition-all duration-300 ${
                loopStep === 'update'
                  ? 'bg-sky-500/10 border-sky-400 shadow-lg shadow-sky-500/20 glow-accent scale-[1.03]'
                  : 'bg-slate-950/60 border-slate-800 opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-sky-400">2. GÜNCELLE (UPDATE)</span>
                  {loopStep === 'update' && <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>}
                </div>
                <p className="text-[11px] text-slate-300">
                  Fizik hesaplanır, yerçekimi uygulanır, düşman yapay zekası karar verir, canlar güncellenir.
                </p>
              </div>

              {/* Step 3: Render */}
              <div className={`p-4 rounded-xl border transition-all duration-300 ${
                loopStep === 'render'
                  ? 'bg-emerald-500/10 border-emerald-400 shadow-lg shadow-emerald-500/20 glow-neon scale-[1.03]'
                  : 'bg-slate-950/60 border-slate-800 opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-400">3. ÇİZ (RENDER)</span>
                  {loopStep === 'render' && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>}
                </div>
                <p className="text-[11px] text-slate-300">
                  Karakterler, harita parçaları, parçacık efektleri ve arayüz (UI) monitöre basılır.
                </p>
              </div>
            </div>

            {/* Explanation box */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
              <strong className="text-white block mb-1">🎮 Neden bu sıra?</strong>
              Önce kullanıcının ne yapmak istediğini almazsanız (<span className="text-amber-400 font-mono">Input</span>), 
              dünyayı neye göre hareket ettireceksiniz? Hareketi hesaplamadan (<span className="text-sky-400 font-mono">Update</span>) 
              ekrana çizerseniz (<span className="text-emerald-400 font-mono">Render</span>), oyuncu hep 1 kare geriden görür!
            </div>
          </div>

          {/* Stepper Controls */}
          <div className="flex items-center gap-3 pt-6 border-t border-slate-800 mt-6">
            <button
              onClick={() => {
                sounds.click();
                setIsPlaying(!isPlaying);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition ${
                isPlaying 
                  ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? "Döngüyü Duraklat" : "Döngüyü Oynat"}</span>
            </button>

            <button
              onClick={handleManualStep}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
            >
              <StepForward className="w-4 h-4 text-sky-400" />
              <span>1 Kare İlerle (Frame Step)</span>
            </button>
          </div>
        </div>

        {/* Code Explanation */}
        <div className="lg:col-span-5">
          <CodeSnippetViewer
            title="Sözde Kod: Tüm Oyun Motorlarının Temeli"
            language="pseudo-code"
            code={`// Oyun başladığında bir kez çalışır:
function init() {
  oyuncu = new Karakter();
  skor = 0;
}

// Sonsuz döngü (Saniyede ~60 kez):
while (oyunCalisiyor) {
  let simdikiZaman = zamanAl();
  let deltaTime = (simdikiZaman - oncekiZaman);
  oncekiZaman = simdikiZaman;

  girdileriOku();      // Klavye, fare
  guncelle(deltaTime); // Fizik, Yapay Zeka
  ekranaCiz();         // Görselleri boya
}`}
            note="deltaTime (dt): Son iki kare arasında geçen gerçek zamandır (saniye cinsinden). 60 FPS'te dt ≈ 0.016 saniyedir (16 milisaniye)."
          />
        </div>
      </div>

      {/* THE DELTA TIME CATASTROPHE EXPERIMENT */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-rose-500 font-bold text-xs uppercase tracking-wider">Kritik Oyun Mantığı #1</span>
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                Delta Time Felaketi Deneyi
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1">
              "Karakterim hızlı bilgisayarda jet gibi uçuyor, yavaş bilgisayarda kaplumbağa oluyor!"
            </h3>
          </div>

          {/* FPS Slider */}
          <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <Gauge className="w-5 h-5 text-sky-400" />
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Simüle Edilen FPS:</span>
                <span className="font-mono font-bold text-sky-400">{targetFps} FPS</span>
              </div>
              <input
                type="range"
                min="15"
                max="120"
                step="5"
                value={targetFps}
                onChange={(e) => setTargetFps(Number(e.target.value))}
                className="w-36 accent-sky-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                <span>15 (Kasan PC)</span>
                <span>60</span>
                <span>120 (Oyuncu PC)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Race Track Canvas/Visualizer */}
        <div className="space-y-4">
          
          {/* Racer 1: BAD CODE (No dt) */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-red-900/40 relative overflow-hidden">
            <div className="flex justify-between items-center text-xs mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span className="font-bold text-rose-300">1. Acemi Kodlama (FPS'e Bağımlı):</span>
                <code className="text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/50">
                  x += 3.5; // Her KAREDE 3.5 piksel ilerle
                </code>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">{posBad.toFixed(0)}%</span>
            </div>

            {/* Track */}
            <div className="h-10 bg-slate-900 rounded-lg relative overflow-hidden border border-slate-800 flex items-center px-2">
              {/* Finish Line */}
              <div className="absolute right-0 top-0 bottom-0 w-3 bg-red-600/60 border-l border-dashed border-white/50 z-0"></div>
              {/* Runner */}
              <div
                className="absolute transition-all duration-75 z-10 flex items-center"
                style={{ left: `calc(${posBad}% - 28px)` }}
              >
                <div className="w-7 h-7 rounded-lg bg-rose-500 border border-rose-300 flex items-center justify-center text-xs shadow-md shadow-rose-500/50">
                  👾
                </div>
              </div>
            </div>
            <p className="text-[11px] text-rose-300/80 mt-1">
              ⚠️ Yüksek FPS'te (120 FPS) saniyede 120 kere 3.5 eklenir. Karakter ışık hızına çıkar! 15 FPS'te donar.
            </p>
          </div>

          {/* Racer 2: GOOD CODE (With dt) */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-900/40 relative overflow-hidden">
            <div className="flex justify-between items-center text-xs mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-emerald-300">2. Profesyonel Kodlama (Delta Time İle):</span>
                <code className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/50">
                  x += hiz * deltaTime; // Saniyede tam sabit piksel!
                </code>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">{posGood.toFixed(0)}%</span>
            </div>

            {/* Track */}
            <div className="h-10 bg-slate-900 rounded-lg relative overflow-hidden border border-slate-800 flex items-center px-2">
              {/* Finish Line */}
              <div className="absolute right-0 top-0 bottom-0 w-3 bg-emerald-600/60 border-l border-dashed border-white/50 z-0"></div>
              {/* Runner */}
              <div
                className="absolute transition-all duration-75 z-10 flex items-center"
                style={{ left: `calc(${posGood}% - 28px)` }}
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500 border border-emerald-300 flex items-center justify-center text-xs shadow-md shadow-emerald-500/50">
                  🚀
                </div>
              </div>
            </div>
            <p className="text-[11px] text-emerald-300/80 mt-1">
              ✅ FPS ne olursa olsun, saniyede geçen gerçek zamana çarpıldığı için hareket daima aynı kalır!
            </p>
          </div>
        </div>

        {/* Action Buttons & Results */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={startRace}
              disabled={raceRunning}
              className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-sky-500/20 disabled:opacity-50 transition"
            >
              🏁 Yarışı Başlat
            </button>
            <button
              onClick={resetRace}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs border border-slate-700 transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Sıfırla</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-slate-400">
              Gerçek Geçen Süre: <span className="text-white font-bold">{elapsedRealTime} sn</span>
            </span>
            {raceWinner && (
              <span className={`px-3 py-1 rounded-full font-bold uppercase text-[11px] ${
                raceWinner === 'bad' 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {raceWinner === 'bad' 
                  ? '⚠️ Hatalı Kod Kazandı (FPS Hilesi Yaptı!)' 
                  : '🏆 Doğru Kod Sabit Sürede Bitti!'}
              </span>
            )}
          </div>
        </div>

        {/* Golden Rule Summary */}
        <div className="bg-sky-950/30 border border-sky-800/40 rounded-xl p-4 text-xs text-sky-200">
          <strong className="text-sky-300 block mb-1">📌 Oyun Geliştiricinin 1 Numaralı Altın Kuralı:</strong>
          Oyundaki tüm hareket, hız, mermi uçuşu, can dolumu veya süre hesaplamalarında 
          <strong> mutlaka <code>deltaTime</code> ile çarpmalısınız</strong>. 
          Unity'de <code className="bg-black/40 px-1 py-0.5 rounded text-sky-300 font-mono">Time.deltaTime</code>, 
          Godot'ta <code className="bg-black/40 px-1 py-0.5 rounded text-sky-300 font-mono">delta</code>, 
          Unreal'da <code className="bg-black/40 px-1 py-0.5 rounded text-sky-300 font-mono">DeltaTime</code> 
          bunun için vardır!
        </div>
      </div>
    </div>
  );
}
