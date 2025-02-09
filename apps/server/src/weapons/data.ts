import { Weapon } from './types';

export const WEAPONS: Weapon[] = [
  {
    id: 0,
    name: "Net Launcher",
    rangeMin: 5,
    rangeMax: 7,
    damage: 2,
    special: "Immobilize",
    apCost: 1,
    description: "A tactical weapon that can immobilize opponents. Perfect for strategic control and setting up combos.",
    src: "https://robohash.org/net?set=set2&size=32x32"
  },
  {
    id: 1,
    name: "Basic Gun",
    rangeMin: 1,
    rangeMax: 7,
    damage: 3,
    apCost: 1,
    description: "A reliable energy weapon with good range and consistent damage output. Balanced choice for most situations.",
    src: "https://robohash.org/laser?set=set2&size=32x32"
  },
  {
    id: 2,
    name: "Grenade",
    rangeMin: 5,
    rangeMax: 7,
    damage: 3,
    apCost: 1,
    aoeRadius: 2,
    description: "Explosive device that deals area damage. Effective for controlling space and damaging grouped enemies.",
    src: "https://robohash.org/missile?set=set2&size=32x32"
  },
  {
    id: 3,
    name: "Saw Blade",
    rangeMin: 0,
    rangeMax: 1,
    damage: 4,
    apCost: 1,
    special: "+1 if back attack",
    description: "High-damage melee weapon that excels at close combat. Bonus damage when attacking from behind.",
    src: "https://robohash.org/sword?set=set2&size=32x32"
  },
  {
    id: 4,
    name: "Flamethrower",
    rangeMin: 1,
    rangeMax: 3,
    damage: 3,
    apCost: 1,
    coneAngle: 60,
    description: "Short-range weapon that deals damage in a cone. Great for area denial and multiple targets.",
    src: "https://robohash.org/flamethrower?set=set2&size=32x32"
  }
]; 