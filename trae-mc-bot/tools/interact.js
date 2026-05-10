/**
 * tools/interact.js - Interaction tools
 */
module.exports = (botClient) => [
  {
    name: 'interact_entity',
    description: 'Right-click interact with the nearest entity',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      const entity = bot.nearestEntity(e => e !== bot.entity && e.position.distanceTo(bot.entity.position) < 6);
      if (!entity) return { success: false, error: 'No entity nearby to interact with' };

      try {
        bot.activateEntity(entity);
        return { success: true, action: 'interact_entity', entity: entity.name || entity.username };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: 'interact_entity_by_name',
    description: 'Interact with the nearest entity of a specific type',
    inputSchema: {
      type: 'object',
      properties: { entityName: { type: 'string', description: 'Entity type name' } },
      required: ['entityName']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const entity = bot.nearestEntity(e => e.name === params.entityName && e.position.distanceTo(bot.entity.position) < 6);
      if (!entity) return { success: false, error: `Entity "${params.entityName}" not found nearby` };

      try {
        bot.activateEntity(entity);
        return { success: true, action: 'interact_entity_by_name', entity: entity.name };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: 'interact_block',
    description: 'Right-click interact with the block being looked at',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      const block = bot.blockAtCursor(6);
      if (!block) return { success: false, error: 'No block in sight' };

      try {
        await bot.activateBlock(block);
        return { success: true, action: 'interact_block', block: block.name, position: { x: block.position.x, y: block.position.y, z: block.position.z } };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: 'interact_block_at',
    description: 'Interact with a block at a specific coordinate',
    inputSchema: {
      type: 'object',
      properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } },
      required: ['x', 'y', 'z']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const block = bot.blockAt(require('vec3')(params.x, params.y, params.z));
      if (!block) return { success: false, error: 'No block at target position' };

      try {
        await bot.activateBlock(block);
        return { success: true, action: 'interact_block_at', block: block.name };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: 'drop_item',
    description: 'Drop one item from the currently held slot',
    inputSchema: {
      type: 'object',
      properties: {
        slot: { type: 'number', description: 'Inventory slot to drop from' },
        count: { type: 'number', description: 'Number of items to drop (default 1)' }
      }
    },
    handler: async (params) => {
      const bot = botClient.bot;
      try {
        if (params.slot !== undefined) {
          await bot.tossStack(bot.inventory.slots[params.slot]);
        } else {
          await bot.toss(params.count || 1);
        }
        return { success: true, action: 'drop_item' };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  }
];
