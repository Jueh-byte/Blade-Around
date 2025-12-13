import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameCanvas from './GameCanvas';
import Joystick from './Joystick';
import { GameState } from '../types';
import { getMartialArtsWisdom } from '../services/geminiService';
import { Play, RotateCcw, Shield, Flame, BrainCircuit, Volume2, VolumeX, LogOut, ArrowLeft } from 'lucide-react';

// Same SVG as in GameCanvas for consistency
const JIUMOZHI_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23fca5a5"/><path d="M20,90 Q50,110 80,90 L85,50 L15,50 Z" fill="%23b91c1c"/><path d="M15,50 Q50,20 85,50" fill="none" stroke="%23fbbf24" stroke-width="5"/><circle cx="50" cy="40" r="25" fill="%23fca5a5"/><path d="M25,35 Q50,10 75,35" fill="none" stroke="%23000" stroke-width="2"/><circle cx="38" cy="40" r="3" fill="black"/><circle cx="62" cy="40" r="3" fill="black"/><path d="M40,55 Q50,65 60,55" fill="none" stroke="black" stroke-width="2"/><path d="M30,30 L45,35 M70,30 L55,35" stroke="black" stroke-width="3"/><circle cx="50" cy="15" r="8" fill="%231f2937"/><path d="M15,50 L25,80 L10,80 Z" fill="%23fbbf24"/><path d="M85,50 L75,80 L90,80 Z" fill="%23fbbf24"/></svg>`;

interface JiumozhiGameProps {
  onExit: () => void;
}

