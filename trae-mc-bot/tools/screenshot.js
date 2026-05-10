/**
 * tools/screenshot.js - Screenshot and visual tools
 */
module.exports = (botClient, screenshotManager) => [
  {
    name: 'screenshot',
    description: 'Take a screenshot of the current game view and save to file',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      return screenshotManager.captureScreenshot();
    }
  },
  {
    name: 'screenshot_and_describe',
    description: 'Take a screenshot and generate a text description of the scene',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      return screenshotManager.captureAndDescribe();
    }
  },
  {
    name: 'start_realtime_view',
    description: 'Start continuous screenshot streaming (1 screenshot per second)',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      return screenshotManager.startRealtimeView((screenshot) => {
        // Broadcast via MCP server event
        botClient.emit('screenshot', screenshot);
      });
    }
  },
  {
    name: 'stop_realtime_view',
    description: 'Stop continuous screenshot streaming',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      return screenshotManager.stopRealtimeView();
    }
  },
  {
    name: 'look_and_screenshot',
    description: 'Look in a direction and take a screenshot',
    inputSchema: {
      type: 'object',
      properties: {
        direction: { type: 'string', description: 'Direction: north, south, east, west, up, down' }
      },
      required: ['direction']
    },
    handler: async (params) => {
      return screenshotManager.lookAndScreenshot(params.direction);
    }
  },
  {
    name: 'look_at_and_screenshot',
    description: 'Look at a coordinate and take a screenshot',
    inputSchema: {
      type: 'object',
      properties: {
        x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' }
      },
      required: ['x', 'y', 'z']
    },
    handler: async (params) => {
      return screenshotManager.lookAtAndScreenshot(params.x, params.y, params.z);
    }
  },
  {
    name: 'view_self',
    description: 'Switch to third-person view and take a screenshot of the bot appearance',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      return screenshotManager.viewSelf();
    }
  },
  {
    name: 'get_screenshot_list',
    description: 'List all saved screenshots',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number', description: 'Max number to list (default 20)' } }
    },
    handler: async (params) => {
      return screenshotManager.getScreenshotList(params.limit || 20);
    }
  },
  {
    name: 'clear_screenshots',
    description: 'Delete all saved screenshots',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      return screenshotManager.clearScreenshots();
    }
  }
];
