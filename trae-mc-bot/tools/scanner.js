/**
 * tools/scanner.js - Surrounding scan tools
 */
const Scanner = require('../scanner');

module.exports = (botClient) => {
  const scanner = new Scanner(botClient);

  return [
    {
      name: 'scan_entities',
      description: 'Scan and list all nearby entities with type, distance, and direction',
      inputSchema: {
        type: 'object',
        properties: { range: { type: 'number', description: 'Scan range in blocks (default 30)' } }
      },
      handler: async (params) => scanner.scanEntities(params.range || 30)
    },
    {
      name: 'scan_players',
      description: 'Scan and list all nearby players with name, distance, sneaking/sprinting status',
      inputSchema: {
        type: 'object',
        properties: { range: { type: 'number', description: 'Scan range (default 50)' } }
      },
      handler: async (params) => scanner.scanPlayers(params.range || 50)
    },
    {
      name: 'scan_blocks',
      description: 'Scan blocks in a radius around the bot and list block type distribution',
      inputSchema: {
        type: 'object',
        properties: { radius: { type: 'number', description: 'Scan radius (default 5)' } }
      },
      handler: async (params) => scanner.scanBlocks(params.radius || 5)
    },
    {
      name: 'scan_hostile_mobs',
      description: 'Scan for nearby hostile mobs (zombies, skeletons, creepers, etc.)',
      inputSchema: {
        type: 'object',
        properties: { range: { type: 'number', description: 'Scan range (default 30)' } }
      },
      handler: async (params) => scanner.scanHostileMobs(params.range || 30)
    },
    {
      name: 'scan_animals',
      description: 'Scan for nearby passive/friendly mobs',
      inputSchema: {
        type: 'object',
        properties: { range: { type: 'number', description: 'Scan range (default 30)' } }
      },
      handler: async (params) => scanner.scanAnimals(params.range || 30)
    },
    {
      name: 'scan_dropped_items',
      description: 'Scan for nearby dropped items on the ground',
      inputSchema: {
        type: 'object',
        properties: { range: { type: 'number', description: 'Scan range (default 20)' } }
      },
      handler: async (params) => scanner.scanDroppedItems(params.range || 20)
    },
    {
      name: 'find_nearest_chest',
      description: 'Find the nearest chest',
      inputSchema: {
        type: 'object',
        properties: { range: { type: 'number', description: 'Search range (default 50)' } }
      },
      handler: async (params) => scanner.findNearestChest(params.range || 50)
    },
    {
      name: 'find_nearest_crafting_table',
      description: 'Find the nearest crafting table',
      inputSchema: {
        type: 'object',
        properties: { range: { type: 'number', description: 'Search range (default 50)' } }
      },
      handler: async (params) => scanner.findNearestCraftingTable(params.range || 50)
    },
    {
      name: 'find_nearest_furnace',
      description: 'Find the nearest furnace',
      inputSchema: {
        type: 'object',
        properties: { range: { type: 'number', description: 'Search range (default 50)' } }
      },
      handler: async (params) => scanner.findNearestFurnace(params.range || 50)
    },
    {
      name: 'find_nearest_anvil',
      description: 'Find the nearest anvil',
      inputSchema: {
        type: 'object',
        properties: { range: { type: 'number', description: 'Search range (default 50)' } }
      },
      handler: async (params) => scanner.findNearestAnvil(params.range || 50)
    },
    {
      name: 'find_nearest_block',
      description: 'Find the nearest block of a specific type',
      inputSchema: {
        type: 'object',
        properties: {
          blockName: { type: 'string', description: 'Block name to search for' },
          range: { type: 'number', description: 'Search range (default 64)' }
        },
        required: ['blockName']
      },
      handler: async (params) => scanner.findNearestBlock(params.blockName, params.range || 64)
    },
    {
      name: 'scan_dangers',
      description: 'Scan for nearby dangers: lava, fire, cliffs, creepers',
      inputSchema: {
        type: 'object',
        properties: { range: { type: 'number', description: 'Scan range (default 15)' } }
      },
      handler: async (params) => scanner.scanDangers(params.range || 15)
    }
  ];
};
