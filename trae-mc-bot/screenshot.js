const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const { createCanvas } = require('canvas');

class ScreenshotManager {
  constructor(botClient, config) {
    this.botClient = botClient;
    this.config = config;
    this.screenshotDir = config.mcp.screenshotDir || './screenshots';
    this.realtimeInterval = null;
    this.viewer = null;
    
    fs.ensureDirSync(this.screenshotDir);
  }

  async initializeViewer() {
    try {
      const { mineflayer } = require('prismarine-viewer');
      
      if (this.botClient.bot) {
        this.viewer = mineflayer(this.botClient.bot, {
          port: this.config.viewer.port || 3001,
          firstPerson: this.config.viewer.firstPerson !== false,
          width: this.config.viewer.width || 1920,
          height: this.config.viewer.height || 1080
        });
        
        console.log(`[Screenshot] Viewer initialized on port ${this.config.viewer.port || 3001}`);
        return true;
      }
    } catch (error) {
      console.error('[Screenshot] Failed to initialize viewer:', error.message);
      return false;
    }
  }

  generateFilename(prefix = 'screenshot') {
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    return `${prefix}_${timestamp}.png`;
  }

  async captureScreenshot(options = {}) {
    try {
      const filename = options.filename || this.generateFilename();
      const filepath = path.join(this.screenshotDir, filename);
      
      // Method 1: Try to use prismarine-viewer if available
      if (this.viewer && this.viewer.capture) {
        await this.viewer.capture(filepath);
        return {
          success: true,
          filepath,
          filename,
          timestamp: Date.now()
        };
      }
      
      // Method 2: Create a simulated screenshot with game info
      const screenshot = await this.createGameInfoScreenshot();
      await fs.writeFile(filepath, screenshot);
      
      return {
        success: true,
        filepath,
        filename,
        timestamp: Date.now(),
        note: 'Simulated screenshot with game info'
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  async createGameInfoScreenshot() {
    // Create a canvas with game information
    const width = 1920;
    const height = 1080;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);
    
    // Header
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, width, 100);
    
    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 48px Arial';
    ctx.fillText('TRAE Minecraft Bot - Game View', 50, 70);
    
    // Get bot info
    const bot = this.botClient.bot;
    if (!bot) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.fillText('Bot not connected', 50, 150);
      return canvas.toBuffer('image/png');
    }
    
    const pos = bot.entity.position;
    const yaw = bot.entity.yaw * (180 / Math.PI);
    const pitch = bot.entity.pitch * (180 / Math.PI);
    
    // Game info section
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(50, 120, 600, 400);
    
    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('Player Status', 70, 170);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    
    let y = 210;
    const lineHeight = 35;
    
    ctx.fillText(`Username: ${bot.username}`, 70, y);
    y += lineHeight;
    ctx.fillText(`Position: X:${pos.x.toFixed(2)} Y:${pos.y.toFixed(2)} Z:${pos.z.toFixed(2)}`, 70, y);
    y += lineHeight;
    ctx.fillText(`Rotation: Yaw:${yaw.toFixed(1)}° Pitch:${pitch.toFixed(1)}°`, 70, y);
    y += lineHeight;
    ctx.fillText(`Health: ${bot.health}/20`, 70, y);
    y += lineHeight;
    ctx.fillText(`Food: ${bot.food}/20`, 70, y);
    y += lineHeight;
    ctx.fillText(`Experience: Level ${bot.experience.level}`, 70, y);
    y += lineHeight;
    ctx.fillText(`Dimension: ${bot.game.dimension}`, 70, y);
    y += lineHeight;
    ctx.fillText(`Biome: ${bot.blockAt(pos)?.biome?.name || 'Unknown'}`, 70, y);
    
    // Inventory section
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(700, 120, 500, 400);
    
    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('Hotbar', 720, 170);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    
    y = 210;
    const items = bot.inventory.items();
    const hotbar = items.slice(0, 9);
    
    hotbar.forEach((item, index) => {
      ctx.fillText(`[${index + 1}] ${item.name} x${item.count}`, 720, y);
      y += 30;
    });
    
    if (hotbar.length === 0) {
      ctx.fillText('Empty', 720, y);
    }
    
    // Surroundings section
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(50, 550, 1150, 450);
    
    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('Surroundings', 70, 600);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    
    y = 640;
    
    // Nearby entities
    const entities = Object.values(bot.entities)
      .filter(e => e.position.distanceTo(pos) < 20)
      .slice(0, 10);
    
    ctx.fillText('Nearby Entities:', 70, y);
    y += 30;
    
    entities.forEach(entity => {
      const distance = entity.position.distanceTo(pos).toFixed(1);
      const name = entity.name || entity.username || 'Unknown';
      ctx.fillText(`- ${name} (${distance}m)`, 90, y);
      y += 25;
    });
    
    // Block at feet
    const blockAtFeet = bot.blockAt(pos.offset(0, -1, 0));
    if (blockAtFeet) {
      y += 10;
      ctx.fillText(`Block at feet: ${blockAtFeet.name}`, 70, y);
    }
    
    // Target block
    const blockInSight = bot.blockAtCursor(5);
    if (blockInSight) {
      y += 25;
      ctx.fillText(`Looking at: ${blockInSight.name}`, 70, y);
    }
    
    // Crosshair
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 20, height / 2);
    ctx.lineTo(width / 2 + 20, height / 2);
    ctx.moveTo(width / 2, height / 2 - 20);
    ctx.lineTo(width / 2, height / 2 + 20);
    ctx.stroke();
    
