/**
 * tools/position.js - Position and coordinate query tools
 */
module.exports = (botClient) => [
  {
    name: 'get_position',
    description: 'Get the bot current position (x, y, z)',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const pos = botClient.position;
      return {
        success: true,
        x: pos.x, y: pos.y, z: pos.z,
        formatted: `X: ${pos.x.toFixed(2)}, Y: ${pos.y.toFixed(2)}, Z: ${pos.z.toFixed(2)}`
      };
    }
  },
  {
    name: 'get_rotation',
    description: 'Get the bot current facing direction (yaw, pitch in degrees)',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const yaw = botClient.yaw * (180 / Math.PI);
      const pitch = botClient.pitch * (180 / Math.PI);
      return {
        success: true,
        yaw: Math.round(yaw * 100) / 100,
        pitch: Math.round(pitch * 100) / 100,
        direction: yawToDirection(yaw)
      };
    }
  },
  {
    name: 'get_block_position',
    description: 'Get the block coordinate (integer floored position)',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const pos = botClient.position;
      return {
        success: true,
        blockX: Math.floor(pos.x),
        blockY: Math.floor(pos.y),
        blockZ: Math.floor(pos.z)
      };
    }
  },
  {
    name: 'get_biome',
    description: 'Get the biome the bot is currently in',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      const pos = bot.entity.position;
      const block = bot.blockAt(pos);
      return {
        success: true,
        biome: block?.biome?.name || 'unknown',
        position: { x: Math.floor(pos.x), y: Math.floor(pos.y), z: Math.floor(pos.z) }
      };
    }
  },
  {
    name: 'get_dimension',
    description: 'Get the current dimension (overworld, nether, end)',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      return { success: true, dimension: bot.game.dimension };
    }
  },
  {
    name: 'get_ground_height',
    description: 'Get the highest non-air block Y at the bot XZ position',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      const pos = bot.entity.position;
      const bx = Math.floor(pos.x);
      const bz = Math.floor(pos.z);
      let groundY = 0;
      for (let y = 320; y >= -64; y--) {
        const block = bot.blockAt(new (require('vec3'))(bx, y, bz));
        if (block && block.name !== 'air') {
          groundY = y;
          break;
        }
      }
      return { success: true, groundY, botY: Math.floor(pos.y) };
    }
  },
  {
    name: 'get_block_below',
    description: 'Get the block directly below the bot feet',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      const block = bot.blockAt(bot.entity.position.offset(0, -1, 0));
      return {
        success: true,
        block: block ? block.name : 'unknown',
        position: block ? { x: block.position.x, y: block.position.y, z: block.position.z } : null
      };
    }
  },
  {
    name: 'get_block_above',
    description: 'Get the block directly above the bot head',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      const block = bot.blockAt(bot.entity.position.offset(0, 2, 0));
      return {
        success: true,
        block: block ? block.name : 'air',
        position: block ? { x: block.position.x, y: block.position.y, z: block.position.z } : null
      };
    }
  },
  {
    name: 'get_block_at',
    description: 'Get block info at a specific coordinate',
    inputSchema: {
      type: 'object',
      properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } },
      required: ['x', 'y', 'z']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const block = bot.blockAt(new (require('vec3'))(params.x, params.y, params.z));
      if (!block) return { success: false, error: 'Cannot read block at position (chunk not loaded?)' };
      return {
        success: true,
        name: block.name,
        position: { x: block.position.x, y: block.position.y, z: block.position.z },
        biome: block.biome?.name || 'unknown'
      };
    }
  }
];

function yawToDirection(yaw) {
  yaw = ((yaw % 360) + 360) % 360;
  if (yaw >= 337.5 || yaw < 22.5) return 'South (+Z)';
  if (yaw < 67.5) return 'Southwest';
  if (yaw < 112.5) return 'West (-X)';
  if (yaw < 157.5) return 'Northwest';
  if (yaw < 202.5) return 'North (-Z)';
  if (yaw < 247.5) return 'Northeast';
  if (yaw < 292.5) return 'East (+X)';
  return 'Southeast';
}
