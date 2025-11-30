import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Vector2, Entity, Ant, Tower, Projectile, Particle, GameState, FloatingText, TowerType 
} from '../types';
import { TOWER_TYPES, PATH_POINTS, FPS, INITIAL_LIVES, INITIAL_MONEY } from '../constants';

// Helper for distance
const dist = (v1: Vector2, v2: Vector2) => Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2));

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (s: GameState) => void;
  selectedTower: TowerType | null;
  money: number;
  setMoney: (m: number | ((prev: number) => number)) => void;
  lives: number;
  setLives: (l: number | ((prev: number) => number)) => void;
  wave: number;
  setWave: (w: number) => void;
  onWaveComplete: () => void;
  gameSpeed: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState, setGameState, selectedTower, money, setMoney, lives, setLives, wave, setWave, onWaveComplete, gameSpeed
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State Refs (Mutable for loop performance)
  const antsRef = useRef<Ant[]>([]);
  const towersRef = useRef<Tower[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const textsRef = useRef<FloatingText[]>([]);
  
  // Wave Management
  const waveActiveRef = useRef(false);
  const antsToSpawnRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const frameRef = useRef(0);
  const requestIdRef = useRef<number | undefined>(undefined);
  
  // Dimensions
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize/Reset Game
  useEffect(() => {
    if (gameState === 'MENU') {
      antsRef.current = [];
      towersRef.current = [];
      projectilesRef.current = [];
      particlesRef.current = [];
      textsRef.current = [];
      waveActiveRef.current = false;
      antsToSpawnRef.current = 0;
    }
  }, [gameState]);

  // Start Wave Logic
  useEffect(() => {
    if (gameState === 'PLAYING' && !waveActiveRef.current && wave > 0) {
      waveActiveRef.current = true;
      antsToSpawnRef.current = 5 + Math.floor(wave * 2.5);
    }
  }, [wave, gameState]);

  // Main Game Loop
  const loop = useCallback(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // --- LOGIC ---
    
    // 1. Spawning
    if (waveActiveRef.current && antsToSpawnRef.current > 0) {
      spawnTimerRef.current--;
      if (spawnTimerRef.current <= 0) {
        // Spawn ant
        const startNode = PATH_POINTS[0];
        const spawnPos = { x: startNode.x * width, y: startNode.y * height };
        
        // Difficulty scaling
        const hpMultiplier = 1 + (wave * 0.2);
        const speedMultiplier = Math.min(2.5, 1 + (wave * 0.05));

        antsRef.current.push({
          id: Math.random().toString(36).substr(2, 9),
          pos: spawnPos,
          active: true,
          hp: 20 * hpMultiplier,
          maxHp: 20 * hpMultiplier,
          speed: (1.5 + Math.random() * 0.5) * speedMultiplier,
          pathIndex: 0
        });

        antsToSpawnRef.current--;
        // Spawn rate
        spawnTimerRef.current = Math.max(10, 60 - wave * 2);
      }
    } else if (waveActiveRef.current && antsToSpawnRef.current === 0 && antsRef.current.length === 0) {
      // Wave Complete
      waveActiveRef.current = false;
      onWaveComplete();
    }

    // 2. Update Ants
    antsRef.current.forEach(ant => {
      if (!ant.active) return;

      // Move along path
      const path = PATH_POINTS.map(p => ({ x: p.x * width, y: p.y * height }));
      
      // If reached end of current segment
      const target = path[ant.pathIndex + 1];
      if (!target) {
        // Reached Cake
        ant.active = false;
        setLives(l => {
          const newLives = l - 1;
          if (newLives <= 0) setGameState('GAMEOVER');
          return newLives;
        });
        // Effect
        textsRef.current.push({
          id: Math.random().toString(),
          pos: { ...ant.pos },
          text: "-1 ♥",
          life: 60,
          velocity: { x: 0, y: -1 },
          color: '#EF4444',
          active: true
        });
        return;
      }

      const d = dist(ant.pos, target);
      if (d < ant.speed * gameSpeed) {
        ant.pathIndex++;
        if (ant.pathIndex >= path.length - 1) {
           // Logic handled next frame or above check
        }
      } else {
        const angle = Math.atan2(target.y - ant.pos.y, target.x - ant.pos.x);
        ant.pos.x += Math.cos(angle) * ant.speed * gameSpeed;
        ant.pos.y += Math.sin(angle) * ant.speed * gameSpeed;
      }
    });

    // 3. Towers Shoot
    towersRef.current.forEach(tower => {
      if (tower.cooldownTimer > 0) {
        tower.cooldownTimer -= gameSpeed;
        return;
      }

      // Find Target
      let targetAnt: Ant | null = null;
      let minDist = Infinity;
      const config = TOWER_TYPES[tower.type];

      // Simple targeting: Closest
      for (const ant of antsRef.current) {
        if (!ant.active) continue;
        const d = dist(tower.pos, ant.pos);
        if (d <= config.range && d < minDist) {
          minDist = d;
          targetAnt = ant;
        }
      }

      if (targetAnt) {
        // Face target
        tower.angle = Math.atan2(targetAnt.pos.y - tower.pos.y, targetAnt.pos.x - tower.pos.x);
        
        // Shoot
        projectilesRef.current.push({
          id: Math.random().toString(),
          pos: { ...tower.pos },
          targetId: targetAnt.id,
          active: true,
          damage: config.damage,
          speed: 10,
          color: config.color,
          radius: config.type === TowerType.BLAST ? 6 : 3,
          areaOfEffect: config.type === TowerType.BLAST ? 60 : 0
        });
        tower.cooldownTimer = config.cooldown;
      }
    });

    // 4. Update Projectiles
    projectilesRef.current.forEach(proj => {
      if (!proj.active) return;
      
      const target = antsRef.current.find(a => a.id === proj.targetId);
      
      // If target dead, convert to "dumb" projectile that continues to last known pos or destroy
      if (!target || !target.active) {
        proj.active = false; 
        return;
      }

      const d = dist(proj.pos, target.pos);
      if (d < proj.speed * gameSpeed) {
        // Hit
        proj.active = false;
        
        // Damage Logic
        if (proj.areaOfEffect && proj.areaOfEffect > 0) {
            // Splash Damage
            antsRef.current.forEach(a => {
                if(a.active && dist(a.pos, target.pos) < (proj.areaOfEffect || 0)) {
                    a.hp -= proj.damage;
                    if (a.hp <= 0) killAnt(a);
                }
            });
            // Explosion particles
            createExplosion(target.pos, proj.color, 10);
        } else {
            // Single Target
            target.hp -= proj.damage;
            if (target.hp <= 0) killAnt(target);
            createExplosion(target.pos, proj.color, 3);
        }

      } else {
        const angle = Math.atan2(target.pos.y - proj.pos.y, target.pos.x - proj.pos.x);
        proj.pos.x += Math.cos(angle) * proj.speed * gameSpeed;
        proj.pos.y += Math.sin(angle) * proj.speed * gameSpeed;
      }
    });

    // 5. Cleanup
    antsRef.current = antsRef.current.filter(a => a.active);
    projectilesRef.current = projectilesRef.current.filter(p => p.active);
    
    // Particles
    particlesRef.current.forEach(p => {
        p.pos.x += p.velocity.x * gameSpeed;
        p.pos.y += p.velocity.y * gameSpeed;
        p.life -= gameSpeed;
        if(p.life <= 0) p.active = false;
    });
    particlesRef.current = particlesRef.current.filter(p => p.active);

    // Floating Texts
    textsRef.current.forEach(t => {
        t.pos.y += t.velocity.y * gameSpeed; // Float up
        t.life -= gameSpeed;
        if (t.life <= 0) t.active = false;
    });
    textsRef.current = textsRef.current.filter(t => t.active);


    // --- RENDER ---
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Path
    ctx.beginPath();
    ctx.strokeStyle = '#334155'; // Slate-700
    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const path = PATH_POINTS.map(p => ({ x: p.x * width, y: p.y * height }));
    if (path.length > 0) {
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
    }
    ctx.stroke();

    // 2. Draw Cake (Goal)
    const cakePos = path[path.length - 1];
    ctx.fillStyle = '#F472B6'; // Pink
    ctx.fillRect(cakePos.x - 20, cakePos.y - 20, 40, 40);
    // Frosting
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(cakePos.x, cakePos.y - 10, 15, 0, Math.PI * 2);
    ctx.fill();

    // 3. Draw Towers
    towersRef.current.forEach(t => {
       const conf = TOWER_TYPES[t.type];
       
       // Base
       ctx.fillStyle = '#1E293B'; // Dark Slate
       ctx.beginPath();
       ctx.arc(t.pos.x, t.pos.y, 20, 0, Math.PI * 2);
       ctx.fill();

       // Turret
       ctx.save();
       ctx.translate(t.pos.x, t.pos.y);
       ctx.rotate(t.angle);
       ctx.fillStyle = conf.color;
       if (t.type === TowerType.SNIPER) {
           ctx.fillRect(0, -5, 30, 10);
       } else if (t.type === TowerType.BLAST) {
           ctx.fillRect(0, -10, 25, 20);
       } else {
           ctx.fillRect(0, -8, 20, 16);
       }
       ctx.restore();

       // Cooldown indicator (small circle)
       if (t.cooldownTimer > 0) {
           ctx.beginPath();
           ctx.arc(t.pos.x, t.pos.y, 8, 0, (Math.PI * 2) * (t.cooldownTimer / conf.cooldown));
           ctx.fillStyle = 'rgba(255,255,255,0.5)';
           ctx.fill();
       }
    });

    // 4. Draw Ants
    antsRef.current.forEach(a => {
        ctx.fillStyle = '#000'; // Ant body
        
        // Simple Ant Body
        ctx.beginPath();
        ctx.arc(a.pos.x, a.pos.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // HP Bar
        const hpPct = a.hp / a.maxHp;
        ctx.fillStyle = 'red';
        ctx.fillRect(a.pos.x - 10, a.pos.y - 15, 20, 4);
        ctx.fillStyle = '#10B981';
        ctx.fillRect(a.pos.x - 10, a.pos.y - 15, 20 * hpPct, 4);
    });

    // 5. Draw Projectiles
    projectilesRef.current.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // 6. Draw Particles
    particlesRef.current.forEach(p => {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });

    // 7. Draw Text
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    textsRef.current.forEach(t => {
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.pos.x, t.pos.y);
    });

    // Range Indicator if placing
    if (selectedTower) {
        // Draw range circle around center? No, draw under mouse handled by mousemove usually.
        // For mobile, we just tap. We can show range preview if we want, but simple tap to build is better.
    }

    requestIdRef.current = requestAnimationFrame(loop);
  }, [gameState, wave, gameSpeed, onWaveComplete, setLives, setGameState, selectedTower]);

  // Start Loop
  useEffect(() => {
    requestIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestIdRef.current) cancelAnimationFrame(requestIdRef.current);
    };
  }, [loop]);

  // Helpers
  const killAnt = (ant: Ant) => {
      ant.active = false;
      const reward = 10 + Math.floor(Math.random() * 5);
      setMoney(m => m + reward);
      
      // Floating text
      textsRef.current.push({
          id: Math.random().toString(),
          pos: { ...ant.pos },
          text: `+$${reward}`,
          life: 40,
          velocity: { x: 0, y: -0.5 },
          color: '#FBBF24',
          active: true
      });

      createExplosion(ant.pos, '#8B5CF6', 5);
  };

  const createExplosion = (pos: Vector2, color: string, count: number) => {
      for(let i=0; i<count; i++) {
          particlesRef.current.push({
              id: Math.random().toString(),
              pos: { ...pos },
              velocity: { x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.5) * 5 },
              life: 20 + Math.random() * 20,
              maxLife: 40,
              color: color,
              size: 2 + Math.random() * 3,
              active: true
          });
      }
  };

  // Interaction
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (gameState !== 'PLAYING' || !selectedTower) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      
      let clientX, clientY;
      if ('touches' in e) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      } else {
          clientX = (e as React.MouseEvent).clientX;
          clientY = (e as React.MouseEvent).clientY;
      }

      const x = (clientX - rect.left) * (canvas.width / rect.width);
      const y = (clientY - rect.top) * (canvas.height / rect.height);
      const clickPos = { x, y };

      // Validate Placement
      // 1. Not too close to path
      const path = PATH_POINTS.map(p => ({ x: p.x * canvas.width, y: p.y * canvas.height }));
      for (let i = 0; i < path.length - 1; i++) {
         const p1 = path[i];
         const p2 = path[i+1];
         // Distance from point to line segment
         const l2 = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
         if (l2 === 0) continue;
         let t = ((clickPos.x - p1.x) * (p2.x - p1.x) + (clickPos.y - p1.y) * (p2.y - p1.y)) / l2;
         t = Math.max(0, Math.min(1, t));
         const proj = { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
         if (dist(clickPos, proj) < 30) {
             // Too close to path
             return;
         }
      }

      // 2. Not overlapping other towers
      for (const t of towersRef.current) {
          if (dist(clickPos, t.pos) < 30) return;
      }

      // 3. Can afford
      const config = TOWER_TYPES[selectedTower];
      if (money >= config.cost) {
          setMoney(m => m - config.cost);
          towersRef.current.push({
              id: Math.random().toString(),
              pos: clickPos,
              active: true,
              type: selectedTower,
              cooldownTimer: 0,
              angle: 0
          });
          createExplosion(clickPos, '#FFF', 10); // Build effect
      }
  };

  return (
    <canvas 
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="block touch-none"
        onClick={handleCanvasClick}
        onTouchStart={handleCanvasClick}
    />
  );
};