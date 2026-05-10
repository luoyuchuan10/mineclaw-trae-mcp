/**
 * tools/status.js - Player status and attribute query tools
 */
module.exports = (botClient) => [
  {
    name: 'get_health',
    description: 'Get the bot current health (0-20)',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      return { success: true, health: bot.health, maxHealth: 20, hearts: Math.ceil(bot.health / 2) };
    }
  },
  {
    name: 'get_food',
    description: 'Get the bot current food/hunger level (0-20)',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      return { success: true, food: bot.food, maxFood: 20, saturation: Math.round(bot.foodSaturation * 10) / 10 };
    }
  },
  {
    name: 'get_experience',
    description: 'Get experience level, points, and progress',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      return {
        success: true,
        level: bot.experience.level,
        points: bot.experience.points,
        progress: Math.round(bot.experience.progress * 100) / 100
      };
    }
  },
  {
    name: 'get_oxygen',
    description: 'Get the bot current oxygen level (when underwater)',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      return { success: true, oxygen: bot.oxygenLevel || 20, maxOxygen: 20 };
    }
  },
  {
    name: 'get_armor',
    description: 'Get armor value and equipped armor pieces',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      const armorSlots = [5, 6, 7, 8]; // head, chest, legs, feet
      const armorNames = ['head', 'chest', 'legs', 'feet'];
      const armor = {};
      let totalArmor = 0;

      armorSlots.forEach((slot, i) => {
        const item = bot.inventory.slots[slot];
        if (item) {
          armor[armorNames[i]] = { name: item.name, durability: item.durability };
          // Approximate armor points
          const armorPoints = { leather: 1, chainmail: 2, iron: 2, golden: 2, diamond: 3, netherite: 3 };
          const type = item.name.split('_')[0];
          totalArmor += armorPoints[type] || 0;
        } else {
          armor[armorNames[i]] = null;
        }
      });

      return { success: true, armorPoints: totalArmor, maxArmor: 20, pieces: armor };
    }
  },
  {
    name: 'get_effects',
    description: 'Get all active status effects on the bot',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      const effects = [];
      if (bot.entity.effects) {
        for (const [id, effect] of Object.entries(bot.entity.effects)) {
          effects.push({
            id: Number(id),
            amplifier: effect.amplifier,
            duration: effect.duration
          });
        }
      }
      return { success: true, effects, count: effects.length };
    }
  },
  {
    name: 'is_on_fire',
    description: 'Check if the bot is currently on fire',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      return { success: true, onFire: bot.entity.onFire || false, fireTicks: bot.entity.fireTicks || 0 };
    }
  },
  {
    name: 'is_in_water',
    description: 'Check if the bot is currently in water',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      const pos = bot.entity.position;
      const block = bot.blockAt(pos);
      const inWater = block && (block.name === 'water' || block.name === 'flowing_water');
      return { success: true, inWater };
    }
  },
  {
    name: 'is_in_lava',
    description: 'Check if the bot is currently in lava',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      const pos = bot.entity.position;
      const block = bot.blockAt(pos);
      const inLava = block && (block.name === 'lava' || block.name === 'flowing_lava');
      return { success: true, inLava };
    }
  },
  {
    name: 'get_full_status',
    description: 'Get a comprehensive status overview of the bot',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      const pos = bot.entity.position;
      const block = bot.blockAt(pos);
      return {
        success: true,
        player: {
          username: bot.username,
          health: bot.health,
          food: bot.food,
          saturation: Math.round(bot.foodSaturation * 10) / 10,
          experience: bot.experience.level,
          oxygen: bot.oxygenLevel || 20
        },
        position: {
          x: Math.round(pos.x * 100) / 100,
          y: Math.round(pos.y * 100) / 100,
          z: Math.round(pos.z * 100) / 100
        },
        environment: {
          dimension: bot.game.dimension,
          blockAtFeet: bot.blockAt(pos.offset(0, -1, 0))?.name || 'unknown',
          inWater: block && (block.name === 'water' || block.name === 'flowing_water'),
          inLava: block && (block.name === 'lava' || block.name === 'flowing_lava'),
          onFire: bot.entity.onFire || false
        }
      };
    }
  }
];
