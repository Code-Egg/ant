import React from 'react';
import { TowerType, GameState } from '../types';
import { TOWER_TYPES } from '../constants';
import { Shield, Coins, Heart, Play, RefreshCw, Zap } from 'lucide-react';

interface UIOverlayProps {
  gameState: GameState;
  money: number;
  lives: number;
  wave: number;
  selectedTower: TowerType | null;
  setSelectedTower: (t: TowerType | null) => void;
  startGame: () => void;
  resetGame: () => void;
  flavorText: string;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
  gameState, money, lives, wave, selectedTower, setSelectedTower, startGame, resetGame, flavorText
}) => {
  if (gameState === 'MENU') {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
        <div className="text-center p-8 bg-slate-800 rounded-2xl border border-slate-600 shadow-2xl max-w-sm mx-4">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-2">
            ANT BUSTER
          </h1>
          <p className="text-slate-400 mb-8">Defend the Cake from the Colony!</p>
          <button 
            onClick={startGame}
            className="flex items-center justify-center w-full gap-2 px-8 py-4 bg-green-500 hover:bg-green-600 active:bg-green-700 text-slate-900 font-bold rounded-xl transition-all transform active:scale-95"
          >
            <Play size={24} />
            START GAME
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'GAMEOVER') {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-red-900/90 z-50">
        <div className="text-center p-8 bg-slate-900 rounded-2xl border border-red-500 shadow-2xl mx-4">
          <h2 className="text-4xl font-bold text-red-500 mb-2">DEFEAT</h2>
          <p className="text-white text-xl mb-4">You survived {wave} waves.</p>
          <p className="text-slate-400 italic mb-8 border-t border-slate-700 pt-4">"{flavorText}"</p>
          <button 
            onClick={resetGame}
            className="flex items-center justify-center w-full gap-2 px-8 py-4 bg-white text-red-900 font-bold rounded-xl hover:bg-gray-200"
          >
            <RefreshCw size={24} />
            TRY AGAIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
      
      {/* Top Bar */}
      <div className="flex justify-between items-start p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-600">
            <Heart className="text-red-500 fill-red-500" size={18} />
            <span className="font-mono font-bold text-lg">{lives}</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-600">
            <Coins className="text-yellow-400 fill-yellow-400" size={18} />
            <span className="font-mono font-bold text-lg">{money}</span>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Wave</div>
          <div className="text-3xl font-black text-white leading-none">{wave}</div>
        </div>
      </div>

      {/* Flavor Text Toast */}
      {flavorText && (
        <div className="absolute top-20 left-0 right-0 flex justify-center pointer-events-none px-4">
          <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm md:text-base border border-white/10 animate-fade-in-down text-center">
            {flavorText}
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="p-4 bg-gradient-to-t from-black/90 to-transparent pointer-events-auto">
        <p className="text-xs text-center text-slate-400 mb-2">TAP TO SELECT • TAP MAP TO BUILD</p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center">
          {Object.values(TOWER_TYPES).map((tower) => {
            const isSelected = selectedTower === tower.type;
            const canAfford = money >= tower.cost;
            return (
              <button
                key={tower.type}
                onClick={() => setSelectedTower(isSelected ? null : tower.type)}
                disabled={!canAfford && !isSelected}
                className={`
                  relative flex flex-col items-center p-2 rounded-xl border-2 transition-all min-w-[80px]
                  ${isSelected ? 'bg-slate-700 border-white scale-105 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-slate-800 border-slate-700'}
                  ${!canAfford && !isSelected ? 'opacity-50 grayscale' : 'hover:bg-slate-750'}
                `}
              >
                <div 
                    className="w-10 h-10 rounded-full mb-1 flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: tower.color }}
                >
                    {tower.type === TowerType.BASIC && <div className="w-2 h-4 bg-black/30 rounded-full" />}
                    {tower.type === TowerType.RAPID && <div className="w-3 h-3 bg-black/30 grid grid-cols-2 gap-0.5" />}
                    {tower.type === TowerType.SNIPER && <div className="w-1 h-6 bg-black/30 rounded-full" />}
                    {tower.type === TowerType.BLAST && <div className="w-4 h-4 bg-black/30 rounded-full border-2 border-black/20" />}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">{tower.name}</span>
                <span className={`text-xs font-mono font-bold ${canAfford ? 'text-yellow-400' : 'text-red-400'}`}>
                  ${tower.cost}
                </span>
                
                {isSelected && (
                  <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 shadow-md">
                    <Zap size={12} className="text-white fill-current" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};