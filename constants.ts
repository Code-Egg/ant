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
  }
};

// Path definition (percentage of screen width/height)
export const PATH_POINTS = [
  { x: 0.0, y: 0.1 },
  { x: 0.2, y: 0.1 },
  { x: 0.2, y: 0.7 },
  { x: 0.5, y: 0.7 },
  { x: 0.5, y: 0.3 },
  { x: 0.8, y: 0.3 },
  { x: 0.8, y: 0.8 },
  { x: 0.95, y: 0.8 } // End (Cake)
];

export const INITIAL_LIVES = 10;
export const INITIAL_MONEY = 120;
export const FPS = 60;
