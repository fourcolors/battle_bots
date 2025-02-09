export interface Weapon {
  id: number;
  name: string;
  rangeMin: number;
  rangeMax: number;
  damage: number;
  special?: string;
  apCost: number;
  aoeRadius?: number;  // for grenade
  coneAngle?: number;  // for flamethrower
  description: string;
  src: string;
}

export type WeaponChoice = 0 | 1 | 2 | 3 | 4;

export interface WeaponStats {
  damage: number;
  range: {
    min: number;
    max: number;
  };
  special?: string;
  aoe?: {
    radius?: number;
    coneAngle?: number;
  };
} 