export default function JiumozhiGame({ onExit }: JiumozhiGameProps) {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [stats, setStats] = useState({ hp: 100, maxHp: 100, mp: 100, maxMp: 100, xp: 0, level: 1, score: 0, combo: 0 });
  const [joystickInput, setJoystickInput] = useState({ x: 0, y: 0 });
  const [wisdom, setWisdom] = useState<string>("");
  const [isLoadingWisdom, setIsLoadingWisdom] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [triggerSkill, setTriggerSkill] = useState(false);
  const [muted, setMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Background Music Management
  useEffect(() => {
    if (audioRef.current) {
      if (gameState === GameState.PLAYING && !muted) {
        audioRef.current.volume = 0.3;
        audioRef.current.play().catch(e => console.log("Audio play failed interaction required", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [gameState, muted]);

  const startGame = () => {
    setStats({ hp: 100, maxHp: 100, mp: 100, maxMp: 100, xp: 0, level: 1, score: 0, combo: 0 });
    setWisdom("");
    setGameState(GameState.PLAYING);
  };

  const handleGameOver = useCallback((finalStats: { score: number; level: number }) => {
    setFinalScore(finalStats.score);
    setGameState(GameState.GAME_OVER);
  }, []);

  const handleConsultMaster = async () => {
    setIsLoadingWisdom(true);
    // Now uses local service, no API key needed
    const text = await getMartialArtsWisdom(finalScore, stats.level);
    setWisdom(text);
    setIsLoadingWisdom(false);
  };
  
  const handleSkill = useCallback(() => {
    if (stats.mp >= 30) {
        setTriggerSkill(true);
    }
  }, [stats.mp]);

  // Keyboard support for skill
  useEffect(() => {
      const handleKey = (e: KeyboardEvent) => {
          if (e.code === 'Space' && gameState === GameState.PLAYING) {
              handleSkill();
          }
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, handleSkill]);

  const xpPercent = Math.min(100, (stats.xp / (stats.level * 100)) * 100);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900 text-white font-sans">
      
      {/* Background Music */}
      <audio ref={audioRef} loop src="https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg" />

      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button 
            onClick={() => setMuted(!muted)}
            className="bg-black/40 p-2 rounded-full hover:bg-black/60 text-white border border-white/10"
        >
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        {gameState === GameState.MENU && (
             <button 
                onClick={onExit}
                className="bg-red-900/40 p-2 rounded-full hover:bg-red-900/60 text-white border border-red-500/30"
                title="Exit to Arcade"
            >
                <LogOut size={20} />
            </button>
        )}
      </div>

      {/* Game Layer */}
      <div className="absolute inset-0 z-0">
        {(gameState === GameState.PLAYING || gameState === GameState.GAME_OVER) && (
          <GameCanvas 
            isPlaying={gameState === GameState.PLAYING}
            onGameOver={handleGameOver}
            onUpdateStats={(hp, maxHp, mp, maxMp, xp, level, score, combo) => setStats({ hp, maxHp, mp, maxMp, xp, level, score, combo })}
            joystickInput={joystickInput}
            triggerSkill={triggerSkill}
            onSkillUsed={() => setTriggerSkill(false)}
          />
        )}
      </div>

      {/* UI Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between">
        
        {/* HUD */}
        {gameState === GameState.PLAYING && (
          <div className="p-4 flex flex-col gap-2">
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-2">
              <div className="flex gap-2">
                  <button 
                    onClick={() => setGameState(GameState.MENU)}
                    className="pointer-events-auto bg-black/40 backdrop-blur-md p-2 rounded-lg border border-white/10 text-white hover:bg-white/10"
                  >
                      <ArrowLeft size={20} />
                  </button>
                  
                  <div className="bg-black/40 backdrop-blur-md p-2 rounded-lg border border-white/10 min-w-[120px]">
                    <div className="flex items-center gap-2 text-yellow-400 font-bold text-xl">
                      <Shield size={20} />
                      <span>Lv.{stats.level}</span>
                    </div>
                    <div className="text-sm text-gray-300">Score: {stats.score}</div>
                    {stats.combo > 2 && (
                        <div className="text-orange-500 font-black text-lg animate-bounce">
                            {stats.combo} HIT COMBO!
                        </div>
                    )}
                  </div>
              </div>
              
              <div className="flex-1 w-full max-w-md md:mx-4">
                 {/* HP Bar */}
                 <div className="flex items-center gap-2 mb-1">
                     <div className="text-xs font-bold text-red-400 w-6">HP</div>
                     <div className="flex-1 bg-gray-700 h-4 rounded-full overflow-hidden border border-gray-600">
                        <div 
                            className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300"
                            style={{ width: `${(stats.hp / stats.maxHp) * 100}%` }}
                        />
                    </div>
                 </div>

                 {/* MP Bar */}
                 <div className="flex items-center gap-2 mb-1">
                    <div className="text-xs font-bold text-blue-400 w-6">MP</div>
                    <div className="flex-1 bg-gray-700 h-3 rounded-full overflow-hidden border border-gray-600">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                            style={{ width: `${(stats.mp / stats.maxMp) * 100}%` }}
                        />
                    </div>
                 </div>

                {/* XP Bar */}
                <div className="w-full bg-gray-800 h-1 mt-1 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500 transition-all duration-100"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        {gameState === GameState.PLAYING && (
          <div className="pointer-events-auto p-6 pb-10 w-full flex justify-between items-end">
             {/* Joystick Area */}
            <div className="relative">
               <Joystick onMove={setJoystickInput} />
            </div>

            {/* Skill Button */}
            <div className="flex flex-col items-center gap-2">
                 <button 
                    className={`w-20 h-20 rounded-full border-4 shadow-lg flex flex-col items-center justify-center transition-all active:scale-95 ${
                        stats.mp >= 30 
                        ? 'bg-gradient-to-b from-orange-500 to-red-600 border-yellow-400 animate-pulse cursor-pointer' 
                        : 'bg-gray-700 border-gray-500 opacity-50 cursor-not-allowed'
                    }`}
                    onClick={handleSkill}
                 >
                     <Flame size={32} className="text-white" />
                     <span className="text-[10px] font-bold text-white">ROAR</span>
                 </button>
                 <div className="hidden md:block text-xs text-gray-400">Press SPACE</div>
            </div>
          </div>
        )}
      </div>

      {/* Menu Screens */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 z-50 bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl border-2 border-yellow-600/50 shadow-[0_0_50px_rgba(234,88,12,0.5)] text-center relative">
            <div className="mb-6 flex justify-center">
               <div className="relative">
                    <img 
                        src={JIUMOZHI_SVG} 
                        className="w-32 h-32 rounded-full border-4 border-orange-500 shadow-xl"
                        alt="Jiumozhi"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Master
                    </div>
               </div>
            </div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-2">
              Fireblade
            </h1>
            <p className="text-gray-300 mb-8 text-sm">
              "With the Fireblade, I shall cleanse the Jianghu!"<br/>
              <span className="text-gray-500 text-xs">(Collect Items, Chain Combos, Use Lion's Roar)</span>
            </p>
            
            <div className="space-y-3">
                <button 
                  onClick={startGame}
                  className="w-full py-4 bg-gradient-to-r from-orange-700 to-red-700 rounded-xl font-bold text-xl text-white hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2 border border-orange-500"
                >
                  <Play fill="currentColor" /> Enter Jianghu
                </button>
                <button 
                  onClick={onExit}
                  className="w-full py-3 bg-gray-700 rounded-xl font-medium text-gray-300 hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut size={18} /> Back to Arcade
                </button>
            </div>
          </div>
        </div>
      )}

      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
          <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl border border-red-600/50 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
            
            <h2 className="text-4xl font-black text-red-600 mb-6 uppercase tracking-widest drop-shadow-lg">DEFEATED</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-700/50 p-4 rounded-lg border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider">Total Score</div>
                <div className="text-3xl font-mono text-white">{finalScore}</div>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider">Highest Combo</div>
                <div className="text-3xl font-mono text-yellow-400">{stats.combo}</div>
              </div>
            </div>

            <div className="mb-6 min-h-[120px] flex flex-col justify-center items-center bg-black/40 p-6 rounded-xl border border-white/10">
              {!wisdom ? (
                <button 
                  onClick={handleConsultMaster}
                  disabled={isLoadingWisdom}
                  className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-2 disabled:opacity-50 transition-colors"
                >
                  <BrainCircuit size={20} />
                  {isLoadingWisdom ? "Meditating..." : "Seek Jiumozhi's Wisdom"}
                </button>
              ) : (
                <div className="text-left animate-fade-in w-full">
                   <p className="text-yellow-100 italic font-serif text-lg leading-relaxed">"{wisdom}"</p>
                   <div className="flex items-center justify-end gap-2 mt-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                             <img src={JIUMOZHI_SVG} alt="avatar"/>
                        </div>
                        <p className="text-xs text-gray-400">- The Great Monk</p>
                   </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
                <button 
                  onClick={startGame}
                  className="w-full py-4 bg-white text-gray-900 rounded-xl font-bold text-lg hover:bg-gray-200 transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                >
                  <RotateCcw size={20} /> Reincarnate
                </button>
                <button 
                  onClick={onExit}
                  className="w-full py-3 bg-gray-700 text-gray-300 rounded-xl font-medium hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                >
                   <LogOut size={18} /> Give Up
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}