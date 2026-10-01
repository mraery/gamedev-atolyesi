import React, { useState } from 'react';
import { 
  Gamepad2, 
  RotateCw, 
  MoveRight, 
  Boxes, 
  GitFork, 
  Layers, 
  Cpu, 
  BookOpen, 
  Volume2, 
  VolumeX,
  Sparkles,
  Video,
  Grid,
  Music
} from 'lucide-react';
import { sounds } from '../utils/sound';

export default function Navbar({ activeTab, setActiveTab }) {
  const [isMuted, setIsMuted] = useState(false);

  const tabs = [
    { id: 'loop', label: '1. Oyun Döngüsü', sub: 'Game Loop & dt', icon: RotateCw, color: 'text-sky-400' },
    { id: 'physics', label: '2. Vektörler & Fizik', sub: 'Vectors & Gravity', icon: MoveRight, color: 'text-amber-400' },
    { id: 'collision', label: '3. Çarpışma & CCD', sub: 'AABB, Hitbox, Tünelleme', icon: Boxes, color: 'text-rose-400' },
    { id: 'fsm', label: '4. Durum Makineleri', sub: 'FSM & Animasyon', icon: GitFork, color: 'text-emerald-400' },
    { id: 'ecs', label: '5. Bileşen Mimarisi', sub: 'ECS & Components', icon: Layers, color: 'text-purple-400' },
    { id: 'particles', label: '6. Parçacıklar (VFX)', sub: 'Particles & Emitter', icon: Sparkles, color: 'text-orange-400' },
    { id: 'camera', label: '7. Kamera & Lerp', sub: 'Parallax & Shake', icon: Video, color: 'text-teal-400' },
    { id: 'tilemap', label: '8. Tilemap & Grid', sub: 'Harita Tasarımı', icon: Grid, color: 'text-lime-400' },
    { id: 'sandbox', label: '9. Canlı Oyun Motoru', sub: 'Platformer Sandbox', icon: Cpu, color: 'text-cyan-400' },
    { id: 'audio', label: '10. 8-Bit Ses Lab', sub: 'Procedural Audio', icon: Music, color: 'text-pink-400' },
    { id: 'compare', label: '11. Motorlar & Sınav', sub: 'Unity/Godot & 8 Soru', icon: BookOpen, color: 'text-indigo-400' },
  ];

  const handleMuteToggle = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    if (!muted) sounds.click();
  };

  const handleTabClick = (id) => {
    sounds.click();
    setActiveTab(id);
  };

  return (
    <header className="border-b border-slate-800 bg-[#0d131f]/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-sky-500/20 ring-1 ring-white/20">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-white tracking-tight">GameDev Atölyesi</span>
                <span className="text-[10px] bg-gradient-to-r from-sky-500/20 to-purple-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Pro Studio v2.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Oyun Geliştirme Mantığı, Fiziği ve Mimarisini İnteraktif Öğrenin</p>
            </div>
          </div>

          {/* Sound Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleMuteToggle}
              title={isMuted ? "Sesi Aç" : "Sesi Kapat"}
              className={`p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
                isMuted 
                  ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                  : 'bg-slate-800/90 hover:bg-slate-700/90 border-slate-700 text-slate-200'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span className="hidden md:inline">{isMuted ? "Sessiz" : "Ses Açık"}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none border-t border-slate-800/60 -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0 ${
                  isActive
                    ? 'bg-slate-800 text-white border border-slate-600 shadow-md shadow-black/40 glow-accent ring-1 ring-sky-400/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
                <span className="flex flex-col items-start leading-tight">
                  <span className="text-[11px] font-bold">{tab.label}</span>
                  <span className="text-[9px] text-slate-500 font-normal">{tab.sub}</span>
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
