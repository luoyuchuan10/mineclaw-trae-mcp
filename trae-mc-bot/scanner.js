const { Vec3 } = require('vec3');

class Scanner {
  constructor(botClient) {
    this.botClient = botClient;
  }

  get bot() {
    return this.botClient.bot;
  }

  get botPos() {
    return this.bot.entity.position;
  }

  // Scan all nearby entities
  scanEntities(range = 30) {
    const entities = [];
    Object.values(this.bot.entities).forEach(entity => {
      if (entity === this.bot.entity) return;
      const dist = entity.position.distanceTo(this.botPos);
      if (dist <= range) {
        const dx = entity.position.x - this.botPos.x;
        const dz = entity.position.z - this.botPos.z;
        const angle = Math.atan2(dx, dz) * (180 / Math.PI);
        entities.push({
          type: entity.type,
          name: entity.name || entity.username || entity.kind || 'unknown',
          id: entity.id,
          distance: Math.round(dist * 10) / 10,
          direction: this.angleToDirection(angle),
          angle: Math.round(angle * 10) / 10,
          position: { x: Math.floor(entity.position.x), y: Math.floor(entity.position.y), z: Math.floor(entity.position.z) }
        });
      }
    });
    entities.sort((a, b) => a.distance - b.distance);
    return { success: true, count: entities.length, entities };
  }

  // Scan nearby players
  scanPlayers(range = 50) {
    const players = [];
    Object.values(this.bot.players).forEach(player => {
      if (!player.entity || player.username === this.bot.username) return;
      const dist = player.entity.position.distanceTo(this.botPos);
      if (dist <= range) {
        const dx = player.entity.position.x - this.botPos.x;
        const dz = player.entity.position.z - this.botPos.z;
        const angle = Math.atan2(dx, dz) * (180 / Math.PI);
        players.push({
          username: player.username,
          distance: Math.round(dist * 10) / 10,
          direction: this.angleToDirection(angle),
          position: { x: Math.floor(player.entity.position.x), y: Math.floor(player.entity.position.y), z: Math.floor(player.entity.position.z) },
          isSneaking: player.entity.sneaking || false,
          isSprinting: player.entity.sprinting || false,
          ping: player.ping || 0
        });
      }
    });
    players.sort((a, b) => a.distance - b.distance);
    return { success: true, count: players.length, players };
  }

  // Scan blocks in a radius
  scanBlocks(radius = 5) {
    const blocks = {};
    const pos = this.botPos;
    const bx = Math.floor(pos.x);
    const by = Math.floor(pos.y);
    const bz = Math.floor(pos.z);

    for (let x = -radius; x <= radius; x++) {
      for (let y = -radius; y <= radius; y++) {
        for (let z = -radius; z <= radius; z++) {
          const block = this.bot.blockAt(new Vec3(bx + x, by + y, bz + z));
          if (block && block.name !== 'air') {
            blocks[block.name] = (blocks[block.name] || 0) + 1;
          }
        }
      }
    }

    const sorted = Object.entries(blocks).sort((a, b) => b[1] - a[1]);
    return {
      success: true,
      center: { x: bx, y: by, z: bz },
      radius,
      blockTypes: sorted.length,
      blocks: sorted.map(([name, count]) => ({ name, count }))
    };
  }

  // Scan hostile mobs
  scanHostileMobs(range = 30) {
    const hostileNames = ['zombie', 'skeleton', 'creeper', 'spider', 'cave_spider', 'enderman',
      'witch', 'blaze', 'ghast', 'magma_cube', 'slime', 'phantom', 'pillager',
      'vindicator', 'evoker', 'ravager', 'warden', 'bogged', 'breeze'];

    const entities = [];
    Object.values(this.bot.entities).forEach(entity => {
      if (entity === this.bot.entity) return;
      if (entity.type !== 'mob') return;
      const dist = entity.position.distanceTo(this.botPos);
      if (dist <= range && hostileNames.includes(entity.name)) {
        const dx = entity.position.x - this.botPos.x;
        const dz = entity.position.z - this.botPos.z;
        const angle = Math.atan2(dx, dz) * (180 / Math.PI);
        entities.push({
          name: entity.name,
          distance: Math.round(dist * 10) / 10,
          direction: this.angleToDirection(angle),
          health: entity.health || 'unknown',
          position: { x: Math.floor(entity.position.x), y: Math.floor(entity.position.y), z: Math.floor(entity.position.z) }
        });
      }
    });
    entities.sort((a, b) => a.distance - b.distance);
    return { success: true, count: entities.length, hostileMobs: entities };
  }

  // Scan passive / friendly mobs
  scanAnimals(range = 30) {
    const passiveNames = ['cow', 'pig', 'sheep', 'chicken', 'rabbit', 'horse', 'donkey',
      'mule', 'cat', 'ocelot', 'wolf', 'fox', 'bee', 'axolotl', 'dolphin',
      'turtle', 'panda', 'parrot', 'villager', 'iron_golem', 'snow_golem',
      'llama', 'trader_llama', 'frog', 'goat', 'armadillo'];

    const entities = [];
    Object.values(this.bot.entities).forEach(entity => {
      if (entity === this.bot.entity) return;
      if (entity.type !== 'mob' && entity.type !== 'player') return;
      const dist = entity.position.distanceTo(this.botPos);
      if (dist <= range && passiveNames.includes(entity.name)) {
        const dx = entity.position.x - this.botPos.x;
        const dz = entity.position.z - this.botPos.z;
        const angle = Math.atan2(dx, dz) * (180 / Math.PI);
        entities.push({
          name: entity.name,
          distance: Math.round(dist * 10) / 10,
          direction: this.angleToDirection(angle),
          position: { x: Math.floor(entity.position.x), y: Math.floor(entity.position.y), z: Math.floor(entity.position.z) }
        });
      }
    });
    entities.sort((a, b) => a.distance - b.distance);
    return { success: true, count: entities.length, animals: entities };
  }