    // Timestamp
    ctx.fillStyle = '#888888';
    ctx.font = '16px Arial';
    ctx.fillText(`Captured: ${moment().format('YYYY-MM-DD HH:mm:ss')}`, 50, height - 30);
    
    return canvas.toBuffer('image/png');
  }

  async captureAndDescribe() {
    const screenshot = await this.captureScreenshot();
    
    if (!screenshot.success) {
      return screenshot;
    }
    
    // Generate description
    const bot = this.botClient.bot;
    const description = this.generateSceneDescription();
    
    return {
      ...screenshot,
      description
    };
  }

  generateSceneDescription() {
    const bot = this.botClient.bot;
    if (!bot) {
      return { error: 'Bot not connected' };
    }
    
    const pos = bot.entity.position;
    const description = {
      player: {
        position: {
          x: Math.floor(pos.x),
          y: Math.floor(pos.y),
          z: Math.floor(pos.z)
        },
        health: bot.health,
        food: bot.food,
        experience: bot.experience.level
      },
      environment: {
        dimension: bot.game.dimension,
        timeOfDay: bot.time.timeOfDay,
        isDay: bot.time.isDay,
        weather: bot.game.rainState ? 'raining' : 'clear'
      },
      surroundings: {
        blockAtFeet: bot.blockAt(pos.offset(0, -1, 0))?.name || 'unknown',
        blockInFront: null,
        entities: [],
        items: []
      }
    };
    
    // Get block in front
    const yaw = bot.entity.yaw;
    const dx = -Math.sin(yaw);
    const dz = -Math.cos(yaw);
    const frontPos = pos.offset(dx, 0, dz);
    const blockInFront = bot.blockAt(frontPos);
    if (blockInFront) {
      description.surroundings.blockInFront = blockInFront.name;
    }
    
    // Get nearby entities
    const entities = Object.values(bot.entities)
      .filter(e => e.position.distanceTo(pos) < 30)
      .slice(0, 15);
    
    description.surroundings.entities = entities.map(e => ({
      type: e.type,
      name: e.name || e.username || 'unknown',
      distance: Math.floor(e.position.distanceTo(pos)),
      position: {
        x: Math.floor(e.position.x),
        y: Math.floor(e.position.y),
        z: Math.floor(e.position.z)
      }
    }));
    
    // Get nearby items
    const items = Object.values(bot.entities)
      .filter(e => e.type === 'object' && e.name === 'item')
      .slice(0, 10);
    
    description.surroundings.items = items.map(e => ({
      distance: Math.floor(e.position.distanceTo(pos)),
      position: {
        x: Math.floor(e.position.x),
        y: Math.floor(e.position.y),
        z: Math.floor(e.position.z)
      }
    }));
    
    return description;
  }

  async lookAndScreenshot(direction) {
    const bot = this.botClient.bot;
    if (!bot) {
      return { success: false, error: 'Bot not connected' };
    }
    
    const originalYaw = bot.entity.yaw;
    const originalPitch = bot.entity.pitch;
    
    // Look in specified direction
    switch (direction.toLowerCase()) {
      case 'north':
        bot.look(0, 0, true);
        break;
      case 'south':
        bot.look(Math.PI, 0, true);
        break;
      case 'east':
        bot.look(-Math.PI / 2, 0, true);
        break;
      case 'west':
        bot.look(Math.PI / 2, 0, true);
        break;
      case 'up':
        bot.look(originalYaw, -Math.PI / 2, true);
        break;
      case 'down':
        bot.look(originalYaw, Math.PI / 2, true);
        break;
      default:
        return { success: false, error: 'Invalid direction. Use: north, south, east, west, up, down' };
    }
    
    // Wait for look to complete
    await this.botClient.sleep(500);
    
    // Capture screenshot
    const screenshot = await this.captureScreenshot({
      filename: this.generateFilename(`look_${direction}`)
    });
    
    return {
      ...screenshot,
      direction,
      originalYaw,
      originalPitch
    };
  }

  async lookAtAndScreenshot(x, y, z) {
    const bot = this.botClient.bot;
    if (!bot) {
      return { success: false, error: 'Bot not connected' };
    }
    
    const originalYaw = bot.entity.yaw;
    const originalPitch = bot.entity.pitch;
    
    // Look at position
    const target = require('vec3')(x, y, z);
    bot.lookAt(target);
    
    // Wait for look to complete
    await this.botClient.sleep(500);
    
    // Capture screenshot
    const screenshot = await this.captureScreenshot({
      filename: this.generateFilename(`look_at_${x}_${y}_${z}`)
    });
    
    return {
      ...screenshot,
      target: { x, y, z },
      originalYaw,
      originalPitch
    };
  }

  async viewSelf() {
    const bot = this.botClient.bot;
    if (!bot) {
      return { success: false, error: 'Bot not connected' };
    }
    
    // Switch to third person view (if using prismarine-viewer)
    if (this.viewer) {
      this.viewer.setFirstPerson(false);
    }
    
    // Look at self from behind
    const pos = bot.entity.position;
    const yaw = bot.entity.yaw;
    const viewDistance = 5;
    const cameraX = pos.x + Math.sin(yaw) * viewDistance;
    const cameraZ = pos.z + Math.cos(yaw) * viewDistance;
    
    bot.lookAt(require('vec3')(cameraX, pos.y + 1, cameraZ));
    
    await this.botClient.sleep(500);
    
    const screenshot = await this.captureScreenshot({
      filename: this.generateFilename('self_view')
    });
    
    // Reset to first person
    if (this.viewer) {
      this.viewer.setFirstPerson(true);
    }
    
    return {
      ...screenshot,
      view: 'third_person_self'
    };
  }

  startRealtimeView(callback) {
    if (this.realtimeInterval) {
      return { success: false, error: 'Realtime view already running' };
    }
    
    const interval = this.config.mcp.screenshotInterval || 1000;
    
    this.realtimeInterval = setInterval(async () => {
      try {
        const screenshot = await this.captureScreenshot({
          filename: this.generateFilename('realtime')
        });
        
        if (callback && typeof callback === 'function') {
          callback(screenshot);
        }
      } catch (error) {
        console.error('[Screenshot] Realtime capture error:', error.message);
      }
    }, interval);
    
    return { 
      success: true, 
      message: 'Realtime view started',
      interval,
      intervalMs: interval
    };
  }

  stopRealtimeView() {
    if (this.realtimeInterval) {
      clearInterval(this.realtimeInterval);
      this.realtimeInterval = null;
      return { success: true, message: 'Realtime view stopped' };
    }
    return { success: false, error: 'Realtime view not running' };
  }

  isRealtimeViewRunning() {
    return this.realtimeInterval !== null;
  }

  async getScreenshotList(limit = 20) {
    try {
      const files = await fs.readdir(this.screenshotDir);
      const pngFiles = files.filter(f => f.endsWith('.png'));
      const screenshots = [];
      for (const f of pngFiles) {
        const stat = await fs.stat(path.join(this.screenshotDir, f));
        screenshots.push({ filename: f, filepath: path.join(this.screenshotDir, f), created: stat.mtime });
      }
      screenshots.sort((a, b) => b.created - a.created);
      return {
        success: true,
        count: screenshots.length,
        screenshots: screenshots.slice(0, limit)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteScreenshot(filename) {
    try {
      const filepath = path.join(this.screenshotDir, filename);
      await fs.remove(filepath);
      return {
        success: true,
        message: `Deleted ${filename}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async clearScreenshots() {
    try {
      await fs.emptyDir(this.screenshotDir);
      return {
        success: true,
        message: 'All screenshots cleared'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = ScreenshotManager;
