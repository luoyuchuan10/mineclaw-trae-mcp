/**
 * tools/place.js - Block placement tools
 */
const { Vec3 } = require('vec3');

module.exports = (botClient) => [
  {
    name: 'place_block',
    description: 'Place the held block on the face of the block currently being looked at',
    inputSchema: {
      type: 'object',
      properties: {
        slot: { type: 'number', description: 'Hotbar slot (0-8) to use (default: current slot)' }
      }
    },
    handler: async (params) => {
      const bot = botClient.bot;
      if (params.slot !== undefined) {
        const item = bot.inventory.slots[bot.QUICK_BAR_START + params.slot];
        if (item) await bot.equip(item, 'hand');
      }
      const block = bot.blockAtCursor(6);
      if (!block) return { success: false, error: 'No block in sight to place against' };

      try {
        await bot.placeBlock(block, require('vec3')(0, 1, 0));
        return { success: true, action: 'place_block', onBlock: block.name, position: { x: block.position.x, y: block.position.y + 1, z: block.position.z } };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: 'place_block_at',
    description: 'Place a block at a specific coordinate',
    inputSchema: {
      type: 'object',
      properties: {
        x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' },
        blockName: { type: 'string', description: 'Block name to place (e.g. stone, dirt)' }
      },
      required: ['x', 'y', 'z']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const target = new Vec3(params.x, params.y, params.z);

      // Find the item in inventory if blockName specified
      if (params.blockName) {
        const item = bot.inventory.items().find(i => i.name === params.blockName);
        if (!item) return { success: false, error: `Item "${params.blockName}" not found in inventory` };
        await bot.equip(item, 'hand');
      }

      // Find adjacent block to place against
      const adjacentBlock = bot.blockAt(target.offset(0, -1, 0)) || bot.blockAt(target.offset(0, 0, 1));
      if (!adjacentBlock) return { success: false, error: 'Cannot find adjacent block to place against' };

      try {
        const face = target.y > adjacentBlock.position.y ? require('vec3')(0, 1, 0) : require('vec3')(0, -1, 0);
        await bot.placeBlock(adjacentBlock, face);
        return { success: true, action: 'place_block_at', position: { x: params.x, y: params.y, z: params.z } };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: 'activate_block',
    description: 'Right-click / activate the block being looked at (open chest, door, etc.)',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      const block = bot.blockAtCursor(6);
      if (!block) return { success: false, error: 'No block in sight' };

      try {
        await bot.activateBlock(block);
        return { success: true, action: 'activate_block', block: block.name, position: { x: block.position.x, y: block.position.y, z: block.position.z } };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  }
];
