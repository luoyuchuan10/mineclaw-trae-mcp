/**
 * tools/look.js - View angle control tools
 */
const { Vec3 } = require('vec3');

module.exports = (botClient) => [
  {
    name: 'look_at',
    description: 'Look at a specific world coordinate',
    inputSchema: {
      type: 'object',
      properties: {
        x: { type: 'number', description: 'X coordinate' },
        y: { type: 'number', description: 'Y coordinate' },
        z: { type: 'number', description: 'Z coordinate' }
      },
      required: ['x', 'y', 'z']
    },
    handler: async (params) => {
      return botClient.lookAt(params.x, params.y, params.z);
    }
  },
  {
    name: 'look_at_player',
    description: 'Look at a specific player by username',
    inputSchema: {
      type: 'object',
      properties: { username: { type: 'string', description: 'Player username' } },
      required: ['username']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const player = bot.players[params.username];
      if (!player || !player.entity) {
        return { success: false, error: `Player "${params.username}" not found or not visible` };
      }
      bot.lookAt(player.entity.position.offset(0, player.entity.height / 2, 0));
      return { success: true, action: 'look_at_player', target: params.username };
    }
  },
  {
    name: 'look_at_nearest_entity',
    description: 'Look at the nearest entity',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      const entity = bot.nearestEntity();
      if (!entity) {
        return { success: false, error: 'No entities nearby' };
      }
      bot.lookAt(entity.position.offset(0, entity.height / 2, 0));
      return {
        success: true,
        action: 'look_at_nearest_entity',
        entity: entity.name || entity.username,
        distance: Math.round(entity.position.distanceTo(bot.entity.position) * 10) / 10
      };
    }
  },
  {
    name: 'look_at_nearest_block',
    description: 'Look at the block the bot is currently targeting (raycast)',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      const block = bot.blockAtCursor(6);
      if (!block) {
        return { success: false, error: 'No block in sight' };
      }
      bot.lookAt(block.position.offset(0.5, 0.5, 0.5));
      return {
        success: true,
        action: 'look_at_nearest_block',
        block: block.name,
        position: { x: block.position.x, y: block.position.y, z: block.position.z }
      };
    }
  },
  {
    name: 'turn',
    description: 'Turn horizontally by a specified number of degrees (positive = left, negative = right)',
    inputSchema: {
      type: 'object',
      properties: {
        degrees: { type: 'number', description: 'Degrees to turn (positive=left, negative=right)' }
      },
      required: ['degrees']
    },
    handler: async (params) => {
      if (params.degrees >= 0) return botClient.turnLeft(params.degrees);
      return botClient.turnRight(Math.abs(params.degrees));
    }
  },
  {
    name: 'look_up',
    description: 'Look up by specified degrees',
    inputSchema: {
      type: 'object',
      properties: { degrees: { type: 'number', description: 'Degrees to look up (default 30)' } }
    },
    handler: async (params) => {
      return botClient.lookUp(params.degrees || 30);
    }
  },
  {
    name: 'look_down',
    description: 'Look down by specified degrees',
    inputSchema: {
      type: 'object',
      properties: { degrees: { type: 'number', description: 'Degrees to look down (default 30)' } }
    },
    handler: async (params) => {
      return botClient.lookDown(params.degrees || 30);
    }
  },
  {
    name: 'reset_look',
    description: 'Reset view to face south at horizontal level',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      return botClient.resetLook();
    }
  },
  {
    name: 'look_around',
    description: 'Slowly rotate 360 degrees to scan surroundings',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      return botClient.lookAround();
    }
  }
];
