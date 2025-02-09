export interface Weapon {
  id: number;
  name: string;
  rangeMin: number;
  rangeMax: number;
  damage: number;
  special?: string;
  apCost: number;
  aoeRadius?: number;
  coneAngle?: number;
  description: string;
  src: string;
} 