/**
 * tools/craft.js - Crafting and smelting tools
 */
const { Vec3 } = require('vec3');

module.exports = (botClient) => [
  {
    name: 'get_recipes',
    description: 'Get available crafting recipes, optionally filtered by item name',
    inputSchema: {
      type: 'object',
      properties: {
        itemName: { type: 'string', description: 'Filter recipes for this item (optional)' },
        count: { type: 'number', description: 'How many to craft (for table calculation)' }
      }
    },
    handler: async (params) => {
      const bot = botClient.bot;
      let recipes;
      if (params.itemName) {
        recipes = bot.recipesFor(params.itemName, null, 1, null);
      } else {
        // Return all available recipes (first 50)
        const allItems = bot.inventory.items();
        const recipeMap = new Map();
        for (const item of allItems) {
          const itemRecipes = bot.recipesFor(item.name, null, 1, null);
          if (itemRecipes.length > 0) {
            recipeMap.set(item.name, itemRecipes.length);
          }
        }
        recipes = null; // Cannot list all, return summary
        return {
          success: true,
          craftableItems: Object.fromEntries(recipeMap),
          totalCraftableTypes: recipeMap.size
        };
      }

      if (!recipes || recipes.length === 0) {
        return { success: false, error: `No recipes found for "${params.itemName}"` };
      }

      return {
        success: true,
        itemName: params.itemName,
        recipeCount: recipes.length,
        recipes: recipes.slice(0, 10).map((r, i) => ({
          index: i,
          inTable: r.requiresTable,
          result: r.result
        }))
      };
    }
  },
  {
    name: 'craft',
    description: 'Craft an item by name',
    inputSchema: {
      type: 'object',
      properties: {
        itemName: { type: 'string', description: 'Item to craft' },
        count: { type: 'number', description: 'How many to craft (default 1)' },
        recipeIndex: { type: 'number', description: 'Recipe index if multiple (default 0)' }
      },
      required: ['itemName']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const count = params.count || 1;
      const recipeIndex = params.recipeIndex || 0;

      const recipes = bot.recipesFor(params.itemName, null, count, null);
      if (!recipes || recipes.length === 0) {
        return { success: false, error: `No recipes found for "${params.itemName}" or missing ingredients` };
      }

      const recipe = recipes[Math.min(recipeIndex, recipes.length - 1)];

      // If requires crafting table, find one
      if (recipe.requiresTable) {
        const craftingTable = bot.findBlock({ matching: 'crafting_table', maxDistance: 32 });
        if (!craftingTable) {
          return { success: false, error: 'Crafting table required but not found nearby' };
        }
        try {
          await bot.craft(recipe, count, craftingTable);
          return { success: true, action: 'craft', item: params.itemName, count, usedTable: true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      } else {
        try {
          await bot.craft(recipe, count, null);
          return { success: true, action: 'craft', item: params.itemName, count, usedTable: false };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
    }
  },
  {
    name: 'craft_with_table',
    description: 'Craft an item using a nearby crafting table',
    inputSchema: {
      type: 'object',
      properties: {
        itemName: { type: 'string', description: 'Item to craft' },
        count: { type: 'number', description: 'How many to craft (default 1)' }
      },
      required: ['itemName']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const craftingTable = bot.findBlock({ matching: 'crafting_table', maxDistance: 32 });
      if (!craftingTable) return { success: false, error: 'No crafting table found nearby' };

      const recipes = bot.recipesFor(params.itemName, null, params.count || 1, craftingTable);
      if (!recipes || recipes.length === 0) return { success: false, error: `Cannot craft "${params.itemName}" with available ingredients` };

      try {
        await bot.craft(recipes[0], params.count || 1, craftingTable);
        return { success: true, action: 'craft_with_table', item: params.itemName, count: params.count || 1 };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: 'smelt',
    description: 'Smelt an item in a nearby furnace',
    inputSchema: {
      type: 'object',
      properties: {
        itemName: { type: 'string', description: 'Item to smelt (e.g. iron_ore)' },
        count: { type: 'number', description: 'How many to smelt (default 1)' }
      },
      required: ['itemName']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const furnace = bot.findBlock({ matching: ['furnace', 'blast_furnace'], maxDistance: 32 });
      if (!furnace) return { success: false, error: 'No furnace found nearby' };

      const item = bot.inventory.items().find(i => i.name === params.itemName);
      if (!item) return { success: false, error: `Item "${params.itemName}" not in inventory` };

      try {
        await bot.openFurnace(furnace).then(async (furnaceWindow) => {
          const count = Math.min(params.count || 1, item.count);
          for (let i = 0; i < count; i++) {
            await furnaceWindow.putInput(item.type, null, 1);
            await new Promise(r => setTimeout(r, 100));
          }
          furnaceWindow.close();
        });
        return { success: true, action: 'smelt', item: params.itemName, count: params.count || 1 };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  }
];
