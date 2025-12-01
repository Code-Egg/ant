import { TowerType, TowerConfig } from './types';

export const TOWER_TYPES: Record<TowerType, TowerConfig> = {
  [TowerType.BASIC]: {
    type: TowerType.BASIC,
    name: 'Pea Shooter',
    cost: 50,
    range: 120,
    damage: 15,
    cooldown: 30,
    color: '#34D399', // Green
  },
  [TowerType.RAPID]: {
    type: TowerType.RAPID,
    name: 'Machine Gun',
    cost: 150,
    range: 100,
    damage: 5,
    cooldown: 8,
    color: '#FBBF24', // Yellow
  },
  [TowerType.ICE]: {
    type: TowerType.ICE,
    name: 'Ice Ray',
    cost: 200,
    range: 130,
    damage: 5,
    cooldown: 40,
    color: '#22D3EE', // Cyan
  },
  [TowerType.SNIPER]: {
    type: TowerType.SNIPER,
    name: 'Sniper',
    cost: 300,
    range: 250,
    damage: 80,
    cooldown: 90,
    color: '#60A5FA', // Blue
  },
  [TowerType.BLAST]: {
    type: TowerType.BLAST,
    name: 'Cannon',
    cost: 400,
    range: 140,
    damage: 40,
    cooldown: 60,
    color: '#F87171', // Red
  },
  [TowerType.FIRE]: {
    type: TowerType.FIRE,
    name: 'Inferno',
    cost: 500,
    range: 160,
    damage: 2, // High fire rate or high AOE burst
    cooldown: 50, // Burst
    color: '#EA580C', // Orange
  }
};

// Route Definitions (percentage of screen width/height)
export const ROUTES = {
  route1: [
    { x: 0.0, y: 0.1 },
    { x: 0.2, y: 0.1 },
    { x: 0.2, y: 0.7 },
    { x: 0.5, y: 0.7 },
    { x: 0.5, y: 0.3 },
    { x: 0.8, y: 0.3 },
    { x: 0.8, y: 0.8 },
    { x: 0.95, y: 0.8 } 
  ],
  route2: [
    { x: 0.0, y: 0.5 },
    { x: 0.15, y: 0.5 },
    { x: 0.25, y: 0.2 },
    { x: 0.4, y: 0.8 },
    { x: 0.55, y: 0.2 },
    { x: 0.7, y: 0.8 },
    { x: 0.85, y: 0.5 },
    { x: 0.95, y: 0.5 }
  ],
  route3: [
    { x: 0.0, y: 0.2 },
    { x: 0.9, y: 0.2 },
    { x: 0.9, y: 0.4 },
    { x: 0.1, y: 0.4 },
    { x: 0.1, y: 0.6 },
    { x: 0.9, y: 0.6 },
    { x: 0.9, y: 0.8 },
    { x: 0.95, y: 0.8 }
  ]
};

export const INITIAL_LIVES = 10;
export const INITIAL_MONEY = 120;
export const FPS = 60;
export const MAX_WAVES = 100;

// Sprites
export const ANT_SPRITE = "data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20 L8 12 M44 20 L56 12 M20 32 L4 32 M44 32 L60 32 M20 44 L8 52 M44 44 L56 52' stroke='%233e2723' stroke-width='4' stroke-linecap='round' /%3E%3Cellipse cx='32' cy='16' rx='9' ry='7' fill='%235d4037' /%3E%3Cellipse cx='32' cy='32' rx='7' ry='9' fill='%234e342e' /%3E%3Cellipse cx='32' cy='50' rx='11' ry='14' fill='%233e2723' /%3E%3Ccircle cx='29' cy='13' r='2' fill='red' /%3E%3Ccircle cx='35' cy='13' r='2' fill='red' /%3E%3Cpath d='M27 9 L25 3 M37 9 L39 3' stroke='%235d4037' stroke-width='2' /%3E%3C/svg%3E";

export const CAKE_SPRITE = "data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='32' cy='32' r='28' fill='%23e0e0e0' stroke='%23bdbdbd' stroke-width='2'/%3E%3Ccircle cx='32' cy='32' r='22' fill='%238d6e63' /%3E%3Ccircle cx='32' cy='32' r='18' fill='%23f48fb1' /%3E%3Ccircle cx='32' cy='32' r='6' fill='%23e53935' /%3E%3Cpath d='M30 28 L32 24 L34 28' fill='%234caf50' /%3E%3C/svg%3E";