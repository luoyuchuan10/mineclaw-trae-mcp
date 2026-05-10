/**
 * tools/inventory.js - Inventory management tools
 */
module.exports = (botClient) => [
  {
    name: 'get_inventory',
    description: 'Get the full list of items in the bot inventory',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      const items = bot.inventory.items().map(item => ({
        name: item.name,
        displayName: item.name.replace(/_/g, ' '),
        count: item.count,
        slot: item.slot,
        durability: item.durability,
        enchantments: item.nbt ? [] : undefined
      }));
      return { success: true, count: items.length, items };
    }
  },
  {
    name: 'get_held_item',
    description: 'Get info about the item currently held in the bot hand',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      const item = bot.heldItem;
      if (!item) return { success: true, heldItem: null, message: 'No item in hand' };
      return {
        success: true,
        heldItem: {
          name: item.name,
          displayName: item.name.replace(/_/g, ' '),
          count: item.count,
          slot: item.slot,
          durability: item.durability
        }
      };
    }
  },
  {
    name: 'set_hotbar_slot',
    description: 'Switch to a specific hotbar slot (1-9)',
    inputSchema: {
      type: 'object',
      properties: { slot: { type: 'number', description: 'Hotbar slot 1-9' } },
      required: ['slot']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const slot = Math.max(0, Math.min(8, (params.slot || 1) - 1));
      bot.setQuickBarSlot(slot);
      return { success: true, action: 'set_hotbar_slot', slot: slot + 1 };
    }
  },
  {
    name: 'equip_item',
    description: 'Equip an item from inventory to a specific destination (hand, head, torso, legs, feet, off-hand)',
    inputSchema: {
      type: 'object',
      properties: {
        itemName: { type: 'string', description: 'Item name to equip' },
        destination: { type: 'string', description: 'Destination: hand, head, torso, legs, feet, off-hand' }
      },
      required: ['itemName', 'destination']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const item = bot.inventory.items().find(i => i.name === params.itemName);
      if (!item) return { success: false, error: `Item "${params.itemName}" not found in inventory` };

      try {
        await bot.equip(item, params.destination);
        return { success: true, action: 'equip_item', item: params.itemName, destination: params.destination };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: 'unequip',
    description: 'Unequip item from a specific slot',
    inputSchema: {
      type: 'object',
      properties: { destination: { type: 'string', description: 'Destination: hand, head, torso, legs, feet, off-hand' } },
      required: ['destination']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      try {
        await bot.unequip(params.destination);
        return { success: true, action: 'unequip', destination: params.destination };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: 'toss_item',
    description: 'Drop items from inventory',
    inputSchema: {
      type: 'object',
      properties: {
        itemName: { type: 'string', description: 'Item name to toss' },
        count: { type: 'number', description: 'Number to toss (default 1)' }
      },
      required: ['itemName']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const item = bot.inventory.items().find(i => i.name === params.itemName);
      if (!item) return { success: false, error: `Item "${params.itemName}" not found` };

      try {
        if (params.count >= item.count) {
          await bot.tossStack(item);
        } else {
          await bot.toss(params.itemName, params.count || 1);
        }
        return { success: true, action: 'toss_item', item: params.itemName, count: params.count || item.count };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: 'get_item_count',
    description: 'Get the count of a specific item in inventory',
    inputSchema: {
      type: 'object',
      properties: { itemName: { type: 'string', description: 'Item name to count' } },
      required: ['itemName']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      const items = bot.inventory.items().filter(i => i.name === params.itemName);
      const totalCount = items.reduce((sum, i) => sum + i.count, 0);
      return { success: true, itemName: params.itemName, count: totalCount, stacks: items.length };
    }
  },
  {
    name: 'get_equipment',
    description: 'Get all equipped armor and items',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      const equipment = {
        hand: bot.heldItem ? { name: bot.heldItem.name, count: bot.heldItem.count } : null,
        head: bot.inventory.slots[5] ? { name: bot.inventory.slots[5].name } : null,
        chest: bot.inventory.slots[6] ? { name: bot.inventory.slots[6].name } : null,
        legs: bot.inventory.slots[7] ? { name: bot.inventory.slots[7].name } : null,
        feet: bot.inventory.slots[8] ? { name: bot.inventory.slots[8].name } : null,
        offHand: bot.inventory.slots[45] ? { name: bot.inventory.slots[45].name, count: bot.inventory.slots[45].count } : null
      };
      return { success: true, equipment };
    }
  }
];
