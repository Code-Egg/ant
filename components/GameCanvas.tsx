import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Vector2, Entity, Ant, Tower, Projectile, Particle, GameState, FloatingText, TowerType 
} from '../types';
import { 
  TOWER_TYPES, FPS, INITIAL_LIVES, INITIAL_MONEY,
  ANT_SPRITE, CAKE_SPRITE 
} from '../constants';

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
  pathPoints: { x: number; y: number }[];
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState, setGameState, selectedTower, money, setMoney, lives, setLives, wave, setWave, onWaveComplete, gameSpeed, pathPoints
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State Refs (Mutable for loop performance)
  const antsRef = useRef<Ant[]>([]);
  const towersRef = useRef<Tower[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const textsRef = useRef<FloatingText[]>([]);
  
  // UI Interaction Refs
  const cursorPosRef = useRef<Vector2 | null>(null);
  const inspectedTowerIdRef = useRef<string | null>(null);

  // Assets
  const spritesRef = useRef<{ ant: HTMLImageElement | null; cake: HTMLImageElement | null }>({ ant: null, cake: null });

  // Wave Management
  const waveActiveRef = useRef(false);
  const antsToSpawnRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const processedWaveRef = useRef(0); // Track which wave we have processed to allow stacking
  const requestIdRef = useRef<number | undefined>(undefined);
  
  // Dimensions
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Load Sprites
  useEffect(() => {
    const antImg = new Image();
    antImg.src = ANT_SPRITE;
    const cakeImg = new Image();
    cakeImg.src = CAKE_SPRITE;
    spritesRef.current = { ant: antImg, cake: cakeImg };
  }, []);

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
      processedWaveRef.current = 0;
      inspectedTowerIdRef.current = null;
    }
  }, [gameState]);

  // Start Wave / Add Ants Logic
  useEffect(() => {
    if (gameState === 'PLAYING' && wave > processedWaveRef.current) {
      waveActiveRef.current = true;
      processedWaveRef.current = wave;
      
      let count = 0;
      
      if (wave === 100) {
        // BOSS WAVE
        count = 1;
      } else {
        // Normal Wave
        count = 8 + Math.floor(wave * 3);
      }
      
      antsToSpawnRef.current += count;
    }
  }, [wave, gameState]);

  // Mouse Handlers for Ghost Placement
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    cursorPosRef.current = { x, y };
  }, []);

  const handleMouseLeave = useCallback(() => {
    cursorPosRef.current = null;
  }, []);

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
    if (antsToSpawnRef.current > 0) {
      spawnTimerRef.current--;
      if (spawnTimerRef.current <= 0) {
        // Spawn ant
        const startNode = pathPoints[0];
        const spawnPos = { x: startNode.x * width, y: startNode.y * height };
        
        let isBoss = false;
        let hp = 20;
        let speed = 1.5;
        let scale = 1.0;
        let tier = Math.floor(wave / 10);

        if (wave === 100 && antsToSpawnRef.current === 1) {
            // THE BOSS
            isBoss = true;
            hp = 80000; // Massive HP
            speed = 0.4; // Very Slow
            scale = 4.0; // Huge
            tier = 20; // Ultra Evil
        } else {
            // Normal Logic
            const hpMultiplier = 1 + (wave * 0.5); 
            const speedMultiplier = Math.min(3.5, 1 + (wave * 0.08)); 
            hp = 20 * hpMultiplier;
            speed = (1.5 + Math.random() * 0.5) * speedMultiplier;
            scale = 1 + (tier * 0.12);
        }

        antsRef.current.push({
          id: Math.random().toString(36).substr(2, 9),
          pos: spawnPos,
          active: true,
          hp: hp,
          maxHp: hp,
          speed: speed,
          originalSpeed: speed,
          pathIndex: 0,
          scale: scale,
          tier: tier,
          slowTimer: 0,
          isBoss: isBoss
        });

        antsToSpawnRef.current--;
        // Spawn rate
        if (isBoss) {
             spawnTimerRef.current = 200;
        } else {
             spawnTimerRef.current = Math.max(8, 50 - wave * 1.5); 
        }
      }
    } else if (waveActiveRef.current && antsToSpawnRef.current === 0 && antsRef.current.length === 0) {
      // Wave Complete
      waveActiveRef.current = false;
      onWaveComplete();
    }

    // 2. Update Ants
    antsRef.current.forEach(ant => {
      if (!ant.active) return;

      // Handle Slow Effect
      let currentSpeed = ant.speed;
      if (ant.slowTimer > 0) {
          currentSpeed = ant.originalSpeed * 0.5;
          ant.slowTimer -= gameSpeed;
      } else {
          currentSpeed = ant.originalSpeed;
      }

      // Move along path
      const path = pathPoints.map(p => ({ x: p.x * width, y: p.y * height }));
      
      const target = path[ant.pathIndex + 1];
      if (!target) {
        // Reached Cake
        ant.active = false;
        setLives(l => {
          const dmg = ant.isBoss ? 100 : 1; // Boss kills instantly
          const newLives = l - dmg;
          if (newLives <= 0) setGameState('GAMEOVER');
          return newLives;
        });
        textsRef.current.push({
          id: Math.random().toString(),
          pos: { ...ant.pos },
          text: ant.isBoss ? "DEFEAT" : "-1 ♥",
          life: 60,
          velocity: { x: 0, y: -1 },
          color: '#EF4444',
          active: true
        });
        return;
      }

      const d = dist(ant.pos, target);
      if (d < currentSpeed * gameSpeed) {
        ant.pathIndex++;
      } else {
        const angle = Math.atan2(target.y - ant.pos.y, target.x - ant.pos.x);
        ant.pos.x += Math.cos(angle) * currentSpeed * gameSpeed;
        ant.pos.y += Math.sin(angle) * currentSpeed * gameSpeed;
      }
    });

    // 3. Towers Shoot
    towersRef.current.forEach(tower => {
      if (tower.cooldownTimer > 0) {
        tower.cooldownTimer -= gameSpeed;
        return;
      }

      let targetAnt: Ant | null = null;
      let minDist = Infinity;
      const config = TOWER_TYPES[tower.type];

      // Targeting
      for (const ant of antsRef.current) {
        if (!ant.active) continue;
        const d = dist(tower.pos, ant.pos);
        if (d <= config.range && d < minDist) {
          minDist = d;
          targetAnt = ant;
        }
      }

      if (targetAnt) {
        tower.angle = Math.atan2(targetAnt.pos.y - tower.pos.y, targetAnt.pos.x - tower.pos.x);
        
        projectilesRef.current.push({
          id: Math.random().toString(),
          pos: { ...tower.pos },
          targetId: targetAnt.id,
          active: true,
          damage: config.damage,
          speed: 12,
          color: config.color,
          radius: (config.type === TowerType.BLAST || config.type === TowerType.FIRE) ? 8 : 4,
          areaOfEffect: config.type === TowerType.BLAST ? 60 : (config.type === TowerType.FIRE ? 90 : 0),
          effectType: config.type === TowerType.ICE ? 'SLOW' : (config.type === TowerType.FIRE ? 'BURN' : 'NONE')
        });
        tower.cooldownTimer = config.cooldown;
      }
    });

    // 4. Update Projectiles
    projectilesRef.current.forEach(proj => {
      if (!proj.active) return;
      
      const target = antsRef.current.find(a => a.id === proj.targetId);
      
      if (!target || !target.active) {
        proj.active = false; 
        return;
      }

      const d = dist(proj.pos, target.pos);
      if (d < proj.speed * gameSpeed) {
        // Hit
        proj.active = false;
        
        if (proj.areaOfEffect && proj.areaOfEffect > 0) {
            // AOE Damage
            antsRef.current.forEach(a => {
                if(a.active && dist(a.pos, target.pos) < (proj.areaOfEffect || 0)) {
                    a.hp -= proj.damage;
                    if (proj.effectType === 'SLOW') a.slowTimer = 120; // 2 seconds
                    if (a.hp <= 0) killAnt(a);
                }
            });
            createExplosion(target.pos, proj.color, 12);
        } else {
            // Single Target
            target.hp -= proj.damage;
            if (proj.effectType === 'SLOW') target.slowTimer = 120;
            if (target.hp <= 0) killAnt(target);
            createExplosion(target.pos, proj.color, 4);
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
        t.pos.y += t.velocity.y * gameSpeed; 
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
    const renderPath = pathPoints.map(p => ({ x: p.x * width, y: p.y * height }));
    if (renderPath.length > 0) {
      ctx.moveTo(renderPath[0].x, renderPath[0].y);
      for (let i = 1; i < renderPath.length; i++) {
        ctx.lineTo(renderPath[i].x, renderPath[i].y);
      }
    }
    ctx.stroke();

    // 2. Draw Cake (Goal)
    const cakePos = renderPath[renderPath.length - 1];
    if (spritesRef.current.cake && spritesRef.current.cake.complete) {
        const size = 50;
        ctx.drawImage(spritesRef.current.cake, cakePos.x - size/2, cakePos.y - size/2, size, size);
    }

    // 3. Draw Towers
    towersRef.current.forEach(t => {
       const conf = TOWER_TYPES[t.type];
       
       if (inspectedTowerIdRef.current === t.id) {
           ctx.beginPath();
           ctx.arc(t.pos.x, t.pos.y, conf.range, 0, Math.PI * 2);
           ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
           ctx.fill();
           ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
           ctx.setLineDash([5, 5]);
           ctx.stroke();
           ctx.setLineDash([]);
       }

       // Base
       ctx.fillStyle = '#1E293B'; 
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
       } else if (t.type === TowerType.BLAST || t.type === TowerType.FIRE) {
           ctx.fillRect(0, -10, 26, 20);
       } else if (t.type === TowerType.ICE) {
           ctx.beginPath();
           ctx.moveTo(0, -8);
           ctx.lineTo(24, 0);
           ctx.lineTo(0, 8);
           ctx.fill();
       } else {
           ctx.fillRect(0, -8, 20, 16);
       }
       ctx.restore();

       if (t.cooldownTimer > 0) {
           ctx.beginPath();
           ctx.arc(t.pos.x, t.pos.y, 8, 0, (Math.PI * 2) * (t.cooldownTimer / conf.cooldown));
           ctx.fillStyle = 'rgba(255,255,255,0.5)';
           ctx.fill();
       }
    });

    // Ghost Tower
    if (selectedTower && cursorPosRef.current) {
        const conf = TOWER_TYPES[selectedTower];
        const pos = cursorPosRef.current;
        
        let valid = true;
        const pPath = pathPoints.map(p => ({ x: p.x * canvas.width, y: p.y * canvas.height }));
        for (let i = 0; i < pPath.length - 1; i++) {
            const p1 = pPath[i];
            const p2 = pPath[i+1];
            const l2 = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
            if (l2 === 0) continue;
            let t = ((pos.x - p1.x) * (p2.x - p1.x) + (pos.y - p1.y) * (p2.y - p1.y)) / l2;
            t = Math.max(0, Math.min(1, t));
            const proj = { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
            if (dist(pos, proj) < 30) { valid = false; break; }
        }
        if (valid) {
            for (const t of towersRef.current) {
                if (dist(pos, t.pos) < 30) { valid = false; break; }
            }
        }

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, conf.range, 0, Math.PI * 2);
        ctx.fillStyle = valid ? 'rgba(255, 255, 255, 0.2)' : 'rgba(239, 68, 68, 0.2)';
        ctx.fill();
        ctx.strokeStyle = valid ? 'rgba(255, 255, 255, 0.4)' : 'rgba(239, 68, 68, 0.4)';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = valid ? conf.color : '#EF4444';
        ctx.globalAlpha = 0.5;
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    // 4. Draw Ants
    antsRef.current.forEach(a => {
        const pPath = pathPoints.map(p => ({ x: p.x * width, y: p.y * height }));
        const target = pPath[a.pathIndex + 1];
        let angle = 0;
        if (target) {
             angle = Math.atan2(target.y - a.pos.y, target.x - a.pos.x);
        }

        ctx.save();
        ctx.translate(a.pos.x, a.pos.y);
        ctx.scale(a.scale, a.scale); 

        // Visual Effects
        if (a.slowTimer > 0) {
            ctx.filter = 'hue-rotate(180deg) brightness(1.5)'; // Ice effect
        } else if (a.tier > 0) {
            const hueShift = -15 * Math.min(a.tier, 6);
            const saturation = 100 + (a.tier * 20); 
            const brightness = Math.max(70, 100 - (a.tier * 5));
            ctx.filter = `hue-rotate(${hueShift}deg) saturate(${saturation}%) brightness(${brightness}%)`;
        }
        
        if (spritesRef.current.ant && spritesRef.current.ant.complete) {
            ctx.rotate(angle + Math.PI / 2);
            const size = 32;
            ctx.drawImage(spritesRef.current.ant, -size/2, -size/2, size, size);
        } else {
            ctx.rotate(angle);
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // HP Bar
        const hpPct = a.hp / a.maxHp;
        const hpOffset = 20 * a.scale;
        const barWidth = 20 * (a.isBoss ? 3 : 1); // Bigger bar for boss
        
        ctx.fillStyle = 'red';
        ctx.fillRect(a.pos.x - barWidth/2, a.pos.y - hpOffset, barWidth, 4);
        ctx.fillStyle = '#10B981';
        ctx.fillRect(a.pos.x - barWidth/2, a.pos.y - hpOffset, barWidth * hpPct, 4);
    });

    // 5. Projectiles & Particles & Text (Same as before)
    projectilesRef.current.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    particlesRef.current.forEach(p => {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });

    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    textsRef.current.forEach(t => {
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.pos.x, t.pos.y);
    });

    requestIdRef.current = requestAnimationFrame(loop);
  }, [gameState, wave, gameSpeed, onWaveComplete, setLives, setGameState, selectedTower, pathPoints]);

  useEffect(() => {
    requestIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestIdRef.current) cancelAnimationFrame(requestIdRef.current);
    };
  }, [loop]);

  const killAnt = (ant: Ant) => {
      ant.active = false;
      let reward = 10 + Math.floor(Math.random() * 5);
      if (ant.isBoss) reward = 10000;

      setMoney(m => m + reward);
      textsRef.current.push({
          id: Math.random().toString(),
          pos: { ...ant.pos },
          text: `+$${reward}`,
          life: 40,
          velocity: { x: 0, y: -0.5 },
          color: '#FBBF24',
          active: true
      });
      createExplosion(ant.pos, '#8B5CF6', ant.isBoss ? 50 : 5);
      if(ant.isBoss) {
          // Boss death celebration
           textsRef.current.push({
              id: Math.random().toString(),
              pos: { ...ant.pos },
              text: "BOSS DEFEATED!",
              life: 120,
              velocity: { x: 0, y: -1 },
              color: '#F472B6',
              active: true
          });
      }
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

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (gameState !== 'PLAYING') return;

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

      if (selectedTower) {
          // Validate Placement (Re-use path logic)
          const pPath = pathPoints.map(p => ({ x: p.x * canvas.width, y: p.y * canvas.height }));
          for (let i = 0; i < pPath.length - 1; i++) {
             const p1 = pPath[i];
             const p2 = pPath[i+1];
             const l2 = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
             if (l2 === 0) continue;
             let t = ((clickPos.x - p1.x) * (p2.x - p1.x) + (clickPos.y - p1.y) * (p2.y - p1.y)) / l2;
             t = Math.max(0, Math.min(1, t));
             const proj = { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
             if (dist(clickPos, proj) < 30) return;
          }
          for (const t of towersRef.current) {
              if (dist(clickPos, t.pos) < 30) return;
          }

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
              createExplosion(clickPos, '#FFF', 10);
              inspectedTowerIdRef.current = null;
          }
      } else {
          let clickedTower = null;
          for (const t of towersRef.current) {
              if (dist(clickPos, t.pos) < 30) {
                  clickedTower = t;
                  break;
              }
          }
          inspectedTowerIdRef.current = clickedTower ? clickedTower.id : null;
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
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
    />
  );
};