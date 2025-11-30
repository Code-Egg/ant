export type Vector2 = { x: number; y: number };

export enum TowerType {
  BASIC = 'BASIC',
  RAPID = 'RAPID',
  SNIPER = 'SNIPER',
  BLAST = 'BLAST'
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
  pathIndex: number; // Current target node in path
  frozen?: number; // Frames remaining frozen
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