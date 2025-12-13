import React, { useState } from 'react';
import JiumozhiGame from './components/JiumozhiGame';
import { Gamepad2, Sparkles, Trophy, Zap, Clock, Star, Flame } from 'lucide-react';

type GameId = 'jiumozhi' | 'bubble_wrap' | 'zen_garden' | null;

interface GameCardProps {
  id: GameId;
  title: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  tags: string[];
  active?: boolean;
  onClick: (id: GameId) => void;
}

const GameCard: React.FC<GameCardProps> = ({ id, title, description, color, icon, tags, active = true, onClick }) => (
  <div 
    onClick={() => active && onClick(id)}
    className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gray-800 transition-all duration-300 ${active ? 'cursor-pointer hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]' : 'opacity-60 grayscale cursor-not-allowed'}`}
  >
    {/* Background Gradient */}
    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10 group-hover:opacity-20 transition-opacity`} />
    
    <div className="relative p-6 h-full flex flex-col">
      <div className="mb-4 flex items-start justify-between">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color} text-white shadow-lg`}>
          {icon}
        </div>
        {!active && (
            <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-black/40 text-gray-400 rounded-full border border-gray-700">
                Coming Soon
            </span>
        )}
        {active && (
             <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white rounded-full border border-white/20">
                Play Now
            </span>
        )}
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-colors">
        {title}
      </h3>
      <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-grow">
        {description}
      </p>

      <div className="flex flex-wrap gap-2 mt-auto">
        {tags.map((tag, i) => (
          <span key={i} className="text-xs font-medium text-gray-500 bg-gray-900/50 px-2 py-1 rounded-md">
            #{tag}
          </span>
        ))}
      </div>
    </div>
  </div>
);

export default function App() {
  const [activeGame, setActiveGame] = useState<GameId>(null);

  if (activeGame === 'jiumozhi') {
    return <JiumozhiGame onExit={() => setActiveGame(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans selection:bg-purple-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#0a0a0c]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2 rounded-lg">
              <Gamepad2 size={24} className="text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              StressRelief.io
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Games</a>
            <a href="#" className="hover:text-white transition-colors">Leaderboards</a>
            <a href="#" className="hover:text-white transition-colors">About</a>
          </div>
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-sm font-medium transition-colors border border-white/10">
            Sign In
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" />
          <h1 className="relative text-5xl md:text-7xl font-black tracking-tight mb-6">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
              Relax. Play.
            </span>
            <span className="block mt-2">Release the Stress.</span>
          </h1>
          <p className="relative text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            A curated collection of satisfying, high-energy, and calming browser games designed to help you decompress in minutes.
          </p>
          <div className="flex items-center justify-center gap-8 text-gray-500 text-sm">
             <div className="flex items-center gap-2"><Sparkles size={16} /> Instant Play</div>
             <div className="flex items-center gap-2"><Zap size={16} /> Zero Install</div>
             <div className="flex items-center gap-2"><Trophy size={16} /> Global Scores</div>
          </div>
        </div>

        {/* Game Grid */}
        <div className="mb-8 flex items-center gap-2 text-white font-bold text-xl">
            <Star className="text-yellow-400" fill="currentColor" />
            <h2>Featured Games</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Game 1: Jiumozhi */}
          <GameCard 
            id="jiumozhi"
            title="Jiumozhi's Fireblade"
            description="Spin flaming blades, fend off endless waves of enemies, and seek wisdom from the legendary monk in this high-octane survival game."
            color="from-red-500 to-orange-600"
            icon={<Flame size={32} />}
            tags={['Action', 'Roguelite', 'Survival']}
            onClick={setActiveGame}
            active={true}
          />

          {/* Placeholder Game 2 */}
          <GameCard 
            id="zen_garden"
            title="Cosmic Zen Garden"
            description="Rake sand patterns across the galaxy and arrange planetary rocks in this meditative puzzle experience."
            color="from-cyan-500 to-blue-600"
            icon={<Sparkles size={32} />}
            tags={['Relaxing', 'Puzzle', 'Atmospheric']}
            onClick={setActiveGame}
            active={false}
          />

          {/* Placeholder Game 3 */}
          <GameCard 
            id="bubble_wrap"
            title="Infinite Bubble Pop"
            description="The classic satisfaction of popping bubble wrap, now with satisfying sound effects and physics-based destruction."
            color="from-pink-500 to-purple-600"
            icon={<Clock size={32} />}
            tags={['Casual', 'Clicker', 'Satisfying']}
            onClick={setActiveGame}
            active={false}
          />
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-white/5 text-center text-gray-600 text-sm">
            <p>&copy; 2024 StressRelief.io Arcade. Built with Gemini & React.</p>
        </div>
      </main>
    </div>
  );
}