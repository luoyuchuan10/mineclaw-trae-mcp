/**
 * tools/dig.js - Digging / mining tools
 */
const { Vec3 } = require('vec3');

module.exports = (botClient) => [
  {
    name: 'dig',
    description: 'Dig the block the bot is currently looking at',
    inputSchema: {
      type: 'object',
      properties: {
        timeout: { type: 'number', description: 'Max dig time in ms (default 10000)' }
      }
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const block = bot.blockAtCursor(6);
      if (!block) return { success: false, error: 'No block in sight to dig' };

      try {
        await bot.dig(block, true);
        return { success: true, action: 'dig', block: block.name, position: { x: block.position.x, y: block.position.y, z: block.position.z } };
      } catch (err) {
        return { success: false, error: err.message, block: block.name };
      }
    }
  },
  {
    name: 'dig_at',
    description: 'Dig a block at a specific coordinate',
    inputSchema: {
      type: 'object',
      properties: {
        x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' },
        timeout: { type: 'number', description: 'Max dig time in ms (default 10000)' }
      },
      required: ['x', 'y', 'z']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const target = new Vec3(params.x, params.y, params.z);
      const block = bot.blockAt(target);
      if (!block || block.name === 'air') return { success: false, error: 'No block at target position' };

      try {
        // Move to within range if needed
        const dist = block.position.distanceTo(bot.entity.position);
        if (dist > 5) {
          await botClient.goto(params.x, params.y, params.z, { range: 3 });
        }
        await bot.dig(block, true);
        return { success: true, action: 'dig_at', block: block.name, position: { x: params.x, y: params.y, z: params.z } };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: 'dig_by_type',
    description: 'Find and dig the nearest block of a specific type',
    inputSchema: {
      type: 'object',
      properties: {
        blockName: { type: 'string', description: 'Block name to find and dig (e.g. diamond_ore)' },
        range: { type: 'number', description: 'Search range (default 64)' }
      },
      required: ['blockName']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const block = bot.findBlock({ matching: params.blockName, maxDistance: params.range || 64, count: 1 });
      if (!block) return { success: false, error: `Block "${params.blockName}" not found within range` };

      try {
        await botClient.goto(block.position.x, block.position.y, block.position.z, { range: 3 });
        await bot.dig(block, true);
        return { success: true, action: 'dig_by_type', block: block.name, position: { x: block.position.x, y: block.position.y, z: block.position.z } };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: 'dig_line',
    description: 'Dig a straight line of blocks in the current look direction',
    inputSchema: {
      type: 'object',
      properties: {
        length: { type: 'number', description: 'Number of blocks to dig (default 5)' },
        direction: { type: 'string', description: 'Direction: forward, up, down (default forward)' }
      }
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const length = params.length || 5;
      const direction = params.direction || 'forward';
      const yaw = bot.entity.yaw;
      const pos = bot.entity.position;
      const results = [];

      for (let i = 1; i <= length; i++) {
        let target;
        if (direction === 'forward') {
          const dx = -Math.sin(yaw) * i;
          const dz = -Math.cos(yaw) * i;
          target = new Vec3(Math.floor(pos.x + dx), Math.floor(pos.y), Math.floor(pos.z + dz));
        } else if (direction === 'up') {
          target = new Vec3(Math.floor(pos.x), Math.floor(pos.y + i), Math.floor(pos.z));
        } else if (direction === 'down') {
          target = new Vec3(Math.floor(pos.x), Math.floor(pos.y - i), Math.floor(pos.z));
        }

        const block = bot.blockAt(target);
        if (!block || block.name === 'air' || block.name === 'bedrock') continue;

        try {
          await bot.dig(block, true);
          results.push({ position: { x: target.x, y: target.y, z: target.z }, block: block.name, success: true });
        } catch (err) {
          results.push({ position: { x: target.x, y: target.y, z: target.z }, block: block.name, success: false, error: err.message });
        }
      }

      return { success: true, action: 'dig_line', direction, length, results };
    }
  },
  {
    name: 'dig_pit',
    description: 'Dig a pit (hole) of specified width and depth at current position',
    inputSchema: {
      type: 'object',
      properties: {
        width: { type: 'number', description: 'Pit width (default 3)' },
        depth: { type: 'number', description: 'Pit depth in blocks (default 3)' }
      }
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const width = params.width || 3;
      const depth = params.depth || 3;
      const pos = bot.entity.position;
      const halfW = Math.floor(width / 2);
      const results = [];

      for (let x = -halfW; x <= halfW; x++) {
        for (let z = -halfW; z <= halfW; z++) {
          for (let y = 0; y < depth; y++) {
            const target = new Vec3(Math.floor(pos.x) + x, Math.floor(pos.y) - y, Math.floor(pos.z) + z);
            const block = bot.blockAt(target);
            if (!block || block.name === 'air' || block.name === 'bedrock') continue;

            try {
              await botClient.goto(target.x, target.y + 1, target.z, { range: 3 });
              await bot.dig(block, true);
              results.push({ position: { x: target.x, y: target.y, z: target.z }, block: block.name, success: true });
            } catch (err) {
              results.push({ position: { x: target.x, y: target.y, z: target.z }, block: block.name, success: false, error: err.message });
            }
          }
        }
      }

      return { success: true, action: 'dig_pit', width, depth, blocksDug: results.filter(r => r.success).length, results };
    }
  },
  {
    name: 'stop_digging',
    description: 'Cancel any ongoing dig operation',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      bot.stopDigging();
      return { success: true, action: 'stop_digging' };
    }
  }
];
