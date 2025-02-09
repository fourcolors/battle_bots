import { WEAPONS } from './data';
import { Weapon, WeaponStats } from './types';

export class WeaponService {
  /**
   * Get all available weapons
   */
  static getAllWeapons(): Weapon[] {
    return WEAPONS;
  }

  /**
   * Get a weapon by its ID
   */
  static getWeaponById(id: number): Weapon | undefined {
    return WEAPONS.find(w => w.id === id);
  }

  /**
   * Get weapon stats for combat calculations
   */
  static getWeaponStats(id: number): WeaponStats | undefined {
    const weapon = this.getWeaponById(id);
    if (!weapon) return undefined;

    return {
      damage: weapon.damage,
      range: {
        min: weapon.rangeMin,
        max: weapon.rangeMax
      },
      special: weapon.special,
      aoe: weapon.aoeRadius || weapon.coneAngle ? {
        radius: weapon.aoeRadius,
        coneAngle: weapon.coneAngle
      } : undefined
    };
  }

  /**
   * Validate if a weapon ID is valid
   */
  static isValidWeaponId(id: number): boolean {
    return WEAPONS.some(w => w.id === id);
  }
} 