/**
 * tools/world.js - World and environment query tools
 */
module.exports = (botClient) => [
  {
    name: 'get_time',
    description: 'Get the current world time (ticks, day/night)',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      const time = bot.time.timeOfDay;
      const day = bot.time.isDay;
      const ticks = bot.time.age;
      return {
        success: true,
        timeOfDay: Math.floor(time),
        ticks,
        isDay: day,
        period: day ? 'Day' : 'Night',
        // Approximate real-world hours (0=6am, 6000=noon, 12000=6pm, 18000=midnight)
        approximateHour: Math.floor((time / 1000) + 6) % 24
      };
    }
  },
  {
    name: 'get_weather',
    description: 'Get the current weather condition',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      return {
        success: true,
        raining: bot.game.rainState > 0,
        thundering: bot.game.thunderState > 0,
        weather: bot.game.rainState > 0 ? (bot.game.thunderState > 0 ? 'thunderstorm' : 'rain') : 'clear'
      };
    }
  },
  {
    name: 'get_difficulty',
    description: 'Get the current game difficulty',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      const difficulties = ['peaceful', 'easy', 'normal', 'hard'];
      return {
        success: true,
        difficulty: difficulties[bot.game.difficulty] || 'unknown',
        difficultyLevel: bot.game.difficulty
      };
    }
  },
  {
    name: 'get_game_mode',
    description: 'Get the current game mode',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      const modes = ['survival', 'creative', 'adventure', 'spectator'];
      return {
        success: true,
        gameMode: modes[bot.game.gameMode] || 'unknown',
        gameModeId: bot.game.gameMode
      };
    }
  },
  {
    name: 'set_time',
    description: 'Set the world time (requires OP)',
    inputSchema: {
      type: 'object',
      properties: {
        time: { type: 'number', description: 'Time in ticks (0= sunrise, 6000= noon, 12000= sunset, 18000= midnight)' }
      },
      required: ['time']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      try {
        bot.chat(`/time set ${params.time}`);
        return { success: true, action: 'set_time', time: params.time };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: 'set_weather',
    description: 'Set the weather (requires OP)',
    inputSchema: {
      type: 'object',
      properties: {
        weather: { type: 'string', description: 'clear, rain, thunder' }
      },
      required: ['weather']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      try {
        bot.chat(`/weather ${params.weather}`);
        return { success: true, action: 'set_weather', weather: params.weather };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: 'find_structure',
    description: 'Find the nearest structure of a given type (requires OP)',
    inputSchema: {
      type: 'object',
      properties: {
        structure: { type: 'string', description: 'Structure type: village, stronghold, temple, mansion, monument, fortress, end_city, etc.' }
      },
      required: ['structure']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      try {
        bot.chat(`/locate structure ${params.structure}`);
        return { success: true, action: 'find_structure', structure: params.structure, message: 'Command sent, check chat for results' };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: 'find_ore',
    description: 'Search for nearby ore blocks of a specific type',
    inputSchema: {
      type: 'object',
      properties: {
        oreName: { type: 'string', description: 'Ore name (e.g. diamond_ore, iron_ore, gold_ore, coal_ore)' },
        range: { type: 'number', description: 'Search range (default 64)' }
      },
      required: ['oreName']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const block = bot.findBlock({ matching: params.oreName, maxDistance: params.range || 64, count: 1 });
      if (!block) return { success: false, error: `Ore "${params.oreName}" not found within ${params.range || 64} blocks` };

      const dist = block.position.distanceTo(bot.entity.position);
      return {
        success: true,
        ore: block.name,
        position: { x: block.position.x, y: block.position.y, z: block.position.z },
        distance: Math.round(dist * 10) / 10
      };
    }
  },
  {
    name: 'teleport',
    description: 'Teleport to coordinates (requires OP)',
    inputSchema: {
      type: 'object',
      properties: {
        x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' }
      },
      required: ['x', 'y', 'z']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      try {
        bot.chat(`/tp ${bot.username} ${params.x} ${params.y} ${params.z}`);
        return { success: true, action: 'teleport', destination: { x: params.x, y: params.y, z: params.z } };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: 'gamemode',
    description: 'Change game mode (requires OP)',
    inputSchema: {
      type: 'object',
      properties: {
        mode: { type: 'string', description: 'survival, creative, adventure, spectator' }
      },
      required: ['mode']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      try {
        bot.chat(`/gamemode ${params.mode}`);
        return { success: true, action: 'gamemode', mode: params.mode };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  }
];
