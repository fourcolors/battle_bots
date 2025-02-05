import { BotState, GameState } from "./memoryState";

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
 * Attack action:
 * 1) Check range
 * 2) If in range, compute baseDamage = attacker.Attack + weaponDamage
 * 3) orientation bonus
 * 4) finalDamage = max(1, baseDamage - defenderDefense)
 * 5) apply HP, etc.
 */
export function performAttack(
  attacker: BotState,
  defender: BotState
): { finalDamage: number; isHit: boolean } {
  const weapon = Weapons[attacker.weaponChoice];

  const dist = distance(attacker, defender);

  // Check if dist within weapon range
  if (dist < weapon.rangeMin || dist > weapon.rangeMax) {
    // out of range, no damage
    return { finalDamage: 0, isHit: false };
  }

  // If flamethrower, also check angle within 60° cone
  if (attacker.weaponChoice === 4 && weapon.coneAngle) {
    // we need to see if defender is within attacker's facing direction ± (coneAngle/2)
    // quick approach: let's compute the angle from attacker to defender
    // e.g. angle in degrees from attacker.x,y to defender.x,y
    const angleToTarget = Math.atan2(defender.y - attacker.y, defender.x - attacker.x) * (180 / Math.PI);
    // we have to compare angleToTarget with attacker.orientation
    let angleDiff = Math.abs((angleToTarget - attacker.orientation) % 360);
    if (angleDiff > 180) angleDiff = 360 - angleDiff;
    // if angleDiff > 30 (since cone=60 => half=30), then it's out of the cone
    if (angleDiff > (weapon.coneAngle / 2)) {
      return { finalDamage: 0, isHit: false };
    }
  }

  // baseDamage
  let baseDamage = attacker.Attack + weapon.damage;

  // orientation bonus
  const orientMult = orientationMultiplier(attacker.orientation, defender.orientation);
  baseDamage = Math.floor(baseDamage * orientMult);

  // if saw blade with back attack
  if (attacker.weaponChoice === 3) {
    const diff = orientationDifference(attacker.orientation, defender.orientation);
    if (diff > 120) {
      // back attack +1
      baseDamage += 1;
    }
  }

  // finalDamage = max(1, baseDamage - defender.Defense)
  let finalDamage = baseDamage - defender.Defense;
  if (finalDamage < 1) finalDamage = 1;

  // apply HP
  defender.HP -= finalDamage;
  if (defender.HP < 0) {
    defender.HP = 0;
  }

  // track damageDealt
  attacker.damageDealt += finalDamage;

  // if it's a grenade with AoE, apply lesser damage to others
  // left as an exercise

  return { finalDamage, isHit: true };
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
