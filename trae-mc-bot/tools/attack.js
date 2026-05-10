/**
 * tools/attack.js - Combat / attack tools
 */
module.exports = (botClient) => [
  {
    name: 'attack_entity',
    description: 'Attack the entity the bot is currently looking at',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      const entity = bot.nearestEntity(e => {
        return e !== bot.entity && e.position.distanceTo(bot.entity.position) < 6;
      });
      if (!entity) return { success: false, error: 'No entity in range to attack' };

      bot.attack(entity);
      return {
        success: true,
        action: 'attack_entity',
        entity: entity.name || entity.username,
        position: { x: Math.floor(entity.position.x), y: Math.floor(entity.position.y), z: Math.floor(entity.position.z) }
      };
    }
  },
  {
    name: 'attack_entity_by_name',
    description: 'Attack the nearest entity of a specific type',
    inputSchema: {
      type: 'object',
      properties: {
        entityName: { type: 'string', description: 'Entity name (e.g. zombie, cow)' },
        range: { type: 'number', description: 'Search range (default 10)' }
      },
      required: ['entityName']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const range = params.range || 10;
      const entity = bot.nearestEntity(e => {
        return e.name === params.entityName && e.position.distanceTo(bot.entity.position) < range;
      });
      if (!entity) return { success: false, error: `Entity "${params.entityName}" not found within ${range} blocks` };

      bot.attack(entity);
      return {
        success: true,
        action: 'attack_entity_by_name',
        entity: entity.name,
        distance: Math.round(entity.position.distanceTo(bot.entity.position) * 10) / 10
      };
    }
  },
  {
    name: 'attack_nearest_hostile',
    description: 'Attack the nearest hostile mob',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      const hostileNames = ['zombie', 'skeleton', 'creeper', 'spider', 'cave_spider', 'enderman', 'witch', 'blaze', 'phantom', 'pillager', 'vindicator'];
      const entity = bot.nearestEntity(e => {
        return hostileNames.includes(e.name) && e.position.distanceTo(bot.entity.position) < 10;
      });
      if (!entity) return { success: false, error: 'No hostile mobs nearby' };

      bot.attack(entity);
      return {
        success: true,
        action: 'attack_nearest_hostile',
        entity: entity.name,
        distance: Math.round(entity.position.distanceTo(bot.entity.position) * 10) / 10
      };
    }
  },
  {
    name: 'use_item',
    description: 'Use (right-click) the item currently held in hand',
    inputSchema: {
      type: 'object',
      properties: { duration: { type: 'number', description: 'How long to hold right-click in ms (default 1000)' } }
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const duration = params.duration || 1000;
      bot.activateItem();
      if (duration > 0) {
        await new Promise(r => setTimeout(r, duration));
        bot.deactivateItem();
      }
      return { success: true, action: 'use_item', duration };
    }
  },
  {
    name: 'throw_item',
    description: 'Throw / launch the item in hand (snowball, egg, ender pearl, etc.)',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      bot.activateItem();
      await new Promise(r => setTimeout(r, 200));
      bot.deactivateItem();
      return { success: true, action: 'throw_item' };
    }
  },
  {
    name: 'eat_food',
    description: 'Eat the food item currently held in hand',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      if (bot.food >= 20) return { success: false, error: 'Already full hunger' };

      const food = bot.inventory.items().find(i => i.name.includes('food') || ['apple', 'bread', 'cooked_beef', 'cooked_porkchop', 'golden_apple', 'carrot', 'potato', 'melon_slice', 'cookie', 'cake'].includes(i.name));
      if (!food) return { success: false, error: 'No food found in inventory' };

      try {
        await bot.equip(food, 'hand');
        await bot.consume();
        return { success: true, action: 'eat_food', food: food.name };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: 'use_shield',
    description: 'Use shield to block (hold right-click with shield equipped)',
    inputSchema: {
      type: 'object',
      properties: { enable: { type: 'boolean', description: 'true to block, false to stop (default true)' } }
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const shield = bot.inventory.items().find(i => i.name === 'shield');
      if (!shield) return { success: false, error: 'No shield in inventory' };

      try {
        await bot.equip(shield, 'off-hand');
        if (params.enable !== false) {
          bot.activateItemOffhand();
        } else {
          bot.deactivateItem();
        }
        return { success: true, action: params.enable !== false ? 'shield_block' : 'shield_release' };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: 'mount_entity',
    description: 'Mount / ride the nearest ridable entity (horse, donkey, etc.)',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      const ridable = ['horse', 'donkey', 'mule', 'pig', 'strider'];
      const entity = bot.nearestEntity(e => ridable.includes(e.name) && e.position.distanceTo(bot.entity.position) < 5);
      if (!entity) return { success: false, error: 'No ridable entity nearby' };

      try {
        await bot.mount(entity);
        return { success: true, action: 'mount_entity', entity: entity.name };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: 'dismount',
    description: 'Dismount from the currently ridden entity',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      try {
        bot.dismount();
        return { success: true, action: 'dismount' };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  }
];
