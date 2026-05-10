/**
 * tools/chat.js - Chat and social interaction tools
 */
module.exports = (botClient) => [
  {
    name: 'send_chat',
    description: 'Send a message to public chat',
    inputSchema: {
      type: 'object',
      properties: { message: { type: 'string', description: 'Message to send' } },
      required: ['message']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      bot.chat(params.message);
      return { success: true, action: 'send_chat', message: params.message };
    }
  },
  {
    name: 'send_whisper',
    description: 'Send a private message to a specific player',
    inputSchema: {
      type: 'object',
      properties: {
        username: { type: 'string', description: 'Target player' },
        message: { type: 'string', description: 'Private message' }
      },
      required: ['username', 'message']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      bot.whisper(params.username, params.message);
      return { success: true, action: 'send_whisper', to: params.username, message: params.message };
    }
  },
  {
    name: 'reply_whisper',
    description: 'Reply to the last private message received',
    inputSchema: {
      type: 'object',
      properties: { message: { type: 'string', description: 'Reply message' } },
      required: ['message']
    },
    handler: async (params) => {
      const lastWhisper = botClient.lastWhisper;
      if (!lastWhisper) return { success: false, error: 'No whisper to reply to' };

      const bot = botClient.bot;
      bot.whisper(lastWhisper.username, params.message);
      return { success: true, action: 'reply_whisper', to: lastWhisper.username, message: params.message };
    }
  },
  {
    name: 'get_chat_history',
    description: 'Get recent chat history',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number', description: 'Max messages to return (default 20)' } }
    },
    handler: async (params) => {
      const limit = params.limit || 20;
      const history = botClient.chatHistory.slice(-limit);
      return { success: true, count: history.length, messages: history };
    }
  },
  {
    name: 'get_online_players',
    description: 'Get list of online players',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bot = botClient.bot;
      const players = Object.values(bot.players)
        .filter(p => p.username !== bot.username)
        .map(p => ({
          username: p.username,
          ping: p.ping || 0,
          entityVisible: !!p.entity
        }));
      return { success: true, count: players.length, players };
    }
  },
  {
    name: 'send_team_message',
    description: 'Send a message to the bot team chat',
    inputSchema: {
      type: 'object',
      properties: { message: { type: 'string', description: 'Team message' } },
      required: ['message']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      bot.chat(`/tm ${params.message}`);
      return { success: true, action: 'send_team_message', message: params.message };
    }
  },
  {
    name: 'send_action',
    description: 'Send an action message (/me)',
    inputSchema: {
      type: 'object',
      properties: { action: { type: 'string', description: 'Action description' } },
      required: ['action']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      bot.chat(`/me ${params.action}`);
      return { success: true, action: 'send_action', message: params.action };
    }
  },
  {
    name: 'run_command',
    description: 'Execute a Minecraft command (requires OP permissions)',
    inputSchema: {
      type: 'object',
      properties: { command: { type: 'string', description: 'Command to execute (without leading /)' } },
      required: ['command']
    },
    handler: async (params) => {
      const bot = botClient.bot;
      try {
        bot.chat(`/${params.command}`);
        return { success: true, action: 'run_command', command: params.command };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  }
];
