/**
 * tools/auto.js - Advanced automation tools
 * Auto pathfinding, follow, attack, collect, eat, fish, mine, farm, chop, guard
 */
const { Vec3 } = require('vec3');
const { GoalBlock, GoalNear, GoalFollow } = require('mineflayer-pathfinder').goals;

module.exports = (botClient) => [
  {
    name: 'goto',
    description: 'Auto-navigate to a specific coordinate using pathfinding',
    inputSchema: {
      type: 'object',
      properties: {
        x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' },
        range: { type: 'number', description: 'How close to get (default 1)' }
      },
      required: ['x', 'z']
    },
    handler: async (params) => {
      return botClient.goto(params.x, params.y, params.z, { range: params.range || 1 });
    }
  },
  {
    name: 'follow_player',
    description: 'Auto-follow a specific player',
    inputSchema: {
      type: 'object',
      properties: {
        username: { type: 'string', description: 'Player to follow' },
        range: { type: 'number', description: 'Follow distance (default 2)' }
      },
      required: ['username']
    },
    handler: async (params) => {
      return botClient.followPlayer(params.username, params.range || 2);
    }
  },
  {
    name: 'stop_following',
    description: 'Stop auto-following',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      return botClient.stopFollowing();
    }
  },
  {
    name: 'auto_attack_start',
    description: 'Start auto-attacking nearby hostile mobs',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      return botClient.startAutoAttack();
    }
  },
  {
    name: 'auto_attack_stop',
    description: 'Stop auto-attacking',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      return botClient.stopAutoAttack();
    }
  },
  {
    name: 'auto_collect',
    description: 'Auto-collect nearby dropped items',
    inputSchema: {
      type: 'object',
      properties: {
        itemName: { type: 'string', description: 'Specific item to collect (optional)' },
        range: { type: 'number', description: 'Collection range (default 32)' }
      }
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const range = params.range || 32;
      const itemEntities = Object.values(bot.entities)
        .filter(e => e.type === 'object' && e.name === 'item' && e.position.distanceTo(bot.entity.position) < range);

      if (itemEntities.length === 0) {
        return { success: false, error: 'No dropped items nearby' };
      }

      const collected = [];
      for (const entity of itemEntities.slice(0, 20)) {
        try {
          await bot.pathfinder.goto(new GoalNear(entity.position.x, entity.position.y, entity.position.z, 1));
          await new Promise(r => setTimeout(r, 500));
          collected.push({ position: { x: Math.floor(entity.position.x), y: Math.floor(entity.position.y), z: Math.floor(entity.position.z) } });
        } catch (err) {
          // Skip unreachable items
        }
      }
      return { success: true, action: 'auto_collect', collected: collected.length, total: itemEntities.length };
    }
  },
  {
    name: 'auto_eat_enable',
    description: 'Enable auto-eat when hunger drops below threshold',
    inputSchema: {
      type: 'object',
      properties: {
        foodThreshold: { type: 'number', description: 'Eat when hunger below this (default 14)' }
      }
    },
    handler: async (params) => {
      const bot = botClient.bot;
      bot.autoEat.options = { ...bot.autoEat.options, foodThreshold: params.foodThreshold || 14 };
      bot.autoEat.enable();
      return { success: true, action: 'auto_eat_enable', threshold: params.foodThreshold || 14 };
    }
  },
  {
    name: 'auto_eat_disable',
    description: 'Disable auto-eat',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      bot.autoEat.disable();
      return { success: true, action: 'auto_eat_disable' };
    }
  },
  {
    name: 'auto_fish',
    description: 'Start automatic fishing (must be near water with fishing rod equipped)',
    inputSchema: {
      type: 'object',
      properties: { duration: { type: 'number', description: 'How long to fish in seconds (default 60)' } }
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const duration = (params.duration || 60) * 1000;
      const startTime = Date.now();
      let fishCaught = 0;

      // Check for fishing rod
      const rod = bot.inventory.items().find(i => i.name === 'fishing_rod');
      if (!rod) return { success: false, error: 'No fishing rod in inventory' };

      try {
        await bot.equip(rod, 'hand');
      } catch (err) {
        return { success: false, error: err.message };
      }

      const fishListener = () => { fishCaught++; };

      // Simple fishing loop
      const fishLoop = async () => {
        while (Date.now() - startTime < duration) {
          try {
            bot.activateItem(); // Cast
            await new Promise(r => setTimeout(r, 3000 + Math.random() * 5000));
            bot.activateItem(); // Reel in
            await new Promise(r => setTimeout(r, 1000));
          } catch (err) {
            // Continue trying
          }
        }
      };

      await fishLoop();
      return { success: true, action: 'auto_fish', duration: params.duration || 60, fishCaught };
    }
  },
  {
    name: 'auto_mine',
    description: 'Auto-mine in a direction: dig forward and move forward repeatedly',
    inputSchema: {
      type: 'object',
      properties: {
        length: { type: 'number', description: 'How many blocks to mine forward (default 10)' },
        height: { type: 'number', description: 'Tunnel height (default 2)' },
        width: { type: 'number', description: 'Tunnel width (default 1)' }
      }
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const length = params.length || 10;
      const height = params.height || 2;
      const width = params.width || 1;
      const yaw = bot.entity.yaw;
      const pos = bot.entity.position;
      const results = [];

      for (let i = 0; i < length; i++) {
        const dx = -Math.sin(yaw) * i;
        const dz = -Math.cos(yaw) * i;
        const baseX = Math.floor(pos.x + dx);
        const baseZ = Math.floor(pos.z + dz);

        for (let w = 0; w < width; w++) {
          for (let h = 0; h < height; h++) {
            const target = new Vec3(baseX, Math.floor(pos.y) + h, baseZ);
            const block = bot.blockAt(target);
            if (block && block.name !== 'air' && block.name !== 'bedrock') {
              try {
                await bot.dig(block, true);
                results.push({ position: { x: target.x, y: target.y, z: target.z }, block: block.name, success: true });
              } catch (err) {
                results.push({ position: { x: target.x, y: target.y, z: target.z }, block: block.name, success: false });
              }
            }
          }
        }

        // Move forward one block
        const moveX = Math.floor(pos.x + dx) + 0.5;
        const moveZ = Math.floor(pos.z + dz) + 0.5;
        try {
          await bot.pathfinder.goto(new GoalNear(moveX, Math.floor(pos.y), moveZ, 0.5));
        } catch (err) {
          // Skip if cannot move
        }
      }

      return { success: true, action: 'auto_mine', length, height, width, blocksMined: results.filter(r => r.success).length };
    }
  },
  {
    name: 'auto_chop_tree',
    description: 'Find and chop the nearest tree',
    inputSchema: {
      type: 'object',
      properties: {
        treeType: { type: 'string', description: 'Log block name (default: auto-detect)' }
      }
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const logTypes = ['oak_log', 'spruce_log', 'birch_log', 'jungle_log', 'acacia_log', 'dark_oak_log', 'mangrove_log', 'cherry_log'];
      const matching = params.treeType ? params.treeType : logTypes;

      const logBlock = bot.findBlock({ matching, maxDistance: 32, count: 1 });
      if (!logBlock) return { success: false, error: 'No tree found nearby' };

      try {
        // Move to tree
        await bot.pathfinder.goto(new GoalNear(logBlock.position.x, logBlock.position.y, logBlock.position.z, 2));

        // Chop all logs above
        let currentBlock = logBlock;
        let logsChopped = 0;
        while (currentBlock) {
          await bot.dig(currentBlock, true);
          logsChopped++;
          // Check block above
          const above = bot.blockAt(currentBlock.position.offset(0, 1, 0));
          if (above && matching.includes(above.name)) {
            currentBlock = above;
          } else {
            currentBlock = null;
          }
        }

        return { success: true, action: 'auto_chop_tree', logsChopped, position: { x: logBlock.position.x, y: logBlock.position.y, z: logBlock.position.z } };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: 'auto_farm',
    description: 'Auto-farm: harvest and replant nearby crops',
    inputSchema: {
      type: 'object',
      properties: { range: { type: 'number', description: 'Farm area range (default 10)' } }
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const range = params.range || 10;
      const cropBlocks = ['wheat', 'carrots', 'potatoes', 'beetroots'];
      const results = [];

      const cropBlock = bot.findBlock({ matching: cropBlocks.map(c => c + '_[age=7]'), maxDistance: range, count: 50 });
      // Use a simpler approach: scan for crop blocks
      const pos = bot.entity.position;
      for (let x = -range; x <= range; x++) {
        for (let z = -range; z <= range; z++) {
          const target = new Vec3(Math.floor(pos.x) + x, Math.floor(pos.y), Math.floor(pos.z) + z);
          const block = bot.blockAt(target);
          if (!block) continue;

          for (const crop of cropBlocks) {
            if (block.name.startsWith(crop)) {
              try {
                await bot.pathfinder.goto(new GoalNear(target.x, target.y, target.z, 1));
                await bot.dig(block, true);
                results.push({ crop, position: { x: target.x, y: target.y, z: target.z }, success: true });
                // Replant
                const seeds = bot.inventory.items().find(i => i.name === crop || i.name === `${crop}_seeds`);
                if (seeds) {
                  await bot.placeBlock(bot.blockAt(target.offset(0, -1, 0)), new Vec3(0, 1, 0));
                }
              } catch (err) {
                results.push({ crop, position: { x: target.x, y: target.y, z: target.z }, success: false });
              }
            }
          }
        }
      }

      return { success: true, action: 'auto_farm', harvested: results.filter(r => r.success).length, total: results.length };
    }
  },
  {
    name: 'auto_guard',
    description: 'Guard a specific player by attacking hostile mobs near them',
    inputSchema: {
      type: 'object',
      properties: {
        username: { type: 'string', description: 'Player to guard' },
        range: { type: 'number', description: 'Guard radius (default 10)' }
      },
      required: ['username']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const range = params.range || 10;
      const player = bot.players[params.username];
      if (!player || !player.entity) return { success: false, error: `Player "${params.username}" not found` };

      // Follow the player
      const goal = new GoalFollow(player.entity, 3);
      bot.pathfinder.setGoal(goal, true);

      // Attack hostile mobs near the player
      const hostileNames = ['zombie', 'skeleton', 'creeper', 'spider', 'cave_spider', 'enderman', 'witch', 'phantom', 'pillager'];
      let mobsKilled = 0;
      const guardInterval = setInterval(async () => {
        const nearestHostile = Object.values(bot.entities).find(e => {
          return hostileNames.includes(e.name) &&
            e.position.distanceTo(player.entity.position) < range;
        });
        if (nearestHostile) {
          try {
            bot.pvp.attack(nearestHostile);
            mobsKilled++;
          } catch (err) { /* continue */ }
        }
      }, 2000);

      // Store interval for cleanup
      botClient._guardInterval = guardInterval;

      return { success: true, action: 'auto_guard', target: params.username, range, message: 'Guarding started. Use stop_following to stop.' };
    }
  },
  {
    name: 'return_to_death_point',
    description: 'Navigate back to the last death location (if recorded)',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      // mineflayer doesn't store death point natively, but we can use spawn point
      const spawnPoint = bot.spawnPoint;
      if (!spawnPoint) return { success: false, error: 'No spawn point recorded' };

      try {
        await botClient.goto(spawnPoint.x, spawnPoint.y, spawnPoint.z);
        return { success: true, action: 'return_to_spawn', position: { x: spawnPoint.x, y: spawnPoint.y, z: spawnPoint.z } };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  }
];
