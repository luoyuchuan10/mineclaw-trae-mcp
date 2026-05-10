/**
 * index.js - Main entry point for TRAE Minecraft Bot MCP Server
 * Starts the bot, loads all tools, and launches the MCP server
 */

const fs = require('fs-extra');
const path = require('path');
const BotClient = require('./bot-client');
const MCPServer = require('./mcp-server');
const ScreenshotManager = require('./screenshot');

// Load config
const configPath = path.join(__dirname, 'config.json');
const config = fs.readJsonSync(configPath);

// Tool modules
const movementTools = require('./tools/movement');
const lookTools = require('./tools/look');
const digTools = require('./tools/dig');
const placeTools = require('./tools/place');
const attackTools = require('./tools/attack');
const interactTools = require('./tools/interact');
const inventoryTools = require('./tools/inventory');
const craftTools = require('./tools/craft');
const positionTools = require('./tools/position');
const worldTools = require('./tools/world');
const statusTools = require('./tools/status');
const chatTools = require('./tools/chat');
const scannerTools = require('./tools/scanner');
const autoTools = require('./tools/auto');

async function main() {
  console.log('========================================');
  console.log('  TRAE Minecraft Bot - MCP Server');
  console.log('========================================');
  console.log(`[Config] Server: ${config.bot.host}:${config.bot.port}`);
  console.log(`[Config] Username: ${config.bot.username}`);
  console.log(`[Config] Auth: ${config.bot.auth}`);
  console.log(`[Config] MCP Port: ${config.mcp.port}`);
  console.log('----------------------------------------');

  // Create bot client
  const botClient = new BotClient(config);

  // Create screenshot manager
  const screenshotManager = new ScreenshotManager(botClient, config);

  // Create MCP server
  const mcpServer = new MCPServer(botClient, screenshotManager, config);

  // Register all tools
  mcpServer.registerTools(movementTools(botClient));
  mcpServer.registerTools(lookTools(botClient));
  mcpServer.registerTools(digTools(botClient));
  mcpServer.registerTools(placeTools(botClient));
  mcpServer.registerTools(attackTools(botClient));
  mcpServer.registerTools(interactTools(botClient));
  mcpServer.registerTools(inventoryTools(botClient));
  mcpServer.registerTools(craftTools(botClient));
  mcpServer.registerTools(positionTools(botClient));
  mcpServer.registerTools(worldTools(botClient));
  mcpServer.registerTools(statusTools(botClient));
  mcpServer.registerTools(chatTools(botClient));
  mcpServer.registerTools(scannerTools(botClient));
  mcpServer.registerTools(autoTools(botClient));

  // Register screenshot tools (needs screenshotManager)
  const screenshotTools = require('./tools/screenshot');
  mcpServer.registerTools(screenshotTools(botClient, screenshotManager));

  // Register connection tools
  mcpServer.registerTool({
    name: 'connect_bot',
    description: 'Connect the bot to the Minecraft server',
    inputSchema: {
      type: 'object',
      properties: {
        host: { type: 'string', description: 'Server host (optional, uses config)' },
        port: { type: 'number', description: 'Server port (optional, uses config)' },
        username: { type: 'string', description: 'Bot username (optional, uses config)' }
      }
    },
    handler: async (params) => {
      if (params.host) config.bot.host = params.host;
      if (params.port) config.bot.port = params.port;
      if (params.username) config.bot.username = params.username;

      try {
        await botClient.connect();
        return { success: true, message: `Connected as ${config.bot.username} to ${config.bot.host}:${config.bot.port}` };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  });

  mcpServer.registerTool({
    name: 'disconnect_bot',
    description: 'Disconnect the bot from the Minecraft server',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      botClient.disconnect();
      return { success: true, message: 'Bot disconnected' };
    }
  });

  mcpServer.registerTool({
    name: 'get_connection_status',
    description: 'Get the current connection status of the bot',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      return {
        success: true,
        connected: botClient.isConnected,
        host: config.bot.host,
        port: config.bot.port,
        username: config.bot.username,
        auth: config.bot.auth
      };
    }
  });

  // Start MCP server
  mcpServer.start();

  console.log(`[Tools] Registered ${mcpServer.tools.size} tools`);
  console.log('----------------------------------------');

  // Auto-connect to Minecraft server
  if (config.bot.host) {
    console.log('[Bot] Connecting to Minecraft server...');
    try {
      await botClient.connect();
      console.log('[Bot] Successfully connected!');
    } catch (err) {
      console.error(`[Bot] Failed to connect: ${err.message}`);
      console.log('[Bot] You can connect later via the connect_bot tool');
    }
  }

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n[Server] Shutting down...');
    mcpServer.stop();
    botClient.disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n[Server] Shutting down...');
    mcpServer.stop();
    botClient.disconnect();
    process.exit(0);
  });

  process.on('uncaughtException', (err) => {
    console.error('[Server] Uncaught exception:', err.message);
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
