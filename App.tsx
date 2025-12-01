import React, { useState, useCallback, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { UIOverlay } from './components/UIOverlay';
import { GameState, TowerType } from './types';
import { INITIAL_LIVES, INITIAL_MONEY, ROUTES } from './constants';
import { getWaveIntro, getGameOverMessage } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [money, setMoney] = useState(INITIAL_MONEY);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [wave, setWave] = useState(0);
  const [selectedTower, setSelectedTower] = useState<TowerType | null>(null);
  const [flavorText, setFlavorText] = useState("");
  const [currentPath, setCurrentPath] = useState(ROUTES.route1);

  const startGame = (routeIndex: number) => {
    setLives(INITIAL_LIVES);
    setMoney(INITIAL_MONEY);
    setWave(1);
    
    // Select Route
    if (routeIndex === 1) setCurrentPath(ROUTES.route2);
    else if (routeIndex === 2) setCurrentPath(ROUTES.route3);
    else setCurrentPath(ROUTES.route1);

    setGameState('PLAYING');
    triggerWaveIntro(1);
  };

  const resetGame = () => {
    setGameState('MENU');
    setWave(0);
    setFlavorText("");
  };

  const triggerWaveIntro = async (w: number) => {
    setFlavorText(`Wave ${w} Starting...`);
    const text = await getWaveIntro(w, w > 5 ? "Hard" : "Easy");
    setFlavorText(text);
    setTimeout(() => setFlavorText(""), 4000);
  };

  const handleWaveComplete = useCallback(() => {
    setWave(prev => {
      const nextWave = prev + 1;
      triggerWaveIntro(nextWave);
      return nextWave;
    });
    setMoney(m => m + 50); 
    setLives(prev => {
      if (prev < INITIAL_LIVES) {
        return prev + 1;
      }
      return prev;
    });
  }, []);

  const handleNextWave = useCallback(() => {
      if (gameState === 'PLAYING') {
          setWave(prev => {
             const next = prev + 1;
             triggerWaveIntro(next);
             setMoney(m => m + 20); // Small bonus for rushing
             return next;
          });
      }
  }, [gameState]);

  const handleGameOver = useCallback(async () => {
      setGameState('GAMEOVER');
      const text = await getGameOverMessage(wave, money);
      setFlavorText(text);
  }, [wave, money]);

  useEffect(() => {
    if (gameState === 'GAMEOVER') {
      handleGameOver();
    }
  }, [gameState, handleGameOver]);

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden select-none">
      <GameCanvas 
        gameState={gameState}
        setGameState={setGameState}
        selectedTower={selectedTower}
        money={money}
        setMoney={setMoney}
        lives={lives}
        setLives={setLives}
        wave={wave}
        setWave={setWave}
        onWaveComplete={handleWaveComplete}
        gameSpeed={1}
        pathPoints={currentPath}
      />
      
      <UIOverlay 
        gameState={gameState}
        money={money}
        lives={lives}
        wave={wave}
        selectedTower={selectedTower}
        setSelectedTower={setSelectedTower}
        startGame={startGame}
        resetGame={resetGame}
        flavorText={flavorText}
        onNextWave={handleNextWave}
      />
    </div>
  );
};

export default App;