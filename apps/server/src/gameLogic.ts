import { BotState, GameState } from "./memoryState";
import { WeaponService } from "./weapons/service";

// Basic movement constants
const BASE_MOVEMENT = 2; // each Move AP => (BASE_MOVEMENT + Speed) meters

// Weapons configuration
interface Weapon {
  name: string;
  rangeMin: number;
  rangeMax: number;
  damage: number;
  special?: string;
  apCost: number;
  aoeRadius?: number; // for grenade
  coneAngle?: number; // for flamethrower
}

// 0=Net,1=Gun,2=Grenade,3=Saw,4=Flame
const Weapons: Weapon[] = [
  {
    name: "Net Launcher",
    rangeMin: 5,
    rangeMax: 7,
    damage: 2,
    special: "Immobilize",
    apCost: 1
  },
  {
    name: "Basic Gun",
    rangeMin: 1,
    rangeMax: 7,
    damage: 3,
    apCost: 1
  },
  {
    name: "Grenade",
    rangeMin: 5,
    rangeMax: 7,
    damage: 3,
    apCost: 1,
    aoeRadius: 2
  },
  {
    name: "Saw Blade",
    rangeMin: 0,
    rangeMax: 1,
    damage: 4,
    apCost: 1,
    special: "+1 if back attack"
  },
  {
    name: "Flamethrower",
    rangeMin: 1,
    rangeMax: 3,
    damage: 3,
    apCost: 1,
    coneAngle: 60
  }
];

/**
 * Calculate Euclidean distance between two points
 */
function distance(b1: BotState, b2: BotState): number {
  const dx = b1.x - b2.x;
  const dy = b1.y - b2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Returns absolute difference in orientation from attacker to defender
 * e.g. if attacker=10°, defender=350°, difference ~ 20° (front)
 */
function orientationDifference(attackerAngle: number, defenderAngle: number): number {
  // e.g., we want the minimal angle difference
  let diff = Math.abs(attackerAngle - defenderAngle) % 360;
  if (diff > 180) {
    diff = 360 - diff;
  }
  return diff;
}

/**
 * Example orientation-based multiplier:
 *  - front: ≤60° => x1.0
 *  - side:  >60° ≤120 => x1.2
 *  - back:  >120° => x1.5
 */
function orientationMultiplier(attackerAngle: number, defenderAngle: number): number {
  const diff = orientationDifference(attackerAngle, defenderAngle);
  if (diff <= 60) return 1.0;
  if (diff <= 120) return 1.2;
  return 1.5;
}

/**
 * Calculate if target is in weapon range
 */
function isInRange(attacker: BotState, defender: BotState): boolean {
  const dist = distance(attacker, defender);
  const weaponStats = WeaponService.getWeaponStats(attacker.weaponChoice);
  
  if (!weaponStats) return false;
  
  return dist >= weaponStats.range.min && dist <= weaponStats.range.max;
}

/**
 * Calculate damage for an attack
 */
function calculateDamage(attacker: BotState, defender: BotState): number {
  const weaponStats = WeaponService.getWeaponStats(attacker.weaponChoice);
  if (!weaponStats) return 0;

  const baseDamage = attacker.Attack + weaponStats.damage;
  const multiplier = orientationMultiplier(attacker.orientation, defender.orientation);
  
  // Apply special effects
  let bonus = 0;
  if (weaponStats.special === "+1 if back attack" && multiplier > 1.2) {
    bonus = 1;
  }

  return Math.max(1, (baseDamage * multiplier + bonus) - defender.Defense);
}

/**
 * Check if a weapon hits multiple targets (AOE)
 */
function getAOETargets(attacker: BotState, defender: BotState, game: GameState): BotState[] {
  const weaponStats = WeaponService.getWeaponStats(attacker.weaponChoice);
  if (!weaponStats?.aoe) return [defender];

  const targets: BotState[] = [];
  const { radius, coneAngle } = weaponStats.aoe;

  game.bots.forEach(bot => {
    if (bot === attacker) return;

    const dist = distance(defender, bot);
    
    if (radius && dist <= radius) {
      targets.push(bot);
    } else if (coneAngle) {
      // TODO: Implement cone attack logic
      // For now, just hit the primary target
      if (bot === defender) targets.push(bot);
    }
  });

  return targets;
}

export function performAttack(game: GameState, attackerId: number, defenderId: number): boolean {
  const attacker = game.bots[attackerId];
  const defender = game.bots[defenderId];

  if (!attacker || !defender) return false;
  if (attacker.apConsumed >= 2) return false;
  if (!isInRange(attacker, defender)) return false;

  const targets = getAOETargets(attacker, defender, game);
  targets.forEach(target => {
    const damage = calculateDamage(attacker, target);
    target.HP -= damage;
    attacker.damageDealt += damage;
  });

  attacker.apConsumed += 1;
  return true;
}

/**
 * Move action:
 * - cost = 1 AP
 * - can move up to (BASE_MOVEMENT + Speed) meters
 * - also reduce Fuel by that same # of meters traveled
 * For this MVP, we do a direct "move exactly X, Y" approach.
 */
export function performMove(bot: BotState, newX: number, newY: number): string {
  const maxDist = BASE_MOVEMENT + bot.Speed;
  const dx = newX - bot.x;
  const dy = newY - bot.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > maxDist) {
    return `Cannot move that far; maxDist=${maxDist}, attempted=${dist}`;
  }

  if (bot.Fuel < dist) {
    return `Not enough fuel to move that distance. Fuel=${bot.Fuel}, needed=${dist}`;
  }

  // update
  bot.x = newX;
  bot.y = newY;
  bot.Fuel -= dist;
  return "OK";
}

/**
 * Rotate action:
 *  up to 60° for 1 AP
 */
export function performRotate(bot: BotState, newOrientation: number): string {
  let diff = Math.abs(bot.orientation - newOrientation);
  if (diff > 180) {
    diff = 360 - diff;
  }
  if (diff > 60) {
    return `Cannot rotate more than 60°, attempted=${diff}`;
  }
  bot.orientation = ((newOrientation % 360) + 360) % 360;
  return "OK";
}
