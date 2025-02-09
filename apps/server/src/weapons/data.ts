import { Weapon } from "./types";

export const WEAPONS: Weapon[] = [
  {
    id: 0,
    name: "Net Launcher",
    rangeMin: 5,
    rangeMax: 7,
    damage: 2,
    special: "Immobilize",
    apCost: 1,
    description:
      "A tactical net launcher (Range: 5-7m, Damage: 2) that immobilizes opponents for strategic control. Perfect for locking down fast enemies or setting up devastating combo attacks with teammates.",
    src: "https://robohash.org/net?set=set2&size=32x32",
  },
  {
    id: 1,
    name: "Basic Gun",
    rangeMin: 1,
    rangeMax: 7,
    damage: 3,
    apCost: 1,
    description:
      "Standard-issue energy weapon with excellent range (1-7m) and reliable damage output (3). The perfect all-rounder that excels at medium to long-range combat with consistent performance.",
    src: "https://robohash.org/laser?set=set2&size=32x32",
  },
  {
    id: 2,
    name: "Grenade",
    rangeMin: 5,
    rangeMax: 7,
    damage: 3,
    apCost: 1,
    aoeRadius: 2,
    description:
      "High-explosive grenade with significant range (5-7m) that deals area damage (3) in a 2m radius. Ideal for controlling choke points and dealing damage to multiple clustered enemies.",
    src: "https://robohash.org/missile?set=set2&size=32x32",
  },
  {
    id: 3,
    name: "Saw Blade",
    rangeMin: 0,
    rangeMax: 1,
    damage: 4,
    apCost: 1,
    special: "+1 if back attack",
    description:
      "Devastating close-combat weapon (Range: 0-1m) with high base damage (4). Gains +1 bonus damage when attacking from behind, making it lethal for ambush tactics and aggressive playstyles.",
    src: "https://robohash.org/sword?set=set2&size=32x32",
  },
  {
    id: 4,
    name: "Flamethrower",
    rangeMin: 1,
    rangeMax: 3,
    damage: 3,
    apCost: 1,
    coneAngle: 60,
    description:
      "Mid-range weapon (1-3m) that deals damage (3) in a 60-degree cone. Excellent for area denial and hitting multiple targets. Perfect for controlling corridors and close-quarters combat.",
    src: "https://robohash.org/flamethrower?set=set2&size=32x32",
  },
];
