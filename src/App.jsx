import React, { useState } from 'react';
import Navbar from './components/Navbar';
import GameLoopModule from './modules/GameLoopModule';
import PhysicsVectorModule from './modules/PhysicsVectorModule';
import CollisionModule from './modules/CollisionModule';
import StateMachineModule from './modules/StateMachineModule';
import ComponentSystemModule from './modules/ComponentSystemModule';
import ParticleSystemModule from './modules/ParticleSystemModule';
import CameraModule from './modules/CameraModule';
import TilemapModule from './modules/TilemapModule';
import EngineSandboxModule from './modules/EngineSandboxModule';
import AudioLabModule from './modules/AudioLabModule';
import EngineComparison from './modules/EngineComparison';
import { Gamepad2, Sparkles, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('loop');

  const renderModule = () => {
    switch (activeTab) {
      case 'loop':
        return <GameLoopModule />;
      case 'physics':
        return <PhysicsVectorModule />;
      case 'collision':
        return <CollisionModule />;
      case 'fsm':
        return <StateMachineModule />;
      case 'ecs':
        return <ComponentSystemModule />;
      case 'particles':
        return <ParticleSystemModule />;
      case 'camera':
        return <CameraModule />;
      case 'tilemap':
        return <TilemapModule />;
      case 'sandbox':
        return <EngineSandboxModule />;
      case 'audio':
        return <AudioLabModule />;
      case 'compare':
        return <EngineComparison />;
      default:
        return <GameLoopModule />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {renderModule()}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#080b12] py-6 text-center text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-sky-400" />
            <span className="font-bold text-slate-300">GameDev Atölyesi v2.0</span>
            <span className="text-slate-600">|</span>
            <span>Oyun Geliştirme Mantığı & Mimari Eğitimi</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Unity • Godot • Unreal Engine • Web Audio API • HTML5 Canvas</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
