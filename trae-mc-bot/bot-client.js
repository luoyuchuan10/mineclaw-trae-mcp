const mineflayer = require('mineflayer');
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const Movements = require('mineflayer-pathfinder').Movements;
const { GoalBlock, GoalNear, GoalXZ, GoalY, GoalInvert, GoalFollow } = require('mineflayer-pathfinder').goals;
const collectBlock = require('mineflayer-collectblock').plugin;
const autoEat = require('mineflayer-auto-eat').plugin;
const pvp = require('mineflayer-pvp').plugin;
const toolPlugin = require('mineflayer-tool').plugin;
const { Vec3 } = require('vec3');
const EventEmitter = require('events');
const fs = require('fs-extra');
const path = require('path');

class BotClient extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.bot = null;
    this.isConnected = false;
    this.isReconnecting = false;
    this.movements = null;
    this.viewer = null;
    this.screenshotDir = config.mcp.screenshotDir || './screenshots';
    this.realtimeViewInterval = null;
    this.chatHistory = [];
    this.lastWhisper = null;
    this.autoFunctions = {
      eat: false,
      attack: false,
      collect: false,
      follow: null,
      guard: null
    };
    
    // Ensure screenshot directory exists
    fs.ensureDirSync(this.screenshotDir);
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.bot = mineflayer.createBot({
          host: this.config.bot.host,
          port: this.config.bot.port,
          username: this.config.bot.username,
          auth: this.config.bot.auth,
          version: this.config.bot.version,
          viewDistance: this.config.bot.viewDistance
        });

        // Load plugins
        this.bot.loadPlugin(pathfinder);
        this.bot.loadPlugin(collectBlock);
        this.bot.loadPlugin(autoEat);
        this.bot.loadPlugin(pvp);
        this.bot.loadPlugin(toolPlugin);

        this.setupEventHandlers();

        this.bot.once('spawn', () => {
          this.isConnected = true;
          this.isReconnecting = false;
          this.setupMovements();
          this.setupAutoFunctions();
          console.log(`[Bot] Spawned as ${this.bot.username}`);
          this.emit('spawn');
          resolve();
        });

        this.bot.once('error', (err) => {
          if (!this.isConnected) {
            reject(err);
          }
        });

        this.bot.once('kicked', (reason) => {
          if (!this.isConnected) {
            reject(new Error(`Kicked: ${reason}`));
          }
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  setupEventHandlers() {
    this.bot.on('error', (err) => {
      console.error('[Bot] Error:', err.message);
      this.emit('error', err);
      this.handleDisconnect();
    });

    this.bot.on('kicked', (reason) => {
      console.log('[Bot] Kicked:', reason);
      this.emit('kicked', reason);
      this.handleDisconnect();
    });

    this.bot.on('end', () => {
      console.log('[Bot] Disconnected');
      this.emit('end');
      this.handleDisconnect();
    });

    this.bot.on('chat', (username, message) => {
      if (username === this.bot.username) return;
      
      const chatEntry = {
        type: 'chat',
        username,
        message,
        timestamp: Date.now()
      };
      this.chatHistory.push(chatEntry);
      if (this.chatHistory.length > 100) {
        this.chatHistory.shift();
      }
      this.emit('chat', chatEntry);
    });

    this.bot.on('whisper', (username, message) => {
      const whisperEntry = {
        type: 'whisper',
        username,
        message,
        timestamp: Date.now()
      };
      this.lastWhisper = whisperEntry;
      this.chatHistory.push(whisperEntry);
      this.emit('whisper', whisperEntry);
    });

    this.bot.on('death', () => {
      console.log('[Bot] Died');
      this.emit('death');
    });

    this.bot.on('respawn', () => {
      console.log('[Bot] Respawned');
      this.emit('respawn');
    });

    this.bot.on('health', () => {
      this.emit('health', {
        health: this.bot.health,
        food: this.bot.food,
        saturation: this.bot.foodSaturation
      });
    });

    this.bot.on('experience', () => {
      this.emit('experience', {
        level: this.bot.experience.level,
        points: this.bot.experience.points,
        progress: this.bot.experience.progress
      });
    });

    this.bot.on('sleep', () => {
      this.emit('sleep');
    });

    this.bot.on('wake', () => {
      this.emit('wake');
    });
  }

  setupMovements() {
    const defaultMove = new Movements(this.bot);
    defaultMove.allowFreeMotion = true;
    defaultMove.allowParkour = true;
    defaultMove.allowSprinting = true;
    defaultMove.canDig = true;
    this.bot.pathfinder.setMovements(defaultMove);
    this.movements = defaultMove;
  }

  setupAutoFunctions() {
    // Auto eat
    if (this.config.auto.autoEat) {
      this.bot.autoEat.enable();
    }

    // Auto attack hostile mobs
    if (this.config.auto.autoAttack) {
      this.startAutoAttack();
    }
  }

  handleDisconnect() {
    this.isConnected = false;
    this.stopRealtimeView();
    
    if (this.config.auto.autoReconnect && !this.isReconnecting) {
      this.isReconnecting = true;
      console.log(`[Bot] Reconnecting in ${this.config.auto.reconnectDelay}ms...`);
      setTimeout(() => {
        this.connect().catch(err => {
          console.error('[Bot] Reconnect failed:', err.message);
        });
      }, this.config.auto.reconnectDelay);
    }
  }

  disconnect() {
    this.config.auto.autoReconnect = false; // Prevent auto reconnect
    if (this.bot) {
      this.bot.end();
      this.bot = null;
    }
    this.isConnected = false;
    this.stopRealtimeView();
  }

  // Movement methods
  moveForward(duration = 1000) {
    this.bot.setControlState('forward', true);
    if (duration > 0) {
      setTimeout(() => {
        this.bot.setControlState('forward', false);
      }, duration);
    }
    return { success: true, action: 'move_forward', duration };
  }

  moveBack(duration = 1000) {
    this.bot.setControlState('back', true);
    if (duration > 0) {
      setTimeout(() => {
        this.bot.setControlState('back', false);
      }, duration);
    }
    return { success: true, action: 'move_back', duration };
  }

  moveLeft(duration = 1000) {
    this.bot.setControlState('left', true);
    if (duration > 0) {
      setTimeout(() => {
        this.bot.setControlState('left', false);
      }, duration);
    }
    return { success: true, action: 'move_left', duration };
  }

  moveRight(duration = 1000) {
    this.bot.setControlState('right', true);
    if (duration > 0) {
      setTimeout(() => {
        this.bot.setControlState('right', false);
      }, duration);
    }
    return { success: true, action: 'move_right', duration };
  }

  jump() {
    this.bot.setControlState('jump', true);
    setTimeout(() => {
      this.bot.setControlState('jump', false);
    }, 250);
    return { success: true, action: 'jump' };
  }

  sneak(enable = true) {
    this.bot.setControlState('sneak', enable);
    return { success: true, action: enable ? 'sneak_on' : 'sneak_off' };
  }

  sprint(enable = true) {
    this.bot.setControlState('sprint', enable);
    return { success: true, action: enable ? 'sprint_on' : 'sprint_off' };
  }

  stopMovement() {
    this.bot.clearControlStates();
    return { success: true, action: 'stop_movement' };
  }

  // Swimming
  swimUp(duration = 1000) {
    this.bot.setControlState('jump', true);
    if (duration > 0) {
      setTimeout(() => {
        this.bot.setControlState('jump', false);
      }, duration);
    }
    return { success: true, action: 'swim_up', duration };
  }

  swimDown(duration = 1000) {
    this.bot.setControlState('sneak', true);
    if (duration > 0) {
      setTimeout(() => {
        this.bot.setControlState('sneak', false);
      }, duration);
    }
    return { success: true, action: 'swim_down', duration };
  }

  // Look methods
  lookAt(x, y, z) {
    const pos = new Vec3(x, y, z);
    this.bot.lookAt(pos);
    return { success: true, action: 'look_at', target: { x, y, z } };
  }

  lookAtEntity(entity) {
    this.bot.lookAt(entity.position.offset(0, entity.height, 0));
    return { success: true, action: 'look_at_entity', entity: entity.name || entity.username };
  }

  look(yaw, pitch) {
    this.bot.look(yaw, pitch, true);
    return { success: true, action: 'look', yaw, pitch };
  }

  turnLeft(degrees = 90) {
    const newYaw = this.bot.entity.yaw + (degrees * Math.PI / 180);
    this.bot.look(newYaw, this.bot.entity.pitch, true);
    return { success: true, action: 'turn_left', degrees, newYaw };
  }

  turnRight(degrees = 90) {
    const newYaw = this.bot.entity.yaw - (degrees * Math.PI / 180);
    this.bot.look(newYaw, this.bot.entity.pitch, true);
    return { success: true, action: 'turn_right', degrees, newYaw };
  }

  lookUp(degrees = 30) {
    const newPitch = Math.max(-Math.PI / 2, this.bot.entity.pitch - (degrees * Math.PI / 180));
    this.bot.look(this.bot.entity.yaw, newPitch, true);
    return { success: true, action: 'look_up', degrees, newPitch };
  }

  lookDown(degrees = 30) {
    const newPitch = Math.min(Math.PI / 2, this.bot.entity.pitch + (degrees * Math.PI / 180));
    this.bot.look(this.bot.entity.yaw, newPitch, true);
    return { success: true, action: 'look_down', degrees, newPitch };
  }

  resetLook() {
    this.bot.look(0, 0, true);
    return { success: true, action: 'reset_look' };
  }

  async lookAround() {
    const originalYaw = this.bot.entity.yaw;
    const steps = 8;
    const stepAngle = (2 * Math.PI) / steps;
    
    for (let i = 0; i < steps; i++) {
      this.bot.look(originalYaw + (i * stepAngle), 0, true);
      await this.sleep(500);
    }
    
    this.bot.look(originalYaw, 0, true);
    return { success: true, action: 'look_around' };
  }

  // Pathfinding
  async goto(x, y, z, options = {}) {
    const goal = y !== undefined 
      ? new GoalBlock(x, y, z)
      : new GoalNear(x, 0, z, options.range || 1);
    
    try {
      await this.bot.pathfinder.goto(goal);
      return { 
        success: true, 
        action: 'goto', 
        destination: { x, y, z },
        reached: true 
      };
    } catch (error) {
      return { 
        success: false, 
        action: 'goto', 
        destination: { x, y, z },
        error: error.message 
      };
    }
  }

  async followPlayer(playerName, range = 2) {
    const player = this.bot.players[playerName];
    if (!player || !player.entity) {
      return { success: false, error: `Player ${playerName} not found` };
    }

    const goal = new GoalFollow(player.entity, range);
    this.bot.pathfinder.setGoal(goal, true);
    
    return { success: true, action: 'follow', target: playerName, range };
  }

  stopFollowing() {
    this.bot.pathfinder.setGoal(null);
    return { success: true, action: 'stop_following' };
  }

  // Auto functions
  startAutoAttack() {
    this.autoFunctions.attack = true;
    this.attackLoop();
    return { success: true, action: 'auto_attack_start' };
  }

  stopAutoAttack() {
    this.autoFunctions.attack = false;
    this.bot.pvp.stop();
    return { success: true, action: 'auto_attack_stop' };
  }

  async attackLoop() {
    while (this.autoFunctions.attack && this.isConnected) {
      const filter = e => e.type === 'mob' && e.position.distanceTo(this.bot.entity.position) < 16 &&
        (e.name === 'zombie' || e.name === 'skeleton' || e.name === 'creeper' || 
         e.name === 'spider' || e.name === 'enderman');
      
      const entity = this.bot.nearestEntity(filter);
      
      if (entity) {
        this.bot.pvp.attack(entity);
      }
      
      await this.sleep(1000);
    }
  }

  // Utility
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Getters
  get position() {
    return this.bot ? this.bot.entity.position : null;
  }

  get yaw() {
    return this.bot ? this.bot.entity.yaw : 0;
  }

  get pitch() {
    return this.bot ? this.bot.entity.pitch : 0;
  }

  get health() {
    return this.bot ? this.bot.health : 0;
  }

  get food() {
    return this.bot ? this.bot.food : 0;
  }

  get inventory() {
    return this.bot ? this.bot.inventory.items() : [];
  }
}

module.exports = BotClient;
