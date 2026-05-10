# TRAE Minecraft Bot - MCP Server

A complete Minecraft bot controlled by TRAE AI via MCP (Model Context Protocol). The bot joins a Minecraft server as a regular player with full behavior control.

## Features

- **Screenshot & Vision**: Capture game view, describe scenes, realtime streaming
- **Movement**: Walk, jump, sneak, sprint, swim
- **View Control**: Look at coordinates, players, entities; rotate view
- **Mining & Building**: Dig blocks, place blocks, auto-mine tunnels
- **Combat**: Attack entities, auto-attack hostile mobs, use shield
- **Inventory**: Manage items, equip armor, sort inventory
- **Crafting**: Craft items, use furnace, workbench
- **Position**: Get coordinates, biome, dimension, block info
- **Scanning**: Scan entities, players, blocks, dangers, structures
- **World**: Query time, weather, difficulty, game mode
- **Status**: Health, hunger, experience, effects, oxygen
- **Chat**: Send messages, whispers, commands
- **Automation**: Pathfinding, follow, auto-fish, auto-farm, auto-chop, guard

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- A Minecraft server (Java Edition 1.20.x recommended)

### Installation

```bash
cd trae-mc-bot
npm install
```

### Configuration

Edit `config.json`:

```json
{
  "bot": {
    "host": "localhost",
    "port": 25565,
    "username": "TRAE_Bot",
    "auth": "offline",
    "version": "1.20.4"
  },
  "mcp": {
    "port": 3000,
    "screenshotDir": "./screenshots"
  },
  "auto": {
    "autoEat": true,
    "autoAttack": false,
    "autoReconnect": true,
    "reconnectDelay": 5000
  }
}
```

### Start

```bash
npm start
```

The bot will:
1. Connect to the Minecraft server
2. Start the MCP HTTP/WebSocket server on port 3000
3. Register all tools (100+)

## API Usage

### HTTP REST

```bash
# Health check
curl http://localhost:3000/health

# List all tools
curl http://localhost:3000/tools

# Execute a tool
curl -X POST http://localhost:3000/tools/move_forward \
  -H "Content-Type: application/json" \
  -d '{"duration": 2000}'

# Get bot status
curl http://localhost:3000/status
```

### WebSocket

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  console.log(msg);
});

// Execute a tool
ws.send(JSON.stringify({
  type: 'execute_tool',
  id: '1',
  tool: 'get_position',
  params: {}
}));

// List tools
ws.send(JSON.stringify({ type: 'list_tools', id: '2' }));
```

### MCP Protocol (for TRAE)

The server implements a standard MCP-compatible tool interface:

```json
{
  "name": "tool_name",
  "description": "What this tool does",
  "inputSchema": {
    "type": "object",
    "properties": { ... }
  },
  "handler": "function(params, botClient, screenshotManager)"
}
```

## Available Tools (100+)

| Category | Tools |
|----------|-------|
| **Screenshot** | `screenshot`, `screenshot_and_describe`, `start_realtime_view`, `stop_realtime_view`, `look_and_screenshot`, `look_at_and_screenshot`, `view_self` |
| **Movement** | `move_forward`, `move_back`, `move_left`, `move_right`, `jump`, `sneak`, `sprint`, `stop_movement`, `swim_up`, `swim_down` |
| **Look** | `look_at`, `look_at_player`, `look_at_nearest_entity`, `look_at_nearest_block`, `turn`, `look_up`, `look_down`, `reset_look`, `look_around` |
| **Dig** | `dig`, `dig_at`, `dig_by_type`, `dig_line`, `dig_pit`, `stop_digging` |
| **Place** | `place_block`, `place_block_at`, `activate_block` |
| **Attack** | `attack_entity`, `attack_entity_by_name`, `attack_nearest_hostile`, `use_item`, `throw_item`, `eat_food`, `use_shield`, `mount_entity`, `dismount` |
| **Interact** | `interact_entity`, `interact_entity_by_name`, `interact_block`, `interact_block_at`, `drop_item` |
| **Inventory** | `get_inventory`, `get_held_item`, `set_hotbar_slot`, `equip_item`, `unequip`, `toss_item`, `get_item_count`, `get_equipment` |
| **Craft** | `get_recipes`, `craft`, `craft_with_table`, `smelt` |
| **Position** | `get_position`, `get_rotation`, `get_block_position`, `get_biome`, `get_dimension`, `get_ground_height`, `get_block_below`, `get_block_above`, `get_block_at` |
| **World** | `get_time`, `get_weather`, `get_difficulty`, `get_game_mode`, `set_time`, `set_weather`, `find_structure`, `find_ore`, `teleport`, `gamemode` |
| **Status** | `get_health`, `get_food`, `get_experience`, `get_oxygen`, `get_armor`, `get_effects`, `is_on_fire`, `is_in_water`, `is_in_lava`, `get_full_status` |
| **Chat** | `send_chat`, `send_whisper`, `reply_whisper`, `get_chat_history`, `get_online_players`, `send_team_message`, `send_action`, `run_command` |
| **Scanner** | `scan_entities`, `scan_players`, `scan_blocks`, `scan_hostile_mobs`, `scan_animals`, `scan_dropped_items`, `find_nearest_chest`, `find_nearest_crafting_table`, `find_nearest_furnace`, `find_nearest_anvil`, `find_nearest_block`, `scan_dangers` |
| **Auto** | `goto`, `follow_player`, `stop_following`, `auto_attack_start`, `auto_attack_stop`, `auto_collect`, `auto_eat_enable`, `auto_eat_disable`, `auto_fish`, `auto_mine`, `auto_chop_tree`, `auto_farm`, `auto_guard`, `return_to_death_point` |
| **Connection** | `connect_bot`, `disconnect_bot`, `get_connection_status` |

## Project Structure

```
trae-mc-bot/
├── package.json          # Dependencies and scripts
├── index.js              # Main entry point
├── mcp-server.js         # MCP HTTP/WebSocket server
├── bot-client.js         # Mineflayer bot wrapper
├── screenshot.js         # Screenshot capture & management
├── scanner.js            # World scanning utilities
├── config.json           # Configuration
├── tools/
│   ├── movement.js       # Movement controls
│   ├── look.js           # View angle controls
│   ├── dig.js            # Mining tools
│   ├── place.js          # Block placement
│   ├── attack.js         # Combat tools
│   ├── interact.js       # Interaction tools
│   ├── inventory.js      # Inventory management
│   ├── craft.js          # Crafting & smelting
│   ├── position.js       # Position queries
│   ├── world.js          # World queries
│   ├── status.js         # Player status
│   ├── chat.js           # Chat & commands
│   ├── screenshot.js     # Screenshot tools
│   ├── scanner.js        # Scanning tools
│   └── auto.js           # Automation tools
├── screenshots/          # Saved screenshots (auto-created)
└── README.md
```

## Dependencies

- **mineflayer** - Minecraft bot core
- **mineflayer-pathfinder** - A* pathfinding
- **mineflayer-collectblock** - Item collection
- **mineflayer-auto-eat** - Auto eating
- **mineflayer-pvp** - Combat AI
- **mineflayer-tool** - Tool selection
- **prismarine-viewer** - Game viewer/screenshots
- **express** - HTTP server
- **ws** - WebSocket server
- **sharp** / **canvas** - Image processing

## License

MIT
