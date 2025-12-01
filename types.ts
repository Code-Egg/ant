export type Vector2 = { x: number; y: number };

export enum TowerType {
  BASIC = 'BASIC',
  RAPID = 'RAPID',
  SNIPER = 'SNIPER',
  BLAST = 'BLAST',
  ICE = 'ICE',
  FIRE = 'FIRE'
}

export interface TowerConfig {
  type: TowerType;
  name: string;
  cost: number;
  range: number;
  damage: number;
  cooldown: number; // Frames between shots
  color: string;
}

export interface Entity {
  id: string;
  pos: Vector2;
  active: boolean;
}

export interface Ant extends Entity {
  hp: number;
  maxHp: number;
  speed: number;
  originalSpeed: number; // For slow reset
  pathIndex: number; // Current target node in path
  slowTimer: number; // Frames remaining slow
  scale: number; // Visual size scale
  tier: number; // Visual tier for evil effects
  isBoss?: boolean;
}

export interface Tower extends Entity {
  type: TowerType;
  cooldownTimer: number;
  angle: number;
}

export interface Projectile extends Entity {
  targetId: string;
  damage: number;
  speed: number;
  color: string;
  radius: number;
  areaOfEffect?: number;
  effectType?: 'SLOW' | 'BURN' | 'NONE';
}

export interface Particle extends Entity {
  velocity: Vector2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export type GameState = 'MENU' | 'PLAYING' | 'GAMEOVER';

export interface FloatingText extends Entity {
  text: string;
  life: number;
  velocity: Vector2;
  color: string;
}