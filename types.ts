export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export interface Position {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: 'player' | 'enemy' | 'gem' | 'particle' | 'pickup';
}

export interface Player extends Entity {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  xp: number;
  level: number;
  speed: number;
  bladeCount: number;
  bladeSpeed: number;
  bladeDamage: number;
  bladeSize: number;
  combo: number;
  comboTimer: number;
}

export enum EnemyType {
  NORMAL = 'NORMAL',
  FAST = 'FAST',
  TANK = 'TANK',
}

export interface Enemy extends Entity {
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  sprite: string;
  enemyType: EnemyType;
  stunned: number; // Time remaining in stun
}

export interface Gem extends Entity {
  value: number;
  color: string;
}

export enum PickupType {
  HEAL = 'HEAL',
  BLADE_UP = 'BLADE_UP',
  POWER_UP = 'POWER_UP',
}

export interface Pickup extends Entity {
  pickupType: PickupType;
  life: number;
}

export interface Particle extends Entity {
  vx: number;
  vy: number;
  life: number;
  color: string;
  maxLife: number;
}

export interface DamageText {
  id: string;
  x: number;
  y: number;
  value: number | string;
  life: number;
  opacity: number;
  color: string;
}