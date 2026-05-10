const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs-extra');

class MCPServer {
  constructor(botClient, screenshotManager, config) {
    this.botClient = botClient;
    this.screenshotManager = screenshotManager;
    this.config = config;
    this.app = express();
    this.server = null;
    this.wss = null;
    this.clients = new Set();
    this.tools = new Map();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use('/screenshots', express.static(this.config.mcp.screenshotDir));
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', connected: this.botClient.isConnected, timestamp: Date.now() });
    });

    // List all available tools
    this.app.get('/tools', (req, res) => {
      const toolsList = Array.from(this.tools.values()).map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema
      }));
      res.json({ success: true, count: toolsList.length, tools: toolsList });
    });

    // Execute a tool via HTTP POST
    this.app.post('/tools/:toolName', async (req, res) => {
      const { toolName } = req.params;
      const params = req.body || {};
      try {
        const result = await this.executeTool(toolName, params);
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message, tool: toolName });
      }
    });

    // Bot connection status
    this.app.get('/status', (req, res) => {
      if (!this.botClient.bot) {
        return res.json({ success: true, connected: false, message: 'Bot not connected' });
      }
      const bot = this.botClient.bot;
      res.json({
        success: true,
        connected: this.botClient.isConnected,
        bot: {
          username: bot.username,
          position: { x: bot.entity.position.x, y: bot.entity.position.y, z: bot.entity.position.z },
          health: bot.health,
          food: bot.food,
          experience: bot.experience.level,
          gameMode: bot.game.gameMode
        }
      });
    });

    // Reconnect bot
    this.app.post('/reconnect', async (req, res) => {
      try {
        if (this.botClient.isConnected) {
          this.botClient.disconnect();
        }
        await this.botClient.connect();
        res.json({ success: true, message: 'Reconnected successfully' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Disconnect bot
    this.app.post('/disconnect', (req, res) => {
      this.botClient.disconnect();
      res.json({ success: true, message: 'Disconnected' });
    });

    // Update config
    this.app.put('/config', (req, res) => {
      try {
        const newConfig = req.body;
        Object.assign(this.config.bot, newConfig.bot || {});
        Object.assign(this.config.mcp, newConfig.mcp || {});
        fs.writeJsonSync(path.join(__dirname, 'config.json'), this.config, { spaces: 2 });
        res.json({ success: true, config: this.config });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  setupWebSocket() {
    // WebSocket will be attached when server starts
  }

  // Register a tool
  registerTool(tool) {
    if (!tool.name || !tool.description || !tool.handler) {
      throw new Error('Tool must have name, description, and handler');
    }
    this.tools.set(tool.name, {
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema || { type: 'object', properties: {} },
      handler: tool.handler
    });
  }

  // Register multiple tools
  registerTools(toolsArray) {
    toolsArray.forEach(tool => this.registerTool(tool));
  }

  // Execute a tool by name
  async executeTool(toolName, params = {}) {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return { success: false, error: `Tool "${toolName}" not found`, availableTools: Array.from(this.tools.keys()) };
    }

    if (!this.botClient.isConnected && toolName !== 'connect_bot') {
      return { success: false, error: 'Bot is not connected to any server' };
    }

    try {
      const result = await tool.handler(params, this.botClient, this.screenshotManager);
      // Broadcast result to WebSocket clients
      this.broadcastToClients({ type: 'tool_result', tool: toolName, params, result, timestamp: Date.now() });
      return result;
    } catch (error) {
      return { success: false, error: error.message, tool: toolName };
    }
  }

  // Start the MCP server
  start() {
    const port = this.config.mcp.port || 3000;
    const host = this.config.mcp.host || '0.0.0.0';

    this.server = http.createServer(this.app);

    // Setup WebSocket
    this.wss = new WebSocket.Server({ server: this.server, path: '/ws' });

    this.wss.on('connection', (ws) => {
      console.log('[MCP] WebSocket client connected');
      this.clients.add(ws);

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());

          if (message.type === 'execute_tool') {
            const result = await this.executeTool(message.tool, message.params || {});
            ws.send(JSON.stringify({ type: 'tool_result', id: message.id, tool: message.tool, result }));
          } else if (message.type === 'list_tools') {
            const toolsList = Array.from(this.tools.values()).map(t => ({
              name: t.name,
              description: t.description,
              inputSchema: t.inputSchema
            }));
            ws.send(JSON.stringify({ type: 'tools_list', id: message.id, tools: toolsList }));
          } else if (message.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', id: message.id, timestamp: Date.now() }));
          }
        } catch (error) {
          ws.send(JSON.stringify({ type: 'error', error: error.message }));
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('[MCP] WebSocket client disconnected');
      });

      ws.on('error', (err) => {
        console.error('[MCP] WebSocket error:', err.message);
        this.clients.delete(ws);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'TRAE Minecraft Bot MCP Server',
        botConnected: this.botClient.isConnected,
        toolCount: this.tools.size
      }));
    });

    this.server.listen(port, host, () => {
      console.log(`[MCP] HTTP server running at http://${host}:${port}`);
      console.log(`[MCP] WebSocket server running at ws://${host}:${port}/ws`);
      console.log(`[MCP] Screenshots served at http://${host}:${port}/screenshots`);
    });

    // Forward bot events to WebSocket clients
    this.botClient.on('chat', (data) => {
      this.broadcastToClients({ type: 'event', event: 'chat', data });
    });
    this.botClient.on('whisper', (data) => {
      this.broadcastToClients({ type: 'event', event: 'whisper', data });
    });
    this.botClient.on('death', () => {
      this.broadcastToClients({ type: 'event', event: 'death', timestamp: Date.now() });
    });
    this.botClient.on('health', (data) => {
      this.broadcastToClients({ type: 'event', event: 'health', data });
    });
    this.botClient.on('spawn', () => {
      this.broadcastToClients({ type: 'event', event: 'spawn', timestamp: Date.now() });
    });
    this.botClient.on('end', () => {
      this.broadcastToClients({ type: 'event', event: 'disconnect', timestamp: Date.now() });
    });
    this.botClient.on('kicked', (reason) => {
      this.broadcastToClients({ type: 'event', event: 'kicked', reason });
    });
  }

  // Broadcast message to all connected WebSocket clients
  broadcastToClients(message) {
    const data = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  // Stop the server
  stop() {
    if (this.wss) {
      this.clients.forEach(client => client.close());
      this.wss.close();
    }
    if (this.server) {
      this.server.close();
    }
  }
}

module.exports = MCPServer;
