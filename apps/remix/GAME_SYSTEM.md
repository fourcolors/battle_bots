# Agent BattleBots: On-Chain MVP Spec

This document outlines the **minimal viable product** for a hex-based, on-chain battle bot game. It integrates all the core rules needed for a balanced and finite match.

---

## 1. Board & Setup

- **Hex Grid**: Use a regular hexagonal board of sufficient size (e.g., 7×7).
- **Starting Positions**:
  - Place each bot on a **symmetrical ring** around the center (e.g., radius 3).
  - Equally space them to ensure fair distance from one another.
- **Orientation**:
  - Each bot stores an integer `orientation` in the range **0–5**.
  - Defines the bot's facing on the hex grid.

---

## 2. Bot Stats & Build Phase

- **Stat Distribution**: Each bot has **7 points** to allocate among:
  1. **Speed** (max 4)
  2. **Attack** (max 4)
  3. **Defense** (max 4)
- **Hit Points (HP)**: Start at 10 (or a base you choose). You can optionally add a small bonus for certain stats, but keep it simple at MVP.
- **Weapons**: Each bot chooses **1** of 5 weapons:
  1. **Net Launcher**
     - Range: 2–3
     - Damage: 2
     - Special: Immobilize target for 1 turn
     - AP Cost: 1
  2. **Basic Gun**
     - Range: 1–3
     - Damage: 3
     - Special: None
     - AP Cost: 1
  3. **Grenade**
     - Range: 2–3 (indirect)
     - Damage: 3 (main target) + 2 AoE damage to adjacent hexes
     - AP Cost: 1
  4. **Saw Blade**
     - Range: 1 (melee)
     - Damage: 4
     - Special: +1 damage if attacking side/back
     - AP Cost: 1
  5. **Flamethrower**
     - Range: 1–2 (cone AoE)
     - Damage: 3 (applies to all in cone)
     - AP Cost: 1

---

## 3. Turns & Action Points

- **AP**: Each bot has **2 Action Points (AP)** per turn.
- **Actions** (each costs 1 AP unless otherwise stated):
  - **Move**: Move up to 1 hex (cannot move into occupied hexes).
    - _Optional Twist:_ If you want to incorporate Speed more directly, let Speed define how many hexes you can move for 1 AP.
  - **Rotate**: Increment or decrement `orientation` by 1 (or face any direction if you prefer simpler).
  - **Attack**: Use your chosen weapon if the target is in range.
- **Sequential Turns**: Bots act in a round-robin order.

---

## 4. Combat Resolution

1. **Base Damage** = `Attack` stat + weapon's damage modifier.
2. **Orientation Bonus**: Compare attacker's direction to defender's orientation:
   - **Front (delta=0)**: ×1.0
   - **Side (delta=1 or delta=5)**: ×1.2
   - **Back (delta=2,3,4)**: ×1.5 (or pick the exact thresholds you prefer)
3. **Apply Defense** (optional if you want a quick formula):
   - Example: `finalDamage = (baseDamage - defenderDefense)` (minimum 1).
4. **HP Reduction**: Subtract `finalDamage` from defender HP.

---

## 5. Turn Limit & Scoring

- **Max Turns**: 20 (configurable).
- **If multiple bots remain alive** after turn limit:
  1. **Winner** = bot with highest remaining HP.
  2. **Tie** = compare total `damageDealt` over the course of the game.
  3. **If still tied**: Sudden-death round (first successful hit wins).

**Rationale**: Prevents infinite stalling and encourages active combat.

---

## 6. On-Chain Implementation

- **Minimal State** stored on-chain:
  1. **Positions** (hex coordinates)
  2. **Orientation** (0–5)
  3. **HP**, **Attack**, **Defense**, **Speed**
  4. **Weapon Choice**
  5. **Turn Count**, **Damage Dealt** (for tie-breaking)
- **Transactions**: One transaction per turn containing:
  - How AP was spent (moves, attacks, orientation changes).
- **LLM Fee Handling**: Each game can have a fee pool. If the pool depletes or hits the turn limit, the game concludes with the scoring rules.

---

## 7. Additional Considerations

- **No Randomness** for MVP (all hits land, fixed damage).
- **No Obstacles/Line-of-Sight** for simplicity.
- **Collision**: Only one bot per hex. No passing through occupied hexes unless you add a special rule.
- **AI**: Off-chain or user-submitted move logic referencing on-chain state.

---

## References

- **Hunicke, LeBlanc, & Zubek (2004)** – _MDA: A Formal Approach to Game Design_.
- **Salen, K. & Zimmerman, E. (2003)** – _Rules of Play: Game Design Fundamentals_.
- **Richard Garfield** – Ideas on cyclical balance in _Magic: The Gathering_.

---

**Scope**: This MVP spec keeps the game short, fair, and easy to implement on-chain. Once this core is proven fun, you can refine further (obstacles, advanced abilities, random crits, etc.).
