import React, { useState, useEffect, useRef } from 'react';
import { GitFork, Sword, ShieldAlert, ArrowRight, CheckCircle, AlertOctagon, RefreshCw } from 'lucide-react';
import CodeSnippetViewer from '../components/CodeSnippetViewer';
import { sounds } from '../utils/sound';

export default function StateMachineModule() {
  const [currentState, setCurrentState] = useState('IDLE');
  const [characterX, setCharacterX] = useState(250);
  const [characterY, setCharacterY] = useState(140);
  const [facingRight, setFacingRight] = useState(true);
  const [logs, setLogs] = useState([
    { time: '0.0s', from: 'BAŞLANGIÇ', to: 'IDLE', reason: 'Oyun başladı' }
  ]);
  const [rejectedMessage, setRejectedMessage] = useState(null);

  const stateRef = useRef('IDLE');
  stateRef.current = currentState;

  // Add transition log
  const transitionTo = (nextState, reason) => {
    const prev = stateRef.current;
    if (prev === nextState) return;

    sounds.click();
    setRejectedMessage(null);
    setCurrentState(nextState);
    setLogs(l => [{
      time: (performance.now() / 1000).toFixed(1) + 's',
      from: prev,
      to: nextState,
      reason
    }, ...l.slice(0, 5)]);
  };

  // Rejection notification
  const rejectTransition = (action, reason) => {
    sounds.hit();
    setRejectedMessage(`⛔ Geçiş Reddedildi: "${currentState}" durumundayken ${action} yapamazsınız! (${reason})`);
    setTimeout(() => setRejectedMessage(null), 3000);
  };

  // State actions
  const triggerRun = (dir = 'right') => {
    setFacingRight(dir === 'right');
    if (['IDLE', 'RUN'].includes(stateRef.current)) {
      transitionTo('RUN', `${dir === 'right' ? 'Sağa' : 'Sola'} hareket tuşu basıldı`);
      setCharacterX(x => dir === 'right' ? Math.min(x + 25, 460) : Math.max(x - 25, 40));
    } else {
      rejectTransition('Koşma', 'Karakter havadayken veya darbe almışken yönlenemez');
    }
  };

  const triggerStop = () => {
    if (stateRef.current === 'RUN') {
      transitionTo('IDLE', 'Hareket tuşu bırakıldı');
    }
  };

  const triggerJump = () => {
    if (['IDLE', 'RUN'].includes(stateRef.current)) {
      sounds.jump();
      transitionTo('JUMP', 'Zıplama tuşuna basıldı (Karakter zeminde)');
      setCharacterY(60);

      // Simulate physics: Jump -> Peak -> Fall -> Land
      setTimeout(() => {
        transitionTo('FALL', 'Tepe noktasına ulaşıldı (Hız sıfırlandı, aşağı düşüş başladı)');
        setCharacterY(100);

        setTimeout(() => {
          setCharacterY(140);
          transitionTo('IDLE', 'Zemine temas edildi (isGrounded = true)');
        }, 500);
      }, 450);
    } else {
      rejectTransition('Zıplama', 'Karakter zaten havada veya saldırı durumunda! (Sonsuz zıplama engellendi)');
    }
  };

  const triggerAttack = () => {
    if (['IDLE', 'RUN'].includes(stateRef.current)) {
      sounds.attack();
      transitionTo('ATTACK', 'Saldırı tuşuna basıldı');

      // Lock in attack until animation ends
      setTimeout(() => {
        transitionTo('IDLE', 'Saldırı animasyonu tamamlandı');
      }, 550);
    } else {
      rejectTransition('Saldırı', 'Havadayken veya darbe alırken saldıramazsınız');
    }
  };

  const triggerHurt = () => {
    sounds.hit();
    transitionTo('HURT', 'Düşmandan darbe alındı!');
    setTimeout(() => {
      transitionTo('IDLE', 'Hasar sersemliği bitti');
    }, 700);
  };

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowRight', 'KeyD'].includes(e.code)) triggerRun('right');
      else if (['ArrowLeft', 'KeyA'].includes(e.code)) triggerRun('left');
      else if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        triggerJump();
      } else if (['KeyF', 'KeyJ'].includes(e.code)) triggerAttack();
      else if (['KeyH'].includes(e.code)) triggerHurt();
    };

    const handleKeyUp = (e) => {
      if (['ArrowRight', 'ArrowLeft', 'KeyD', 'KeyA'].includes(e.code)) {
        triggerStop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const nodes = [
    { id: 'IDLE', label: 'BEKLEME (Idle)', desc: 'Zeminde, hareket yok', color: 'border-slate-500 bg-slate-800' },
    { id: 'RUN', label: 'KOŞMA (Run)', desc: 'Zeminde, yatay hız > 0', color: 'border-sky-500 bg-sky-950/40' },
    { id: 'JUMP', label: 'ZIPLAMA (Jump)', desc: 'Havadayken, dikey hız < 0', color: 'border-amber-500 bg-amber-950/40' },
    { id: 'FALL', label: 'DÜŞME (Fall)', desc: 'Havadayken, dikey hız > 0', color: 'border-indigo-500 bg-indigo-950/40' },
    { id: 'ATTACK', label: 'SALDIRI (Attack)', desc: 'Kılıç savurma (Kilitli)', color: 'border-emerald-500 bg-emerald-950/40' },
    { id: 'HURT', label: 'HASAR (Hurt)', desc: 'Sersemleme süresi', color: 'border-rose-500 bg-rose-950/40' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-sky-950/30 p-6 rounded-2xl border border-emerald-800/40 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <GitFork className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            4. Durum Makineleri (Finite State Machine - FSM)
          </h2>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed max-w-4xl">
          Bir karakter aynı anda hem ölüp hem zıplayamaz, veya havadayken sonsuz kez zıplayamaz! 
          Acemi geliştiriciler bunu onlarca <code className="text-rose-400 font-mono">if (isJumping && !isAttacking && ...)</code> ile 
          çözmeye çalışıp "spagetti koda" boğulurlar. 
          <strong> Durum Makinesi</strong> kuralı basittir: Karakter aynı anda <em>yalnızca 1 durumda</em> olabilir 
          ve geçişler sadece kurallara uygunsa gerçekleşir.
        </p>
      </div>

      {/* Interactive Arena & Node Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Character Stage & Controls */}
        <div className="lg:col-span-6 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold text-slate-300 tracking-wider">
                Karakter Sahnesi
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Aktif Durum:</span>
                <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs rounded-full animate-pulse">
                  {currentState}
                </span>
              </div>
            </div>

            {/* Stage Canvas Simulator */}
            <div className="h-60 bg-[#080d16] rounded-xl border border-slate-800 relative overflow-hidden flex flex-col justify-end p-4">
              
              {/* Ground */}
              <div className="absolute bottom-0 left-0 right-0 h-14 bg-slate-800 border-t-2 border-emerald-500 flex items-center px-4">
                <span className="text-[10px] text-slate-400 font-mono">ZEMİN (isGrounded = {['JUMP', 'FALL'].includes(currentState) ? 'false' : 'true'})</span>
              </div>

              {/* Animated Character */}
              <div
                className="absolute transition-all duration-150 flex flex-col items-center"
                style={{
                  left: `${characterX}px`,
                  bottom: `${characterY}px`,
                  transform: facingRight ? 'scaleX(1)' : 'scaleX(-1)'
                }}
              >
                {/* Status bubble above head */}
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/70 text-white mb-1 whitespace-nowrap" style={{ transform: facingRight ? 'scaleX(1)' : 'scaleX(-1)' }}>
                  {currentState === 'IDLE' && '😴 Bekliyor'}
                  {currentState === 'RUN' && '🏃 Koşuyor'}
                  {currentState === 'JUMP' && '🚀 Zıplıyor!'}
                  {currentState === 'FALL' && '🪂 Düşüyor'}
                  {currentState === 'ATTACK' && '⚔️ Kılıç Darbesi!'}
                  {currentState === 'HURT' && '💥 Ahhh!'}
                </span>

                {/* Pixel Character Representation */}
                <div className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl shadow-xl transition-all ${
                  currentState === 'HURT'
                    ? 'bg-rose-600 border-white animate-bounce'
                    : currentState === 'ATTACK'
                    ? 'bg-amber-600 border-amber-300 scale-110'
                    : currentState === 'JUMP'
                    ? 'bg-sky-500 border-sky-300 -rotate-6'
                    : 'bg-indigo-600 border-indigo-400'
                }`}>
                  {currentState === 'HURT' ? '😵' : currentState === 'ATTACK' ? '🤺' : currentState === 'JUMP' ? '🥷' : '🧙'}
                </div>
              </div>

              {/* Rejection Alert Overlay */}
              {rejectedMessage && (
                <div className="absolute top-4 left-4 right-4 bg-rose-950/90 border border-rose-500/80 text-rose-200 p-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xl animate-fadeIn">
                  <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{rejectedMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Control Buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Etkileşimli Eylemler (Klavye tuşları veya butonlar):</span>
              <span className="font-mono text-slate-500">A/D, Boşluk, F, H</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => triggerRun(facingRight ? 'right' : 'left')}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition"
              >
                <span>🏃 Koş (A/D)</span>
              </button>
              <button
                onClick={triggerJump}
                className="p-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-600/30 flex items-center justify-center gap-1.5 transition"
              >
                <span>🚀 Zıpla (Boşluk)</span>
              </button>
              <button
                onClick={triggerAttack}
                className="p-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/30 flex items-center justify-center gap-1.5 transition"
              >
                <span>⚔️ Saldır (F)</span>
              </button>
              <button
                onClick={triggerHurt}
                className="p-2.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold border border-rose-500/40 flex items-center justify-center gap-1.5 transition"
              >
                <span>💥 Darbe Al (H)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live FSM Nodes & Transition Graph */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs uppercase font-bold text-slate-200 tracking-wider">
                Durum Şeması (FSM Graph)
              </h4>
              <span className="text-[11px] text-emerald-400 font-mono">Yeşil Yanan = Aktif Düğüm</span>
            </div>

            {/* Visual Nodes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {nodes.map(node => {
                const isActive = currentState === node.id;
                return (
                  <div
                    key={node.id}
                    className={`p-3 rounded-xl border transition-all duration-300 ${
                      isActive
                        ? 'border-emerald-400 bg-emerald-950/40 shadow-lg shadow-emerald-500/20 scale-[1.04] ring-2 ring-emerald-500/50'
                        : `${node.color} opacity-60`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold font-mono ${isActive ? 'text-emerald-300' : 'text-slate-300'}`}>
                        {node.label}
                      </span>
                      {isActive && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400">{node.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Transition Event Log */}
            <div>
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                Son Durum Geçiş Günlüğü (Event Log):
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto font-mono text-[11px]">
                {logs.map((log, idx) => (
                  <div key={idx} className="bg-slate-950 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{log.time}</span>
                      <span className="text-sky-400 font-bold">{log.from}</span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span className="text-emerald-400 font-bold">{log.to}</span>
                    </div>
                    <span className="text-slate-400 text-[10px]">{log.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <CodeSnippetViewer
            title="Temiz FSM Yapısı (Switch-Case Mantığı)"
            language="javascript"
            code={`switch (karakterDurumu) {
  case "IDLE":
    if (tusHareketi) karakterDurumu = "RUN";
    if (tusZiplama && isGrounded) karakterDurumu = "JUMP";
    break;

  case "JUMP":
    velocity.y += gravity * dt;
    if (velocity.y > 0) karakterDurumu = "FALL"; // Tepeyi aştı
    break;

  case "FALL":
    if (isGrounded) karakterDurumu = "IDLE"; // Yere bastı
    break;
}`}
            note="Durum makinesi sayesinde karakter JUMP durumundayken tekrar 'tusZiplama' gelse bile kod onu görmezden gelir. Sonsuz zıplama bug'ı imkansız hale gelir!"
          />
        </div>
      </div>
    </div>
  );
}
