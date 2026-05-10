/**
 * tools/movement.js - Movement control tools
 * Forward, back, left, right, jump, sneak, sprint, swim, stop
 */
module.exports = (botClient) => [
  {
    name: 'move_forward',
    description: 'Move the bot forward for a specified duration (ms)',
    inputSchema: {
      type: 'object',
      properties: { duration: { type: 'number', description: 'Duration in ms (default 1000)' } }
    },
    handler: async (params) => {
      return botClient.moveForward(params.duration || 1000);
    }
  },
  {
    name: 'move_back',
    description: 'Move the bot backward for a specified duration (ms)',
    inputSchema: {
      type: 'object',
      properties: { duration: { type: 'number', description: 'Duration in ms (default 1000)' } }
    },
    handler: async (params) => {
      return botClient.moveBack(params.duration || 1000);
    }
  },
  {
    name: 'move_left',
    description: 'Strafe left for a specified duration (ms)',
    inputSchema: {
      type: 'object',
      properties: { duration: { type: 'number', description: 'Duration in ms (default 1000)' } }
    },
    handler: async (params) => {
      return botClient.moveLeft(params.duration || 1000);
    }
  },
  {
    name: 'move_right',
    description: 'Strafe right for a specified duration (ms)',
    inputSchema: {
      type: 'object',
      properties: { duration: { type: 'number', description: 'Duration in ms (default 1000)' } }
    },
    handler: async (params) => {
      return botClient.moveRight(params.duration || 1000);
    }
  },
  {
    name: 'jump',
    description: 'Make the bot jump once',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      return botClient.jump();
    }
  },
  {
    name: 'sneak',
    description: 'Toggle sneak/crouch mode',
    inputSchema: {
      type: 'object',
      properties: { enable: { type: 'boolean', description: 'true to sneak, false to stop sneaking (default true)' } }
    },
    handler: async (params) => {
      return botClient.sneak(params.enable !== false);
    }
  },
  {
    name: 'sprint',
    description: 'Toggle sprint mode',
    inputSchema: {
      type: 'object',
      properties: { enable: { type: 'boolean', description: 'true to sprint, false to stop sprinting (default true)' } }
    },
    handler: async (params) => {
      return botClient.sprint(params.enable !== false);
    }
  },
  {
    name: 'stop_movement',
    description: 'Stop all movement immediately',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      return botClient.stopMovement();
    }
  },
  {
    name: 'swim_up',
    description: 'Swim upward for a specified duration',
    inputSchema: {
      type: 'object',
      properties: { duration: { type: 'number', description: 'Duration in ms (default 1000)' } }
    },
    handler: async (params) => {
      return botClient.swimUp(params.duration || 1000);
    }
  },
  {
    name: 'swim_down',
    description: 'Swim downward (sink) for a specified duration',
    inputSchema: {
      type: 'object',
      properties: { duration: { type: 'number', description: 'Duration in ms (default 1000)' } }
    },
    handler: async (params) => {
      return botClient.swimDown(params.duration || 1000);
    }
  }
];
