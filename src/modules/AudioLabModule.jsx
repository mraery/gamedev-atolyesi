import React, { useState } from 'react';
import { Volume2, Play, Sliders, Sparkles, Code2, Music, Copy, Check } from 'lucide-react';
import CodeSnippetViewer from '../components/CodeSnippetViewer';
import { sounds } from '../utils/sound';

export default function AudioLabModule() {
  const [waveType, setWaveType] = useState('square'); // 'sine', 'square', 'sawtooth', 'triangle', 'noise'
  const [startFreq, setStartFreq] = useState(150);
  const [endFreq, setEndFreq] = useState(480);
  const [duration, setDuration] = useState(0.18);
  const [vol, setVol] = useState(0.2);

  // Play custom synthesized sound
  const playCustomSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (waveType === 'noise') {
        // Noise buffer
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(startFreq, now);
        filter.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
      } else {
        // Oscillator tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = waveType;
        osc.frequency.setValueAtTime(Math.max(20, startFreq), now);
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);

        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
      }
    } catch (e) {
      console.warn("Audio synthesis error", e);
    }
  };

  // Presets
  const applyPreset = (type) => {
    sounds.click();
    if (type === 'jump') {
      setWaveType('square');
      setStartFreq(140);
      setEndFreq(480);
      setDuration(0.16);
    } else if (type === 'laser') {
      setWaveType('sawtooth');
      setStartFreq(880);
      setEndFreq(120);
      setDuration(0.15);
    } else if (type === 'coin') {
      setWaveType('sine');
      setStartFreq(987);
      setEndFreq(1318);
      setDuration(0.28);
    } else if (type === 'explosion') {
      setWaveType('noise');
      setStartFreq(800);
      setEndFreq(40);
      setDuration(0.35);
    } else if (type === 'hit') {
      setWaveType('sawtooth');
      setStartFreq(160);
      setEndFreq(40);
      setDuration(0.18);
    }
  };

  const generatedCode = `// Kendi Oyununuz İçin Saf Web Audio API Sentezleyici:
function playSound() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "${waveType}";
  osc.frequency.setValueAtTime(${startFreq}, now);
  osc.frequency.exponentialRampToValueAtTime(${endFreq}, now + ${duration});

  gain.gain.setValueAtTime(${vol}, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + ${duration});

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + ${duration});
}`;

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-950/40 via-slate-900 to-indigo-950/30 p-6 rounded-2xl border border-pink-800/40 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-pink-500/20 text-pink-400 rounded-lg">
            <Volume2 className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            8-Bit Ses Sentezleyici Laboratuvarı (Procedural Audio)
          </h2>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed max-w-4xl">
          Eski arcade oyunları ve modern indie oyunlar harici MP3 dosyaları yerine 
          <strong> İşlemsel Ses Sentezleyiciler (Synthesizer)</strong> kullanır. 
          Kare dalga (Square Wave) zıplama sesi verirken, testere dişi (Sawtooth) lazer sesi verir, 
          beyaz gürültü (White Noise) ise patlama efekti üretir!
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Controls & Synth Station */}
        <div className="lg:col-span-7 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs uppercase font-bold text-slate-200 tracking-wider">
              Ses Dalga Formu & Frekans Ayarları
            </span>
            <button
              onClick={playCustomSound}
              className="px-5 py-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-pink-500/30 flex items-center gap-1.5 transition"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Sesi Dinle</span>
            </button>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-xs text-slate-400 block mb-2 font-medium">Hazır 8-Bit Ses Şablonları:</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <button onClick={() => applyPreset('jump')} className="p-2.5 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-200 font-bold transition text-center">
                🚀 Zıplama
              </button>
              <button onClick={() => applyPreset('laser')} className="p-2.5 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-200 font-bold transition text-center">
                🔫 Lazer
              </button>
              <button onClick={() => applyPreset('coin')} className="p-2.5 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-200 font-bold transition text-center">
                🪙 Altın
              </button>
              <button onClick={() => applyPreset('explosion')} className="p-2.5 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-200 font-bold transition text-center">
                💥 Patlama
              </button>
              <button onClick={() => applyPreset('hit')} className="p-2.5 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-200 font-bold transition text-center">
                😵 Hasar
              </button>
            </div>
          </div>

          {/* Waveform Selector */}
          <div>
            <span className="text-xs text-slate-400 block mb-2 font-medium">Dalga Formu Tipi (Oscillator Type):</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {['square', 'sawtooth', 'triangle', 'sine', 'noise'].map(w => (
                <button
                  key={w}
                  onClick={() => {
                    sounds.click();
                    setWaveType(w);
                  }}
                  className={`p-2 rounded-xl border font-mono font-bold uppercase text-[11px] transition ${
                    waveType === w 
                      ? 'border-pink-500 bg-pink-950/40 text-pink-300 ring-2 ring-pink-500/30' 
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Başlangıç Frekansı (Start Pitch):</span>
                <span className="font-mono text-pink-400 font-bold">{startFreq} Hz</span>
              </div>
              <input
                type="range"
                min="40"
                max="1600"
                step="20"
                value={startFreq}
                onChange={(e) => setStartFreq(Number(e.target.value))}
                className="w-full accent-pink-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Bitiş Frekansı (Pitch Slide / Kayma):</span>
                <span className="font-mono text-pink-400 font-bold">{endFreq} Hz</span>
              </div>
              <input
                type="range"
                min="40"
                max="1600"
                step="20"
                value={endFreq}
                onChange={(e) => setEndFreq(Number(e.target.value))}
                className="w-full accent-pink-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">
                {endFreq > startFreq ? '▲ Yukarı kayan ton (Zıplama / Başarı efekti)' : '▼ Aşağı kayan ton (Düşme / Darbe efekti)'}
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Ses Süresi (Duration):</span>
                <span className="font-mono text-emerald-400 font-bold">{duration} sn</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.6"
                step="0.02"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Code Exporter */}
        <div className="lg:col-span-5 space-y-4">
          <CodeSnippetViewer
            title="Kendi Oyununuza Ekleyebileceğiniz Kod"
            language="javascript"
            code={generatedCode}
            note="Bu fonksiyonu kopyalayıp tarayıcınızın konsoluna (F12) yapıştırdığınızda bile anında aynı 8-bit sesi çalacaktır!"
          />
        </div>
      </div>
    </div>
  );
}