  // Scan dropped items
  scanDroppedItems(range = 20) {
    const items = [];
    Object.values(this.bot.entities).forEach(entity => {
      if (entity.type === 'object' && entity.name === 'item') {
        const dist = entity.position.distanceTo(this.botPos);
        if (dist <= range) {
          items.push({
            name: entity.metadata?.[7]?.itemName || 'unknown_item',
            distance: Math.round(dist * 10) / 10,
            position: { x: Math.floor(entity.position.x), y: Math.floor(entity.position.y), z: Math.floor(entity.position.z) }
          });
        }
      }
    });
    items.sort((a, b) => a.distance - b.distance);
    return { success: true, count: items.length, items };
  }

  // Find nearest block of a specific type
  findNearestBlock(blockName, range = 64) {
    const pos = this.botPos;
    const block = this.bot.findBlock({
      matching: blockName,
      maxDistance: range,
      count: 1
    });

    if (!block) {
      return { success: false, error: `Block "${blockName}" not found within ${range} blocks` };
    }

    const dist = block.position.distanceTo(pos);
    const dx = block.position.x - pos.x;
    const dz = block.position.z - pos.z;
    const angle = Math.atan2(dx, dz) * (180 / Math.PI);

    return {
      success: true,
      block: block.name,
      position: { x: block.position.x, y: block.position.y, z: block.position.z },
      distance: Math.round(dist * 10) / 10,
      direction: this.angleToDirection(angle)
    };
  }

  // Find nearest chest
  findNearestChest(range = 50) {
    return this.findNearestBlock('chest', range);
  }

  // Find nearest crafting table
  findNearestCraftingTable(range = 50) {
    return this.findNearestBlock('crafting_table', range);
  }

  // Find nearest furnace
  findNearestFurnace(range = 50) {
    return this.findNearestBlock('furnace', range);
  }

  // Find nearest anvil
  findNearestAnvil(range = 50) {
    return this.findNearestBlock('anvil', range);
  }

  // Scan dangers (lava, cliffs, creepers)
  scanDangers(range = 15) {
    const dangers = [];
    const pos = this.botPos;
    const bx = Math.floor(pos.x);
    const by = Math.floor(pos.y);
    const bz = Math.floor(pos.z);

    // Check for lava nearby
    for (let x = -range; x <= range; x++) {
      for (let y = -range; y <= range; y++) {
        for (let z = -range; z <= range; z++) {
          const block = this.bot.blockAt(new Vec3(bx + x, by + y, bz + z));
          if (!block) continue;
          const dist = block.position.distanceTo(pos);
          if (dist > range) continue;

          if (block.name === 'lava' || block.name === 'flowing_lava') {
            dangers.push({
              type: 'lava',
              position: { x: block.position.x, y: block.position.y, z: block.position.z },
              distance: Math.round(dist * 10) / 10
            });
          }
          if (block.name === 'fire' || block.name === 'soul_fire') {
            dangers.push({
              type: 'fire',
              position: { x: block.position.x, y: block.position.y, z: block.position.z },
              distance: Math.round(dist * 10) / 10
            });
          }
          if (block.name === 'cactus') {
            dangers.push({
              type: 'cactus',
              position: { x: block.position.x, y: block.position.y, z: block.position.z },
              distance: Math.round(dist * 10) / 10
            });
          }
          // Check for cliff (3+ block drop)
          if (y === -1) {
            const below = this.bot.blockAt(new Vec3(bx + x, by - 3, bz + z));
            if (below && below.name === 'air') {
              dangers.push({
                type: 'cliff',
                position: { x: bx + x, y: by, z: bz + z },
                distance: Math.round(Math.sqrt(x * x + z * z) * 10) / 10
              });
            }
          }
        }
      }
    }

    // Check for creepers
    Object.values(this.bot.entities).forEach(entity => {
      if (entity.name === 'creeper') {
        const dist = entity.position.distanceTo(pos);
        if (dist <= range) {
          dangers.push({
            type: 'creeper',
            position: { x: Math.floor(entity.position.x), y: Math.floor(entity.position.y), z: Math.floor(entity.position.z) },
            distance: Math.round(dist * 10) / 10
          });
        }
      }
    });

    dangers.sort((a, b) => a.distance - b.distance);
    return { success: true, count: dangers.length, dangers };
  }

  // Utility: convert angle to compass direction
  angleToDirection(angle) {
    // Normalize to 0-360
    angle = ((angle % 360) + 360) % 360;
    if (angle >= 337.5 || angle < 22.5) return 'South';
    if (angle >= 22.5 && angle < 67.5) return 'Southwest';
    if (angle >= 67.5 && angle < 112.5) return 'West';
    if (angle >= 112.5 && angle < 157.5) return 'Northwest';
    if (angle >= 157.5 && angle < 202.5) return 'North';
    if (angle >= 202.5 && angle < 247.5) return 'Northeast';
    if (angle >= 247.5 && angle < 292.5) return 'East';
    if (angle >= 292.5 && angle < 337.5) return 'Southeast';
    return 'Unknown';
  }
}

module.exports = Scanner;
