import Phaser from 'phaser';
import { MS_PATH, getDefaultSpriteSheets, getSheetsForAppearance, getAppearanceTextureKeys, getEffectiveAppearance, CLASS_DEFAULT_APPEARANCE } from '../config/appearance';

// ── Mana Seed Paper Doll Configuration ──────────────────────────────
const MS_FRAME = { frameWidth: 64, frameHeight: 64 };

// Only preload sheets for class default appearances (~12 sheets)
// Custom player sheets are loaded on-demand to save mobile GPU memory
const MS_SHEETS = getDefaultSpriteSheets();

// Page 1 frame layout (512x512 sheet, 64x64 cells, 8 cols × 8 rows)
// Rows 0-3: stand/push/pull/jump (directions: down, up, left, right)
// Rows 4-7: walk 6-frame + run 2-frame (directions: down, up, left, right)
// Mana Seed direction order: Down, Up, RIGHT, LEFT (rows 2/6 = right, rows 3/7 = left)
const MS_ANIMS = {
  idle:  { down: 0,  up: 8,  right: 16, left: 24 }, // col 0 of rows 0-3
  walk: {
    down:  { start: 32, end: 37 }, // row 4, cols 0-5
    up:    { start: 40, end: 45 }, // row 5, cols 0-5
    right: { start: 48, end: 53 }, // row 6, cols 0-5
    left:  { start: 56, end: 61 }, // row 7, cols 0-5
  },
};
// ─────────────────────────────────────────────────────────────────────

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.player = null;
    this.playerLayers = null; // paper doll layers: { outfit, hair, hat }
    this.npc = null;
    this.dungeonNPC = null;
    this.questGiverNPC = null;
    this.testDummy = null;
    this.barriers = null;
    this.canInteract = false;
    this.canInteractDungeon = false;
    this.canInteractQuestGiver = false;
    this.canInteractTestDummy = false;
    this.playerLevel = 1;
    this.playerClass = null;
    this.isModalOpen = false;
    this.musicStarted = false;

    // Touch/pointer input state
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragStartTime = 0;
    this.moveVector = { x: 0, y: 0 };

    // Animation state
    this.lastDirection = 'down';
  }

  preload() {
    // Add load error logging for debugging
    this.load.on('loaderror', (file) => {
      console.error('ASSET FAILED TO LOAD:', file.key, file.src);
    });

    // Use static cache bust instead of Date.now() for production stability
    const cacheBust = `?v=24`; // Fix directions, zoom, NPC scale

    // Load town map
    this.load.image('townMap', `/assets/sprites/map1.png${cacheBust}`);

    // Load NPC sprites
    this.load.image('taskmaster', `/assets/sprites/taskmaster.png${cacheBust}`);
    this.load.image('taskboard', `/assets/sprites/taskboard.png${cacheBust}`);
    this.load.image('dungeonSprite', `/assets/sprites/dungeon.png${cacheBust}`);

    // Load battle arena assets
    this.load.image('arenaBackground', `/assets/sprites/ARENA1background.png${cacheBust}`);
    this.load.image('orcBaddie', `/assets/sprites/Baddiearena1.png${cacheBust}`);


    // Load Mana Seed paper doll sprite sheets (all 512x512, 64x64 frames)
    for (const [key, path] of Object.entries(MS_SHEETS)) {
      this.load.spritesheet(key, `${MS_PATH}/${path}${cacheBust}`, MS_FRAME);
    }

    // Load background music
    this.load.audio('townTheme', '/assets/music/town-theme.wav');

    this.load.on('filecomplete-audio-townTheme', () => {
      console.log('✅ Town theme music loaded successfully');
    });
  }

  create() {
    // Extend world bounds vertically to fill tall phone screens
    const WORLD_WIDTH = 1024;
    const WORLD_HEIGHT = 1536; // Extended from 1024 to fill vertical screens

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Enable pixel-perfect rendering for crisp sprites
    this.cameras.main.setRoundPixels(true);

    // Tile-based zoom: show ~14 tiles across screen for readable sprites
    const TILE_SIZE = 32;
    const TILES_ACROSS = 14;
    let zoom = this.scale.width / (TILES_ACROSS * TILE_SIZE);
    zoom = zoom * 0.53; // Zoom level tuned for town overview

    // Round to nearest 0.5 increment for crisp pixel rendering
    zoom = Math.round(zoom * 2) / 2;

    // Clamp zoom: min 1.0 so mobile doesn't get too zoomed out
    zoom = Phaser.Math.Clamp(zoom, 1.0, 2.0);
    this.cameras.main.setZoom(zoom);

    // Handle screen rotation and resize
    this.scale.on('resize', (gameSize) => {
      const TILE_SIZE = 32;
      const TILES_ACROSS = 14;
      let newZoom = gameSize.width / (TILES_ACROSS * TILE_SIZE);
      newZoom = newZoom * 0.53;

      // Round to nearest 0.5 increment for crisp pixel rendering
      newZoom = Math.round(newZoom * 2) / 2;

      newZoom = Phaser.Math.Clamp(newZoom, 1.0, 2.0);
      this.cameras.main.setZoom(newZoom);
    });

    // Create town background FIRST
    this.createTown();

    // Create player
    this.createPlayer();

    // Create NPC
    this.createNPC();

    // Create Dungeon NPC
    this.createDungeonNPC();

    // Create Quest Giver NPC
    this.createQuestGiverNPC();

    // Create Test Dummy NPC (for testing XP/leveling)
    this.createTestDummy();

    // Create collision barriers for water and houses
    this.createCollisionBarriers();

    // Create UI elements
    this.createUI();

    // Camera follows player smoothly
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Enable pointer/touch input
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);

    // Listen for events from React
    this.game.events.on('update-stats', (stats) => {
      // Skip if no valid class (prevents broken player on initial empty stats)
      if (!stats.characterClass) return;

      const classChanged = this.playerClass !== stats.characterClass;
      this.playerLevel = stats.level;
      this.playerClass = stats.characterClass;

      // Apply paper doll layers from player's custom appearance (or class defaults)
      // Merge equipment into appearance so armor drives the outfit sprite
      if (classChanged && this.player) {
        const appearance = stats.appearance || CLASS_DEFAULT_APPEARANCE[stats.characterClass];
        const effective = getEffectiveAppearance(appearance, stats.equipment);

        // Dynamically load any sheets not already in the preloaded defaults
        const needed = getSheetsForAppearance(effective);
        const missing = {};
        for (const [key, path] of Object.entries(needed)) {
          if (!this.textures.exists(key)) {
            missing[key] = path;
          }
        }

        if (Object.keys(missing).length > 0) {
          for (const [key, path] of Object.entries(missing)) {
            this.load.spritesheet(key, `${MS_PATH}/${path}`, MS_FRAME);
          }
          this.load.once('complete', () => {
            this.applyAppearanceLayers(effective);
            this.syncPlayerLayers();
          });
          this.load.start();
        } else {
          this.applyAppearanceLayers(effective);
          this.syncPlayerLayers();
        }
      }
    });

    this.game.events.on('xp-gained', (data) => {
      this.showXPGainFeedback(data);
    });

    // Listen for modal open/close to pause/resume game input
    this.game.events.on('open-task-modal', () => {
      this.isModalOpen = true;
    });

    this.game.events.on('close-task-modal', () => {
      this.isModalOpen = false;
    });

    // Prepare background music (will start on first user interaction due to browser autoplay policy)
    try {
      this.townMusic = this.sound.add('townTheme', {
        loop: true,
        volume: 0.3
      });
      console.log('🎵 Town music created, ready to play on user interaction');
    } catch (error) {
      console.error('❌ Failed to create town music:', error);
    }

    // Emit game-ready event after a small delay to ensure everything is loaded
    this.time.delayedCall(100, () => {
      this.game.events.emit('game-ready');

      // Try to start music automatically (after title screen interaction)
      this.time.delayedCall(500, () => {
        if (!this.musicStarted && this.townMusic) {
          console.log('🎵 Attempting to auto-start music after title screen...');
          try {
            const playResult = this.townMusic.play();
            if (playResult) {
              console.log('✅ Music started automatically!');
              this.musicStarted = true;
            }
          } catch (error) {
            console.log('⚠️ Auto-play blocked, will start on first touch:', error);
          }
        }
      });
    });
  }

  createTown() {
    // Add town map background (1024x1536) - centered in taller world for phones
    const map = this.add.image(512, 768, 'townMap');
    map.setDepth(0);

    // Create placeholder for Productivity Board if sprite doesn't load
    const boardGraphics = this.add.graphics();
    boardGraphics.fillStyle(0x10b981, 1); // Green color
    boardGraphics.fillRect(0, 0, 120, 160); // Rectangle
    boardGraphics.generateTexture('taskboardPlaceholder', 120, 160);
    boardGraphics.destroy();

    // Add Productivity Board in center
    if (this.textures.exists('taskboard')) {
      console.log('✅ Taskboard sprite loaded');
      this.productivityBoard = this.add.image(512, 545, 'taskboard');
      this.productivityBoard.setScale(0.60);
    } else {
      console.warn('⚠️ Taskboard sprite not found, using placeholder');
      this.productivityBoard = this.add.image(512, 545, 'taskboardPlaceholder');
      this.productivityBoard.setScale(1);
    }
    this.productivityBoard.setDepth(5);
    this.productivityBoard.setAlpha(1); // Ensure visibility

    // Add board name tag
    const boardNameTag = this.add.text(512, 453, 'Productivity Board', {
      fontSize: '12px',
      fill: '#fff',
      backgroundColor: '#10b981',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    boardNameTag.setDepth(11);
  }

  createPlayerAnimations() {
    // Mana Seed page 1: 8×8 grid (64×64 cells in 512×512 sheet)
    // Animations reference ms_base_v01 for frame timing; visual layers sync via frame index
    const key = 'ms_base_v01';

    for (const dir of ['down', 'up', 'left', 'right']) {
      this.anims.create({
        key: `ms_walk_${dir}`,
        frames: this.anims.generateFrameNumbers(key, MS_ANIMS.walk[dir]),
        frameRate: 8,
        repeat: -1
      });

      this.anims.create({
        key: `ms_idle_${dir}`,
        frames: [{ key, frame: MS_ANIMS.idle[dir] }],
        frameRate: 1
      });
    }
  }

  createPlayer() {
    const centerX = 512;
    const centerY = 600;
    const defaultSkin = 'ms_base_v01';

    // Invisible physics sprite - drives animation timing + movement
    this.player = this.physics.add.sprite(centerX, centerY, defaultSkin);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(49); // behind visual layers
    this.player.setScale(2);
    this.player.setAlpha(0); // invisible - visual layers handle rendering

    // Tighter collision box centered on feet
    this.player.body.setSize(20, 16);
    this.player.body.setOffset(22, 44);

    // Paper doll visual layers (base body + equipment)
    this.playerLayers = {
      base:   this.add.sprite(centerX, centerY, defaultSkin).setDepth(50).setScale(2),
      outfit: this.add.sprite(centerX, centerY, defaultSkin).setDepth(50.1).setScale(2).setVisible(false),
      hair:   this.add.sprite(centerX, centerY, defaultSkin).setDepth(50.2).setScale(2).setVisible(false),
      hat:    this.add.sprite(centerX, centerY, defaultSkin).setDepth(50.3).setScale(2).setVisible(false),
    };

    this.createPlayerAnimations();
    this.player.play('ms_idle_down');
  }

  // Apply paper doll layers from a player's custom appearance object
  applyAppearanceLayers(appearance) {
    if (!appearance || !this.playerLayers) return;

    const keys = getAppearanceTextureKeys(appearance);

    // Also update the base body skin tone
    if (keys.base && this.textures.exists(keys.base)) {
      this.player.setTexture(keys.base);
      this.player.play(`ms_idle_${this.lastDirection}`, true);
    }

    const layerMap = { base: keys.base, outfit: keys.outfit, hair: keys.hair, hat: keys.hat };
    for (const [layerName, layer] of Object.entries(this.playerLayers)) {
      const textureKey = layerMap[layerName];
      if (textureKey && this.textures.exists(textureKey)) {
        layer.setTexture(textureKey);
        layer.setVisible(true);
      } else if (layerName !== 'base') {
        // Hide optional layers (outfit/hair/hat) if missing, but base always stays visible
        layer.setVisible(false);
      }
    }
  }

  // Keep all paper doll layers in sync with the base player sprite
  syncPlayerLayers() {
    if (!this.playerLayers) return;
    const { x, y } = this.player;
    const frameName = this.player.frame.name;
    for (const layer of Object.values(this.playerLayers)) {
      if (layer.active) {
        layer.setPosition(x, y);
        if (layer.visible) {
          layer.setFrame(frameName);
        }
      }
    }
  }

  destroyPlayerLayers() {
    if (!this.playerLayers) return;
    for (const layer of Object.values(this.playerLayers)) {
      if (layer && layer.active) layer.destroy();
    }
    this.playerLayers = null;
  }

  createNPC() {
    // Create Task Master in grass next to path
    const taskmasterX = 450; // Left of center
    const taskmasterY = 400; // Above and to the left

    // Create placeholder for Task Master
    const taskmasterGraphics = this.add.graphics();
    taskmasterGraphics.fillStyle(0xf59e0b, 1); // Orange color
    taskmasterGraphics.fillCircle(32, 32, 32); // Circle
    taskmasterGraphics.generateTexture('taskmasterPlaceholder', 64, 64);
    taskmasterGraphics.destroy();

    // Check if texture loaded, use placeholder if not
    if (this.textures.exists('taskmaster')) {
      console.log('✅ Task Master sprite loaded');
      this.npc = this.physics.add.sprite(taskmasterX, taskmasterY, 'taskmaster');
      this.npc.setScale(0.40);
    } else {
      console.warn('⚠️ Task Master sprite not found, using placeholder');
      this.npc = this.physics.add.sprite(taskmasterX, taskmasterY, 'taskmasterPlaceholder');
      this.npc.setScale(1);
    }

    this.npc.setImmovable(true);
    this.npc.setDepth(10);
    this.npc.setAlpha(1); // Ensure visibility

    // Add NPC name tag
    this.npcNameTag = this.add.text(this.npc.x, this.npc.y - 20, 'Task Master', {
      fontSize: '11px',
      fill: '#fff',
      backgroundColor: '#f59e0b',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    this.npcNameTag.setDepth(11);

    // Add interaction prompt
    this.interactPrompt = this.add.text(this.npc.x, this.npc.y + 20, 'Tap to talk', {
      fontSize: '11px',
      fill: '#fff',
      backgroundColor: '#000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    this.interactPrompt.setVisible(false);
    this.interactPrompt.setDepth(11);
  }

  createDungeonNPC() {
    // Create Dungeon entrance at top above staircase
    const dungeonX = 530; // Adjusted to align with path
    const dungeonY = 150;

    // Create placeholder for Dungeon
    const dungeonGraphics = this.add.graphics();
    dungeonGraphics.fillStyle(0x4338ca, 1); // Purple/blue color
    dungeonGraphics.fillRect(0, 0, 100, 100); // Square
    dungeonGraphics.fillStyle(0x000000, 1); // Black for entrance
    dungeonGraphics.fillRect(30, 40, 40, 60); // Door opening
    dungeonGraphics.generateTexture('dungeonPlaceholder', 100, 100);
    dungeonGraphics.destroy();

    // Check if texture loaded, use placeholder if not
    if (this.textures.exists('dungeonSprite')) {
      console.log('✅ Dungeon sprite loaded');
      this.dungeonNPC = this.physics.add.sprite(dungeonX, dungeonY, 'dungeonSprite');
      this.dungeonNPC.setScale(0.90);
    } else {
      console.warn('⚠️ Dungeon sprite not found, using placeholder');
      this.dungeonNPC = this.physics.add.sprite(dungeonX, dungeonY, 'dungeonPlaceholder');
      this.dungeonNPC.setScale(1.5);
    }

    this.dungeonNPC.setImmovable(true);
    this.dungeonNPC.setDepth(10);
    this.dungeonNPC.setAlpha(1); // Ensure visibility

    // Add dungeon name tag
    this.dungeonNameTag = this.add.text(this.dungeonNPC.x, this.dungeonNPC.y - 22, 'Dungeon', {
      fontSize: '12px',
      fill: '#fff',
      backgroundColor: '#4338ca',
      padding: { x: 6, y: 3 }
    }).setOrigin(0.5);
    this.dungeonNameTag.setDepth(11);

    // Add interaction prompt
    this.dungeonInteractPrompt = this.add.text(this.dungeonNPC.x, this.dungeonNPC.y + 22, 'Tap to enter', {
      fontSize: '11px',
      fill: '#fff',
      backgroundColor: '#000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    this.dungeonInteractPrompt.setVisible(false);
    this.dungeonInteractPrompt.setDepth(11);
  }

  createQuestGiverNPC() {
    // Create Quest Giver in bottom-right area
    const questGiverX = 780;
    const questGiverY = 850;

    // Create placeholder sprite using graphics
    const graphics = this.add.graphics();
    graphics.fillStyle(0x9333ea, 1); // Purple color
    graphics.fillCircle(32, 32, 32); // Circle with 32px radius
    graphics.generateTexture('questGiverPlaceholder', 64, 64);
    graphics.destroy();

    this.questGiverNPC = this.physics.add.sprite(questGiverX, questGiverY, 'questGiverPlaceholder');

    this.questGiverNPC.setImmovable(true);
    this.questGiverNPC.setDepth(10);
    this.questGiverNPC.setScale(0.25);

    // Add quest giver name tag
    this.questGiverNameTag = this.add.text(this.questGiverNPC.x, this.questGiverNPC.y - 22, 'Quest Giver', {
      fontSize: '12px',
      fill: '#fff',
      backgroundColor: '#9333ea',
      padding: { x: 6, y: 3 }
    }).setOrigin(0.5);
    this.questGiverNameTag.setDepth(11);

    // Add interaction prompt
    this.questGiverInteractPrompt = this.add.text(this.questGiverNPC.x, this.questGiverNPC.y + 22, 'Tap for quests', {
      fontSize: '11px',
      fill: '#fff',
      backgroundColor: '#000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    this.questGiverInteractPrompt.setVisible(false);
    this.questGiverInteractPrompt.setDepth(11);
  }

  createTestDummy() {
    const dummyX = 620;
    const dummyY = 850;

    const graphics = this.add.graphics();
    graphics.fillStyle(0xd97706, 1);
    graphics.fillCircle(24, 24, 24);
    graphics.fillStyle(0x92400e, 1);
    graphics.fillRect(18, 8, 12, 12);
    graphics.generateTexture('testDummyPlaceholder', 48, 48);
    graphics.destroy();

    this.testDummy = this.physics.add.sprite(dummyX, dummyY, 'testDummyPlaceholder');
    this.testDummy.setImmovable(true);
    this.testDummy.setDepth(10);
    this.testDummy.setScale(0.6);

    this.testDummyNameTag = this.add.text(this.testDummy.x, this.testDummy.y - 18, 'Test Dummy', {
      fontSize: '11px',
      fill: '#fff',
      backgroundColor: '#d97706',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    this.testDummyNameTag.setDepth(11);

    this.testDummyPrompt = this.add.text(this.testDummy.x, this.testDummy.y + 18, 'Tap for 10 XP', {
      fontSize: '11px',
      fill: '#fff',
      backgroundColor: '#000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    this.testDummyPrompt.setVisible(false);
    this.testDummyPrompt.setDepth(11);
  }

  createCollisionBarriers() {
    this.barriers = this.physics.add.staticGroup();

    // Set true to visualize barrier boxes for debugging
    const DEBUG_SHOW = false;

    const addBarrier = (x, y, w, h) => {
      this.barriers.create(x, y, null).setSize(w, h).setVisible(false);
      if (DEBUG_SHOW) {
        this.add.rectangle(x, y, w, h, 0xff0000, 0.3).setDepth(100);
      }
    };

    // === BUILDINGS ===
    // Red house (upper area, left of main path)
    addBarrier(300, 310, 190, 110);
    // Blue house (middle-left)
    addBarrier(200, 540, 175, 100);
    // Green shop (middle-right, "SHOP" sign)
    addBarrier(710, 485, 170, 115);
    // Large green house (lower center)
    addBarrier(500, 845, 225, 110);
    // Farm fence and plot (bottom-right)
    addBarrier(630, 1045, 200, 100);

    // === RIVER & WATERFALL ===
    // Waterfall cliff face (top-right)
    addBarrier(920, 80, 260, 160);
    // River above bridge
    addBarrier(890, 220, 200, 80);
    // River below bridge (south-flowing)
    addBarrier(855, 370, 180, 180);
    // River lower section
    addBarrier(870, 500, 160, 100);

    // === FOREST BORDERS ===
    // Top forest — left portion (gap at x~480-580 for dungeon path)
    addBarrier(220, 50, 440, 100);
    // Top forest — right portion
    addBarrier(810, 50, 430, 100);
    // Left forest edge
    addBarrier(30, 500, 60, 1000);
    addBarrier(40, 1200, 80, 500);
    // Right forest edge (below river)
    addBarrier(995, 700, 60, 700);
    // Bottom forest edge
    addBarrier(512, 1500, 1024, 80);

    // === PROMINENT TREES / ROCKS ===
    // Large tree cluster bottom-left
    addBarrier(140, 970, 110, 90);
    // Rock formation upper-left
    addBarrier(115, 200, 70, 50);
    // Trees flanking upper path
    addBarrier(195, 240, 60, 50);
    addBarrier(440, 230, 60, 50);

    this.physics.add.collider(this.player, this.barriers);
  }

  createUI() {
    // UI is now handled by React overlay for mobile
    // No in-game instructions needed
  }


  update() {
    if (!this.player) return;

    // If modal is open, stop all game input processing
    if (this.isModalOpen) {
      this.player.setVelocity(0);
      return;
    }

    // Player movement - touch only
    this.player.setVelocity(0);

    let isMoving = false;
    let newDirection = this.lastDirection;

    // Check if touch/drag input is active
    if (this.isDragging && (this.moveVector.x !== 0 || this.moveVector.y !== 0)) {
      this.player.setVelocity(this.moveVector.x, this.moveVector.y);
      isMoving = true;

      const absX = Math.abs(this.moveVector.x);
      const absY = Math.abs(this.moveVector.y);

      if (absX > absY) {
        newDirection = this.moveVector.x > 0 ? 'right' : 'left';
      } else {
        newDirection = this.moveVector.y > 0 ? 'down' : 'up';
      }
    }

    // Update animation based on movement (Mana Seed ms_ prefix)
    if (isMoving) {
      const animKey = `ms_walk_${newDirection}`;
      if (this.player.anims.currentAnim?.key !== animKey) {
        this.player.play(animKey, true);
      }
      this.lastDirection = newDirection;
    } else {
      const idleKey = `ms_idle_${this.lastDirection}`;
      if (this.player.anims.currentAnim?.key !== idleKey) {
        this.player.play(idleKey, true);
      }
    }

    // Sync paper doll layers with base sprite
    this.syncPlayerLayers();

    // Check distance to NPC for interaction
    const distance = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      this.npc.x, this.npc.y
    );

    if (distance < 60) {
      this.canInteract = true;
      this.interactPrompt.setVisible(true);
    } else {
      this.canInteract = false;
      this.interactPrompt.setVisible(false);
    }

    // Check distance to Dungeon NPC for interaction
    const dungeonDistance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.dungeonNPC.x,
      this.dungeonNPC.y
    );

    if (dungeonDistance < 70) {
      this.canInteractDungeon = true;
      this.dungeonInteractPrompt.setVisible(true);
    } else {
      this.canInteractDungeon = false;
      this.dungeonInteractPrompt.setVisible(false);
    }

    // Check distance to Quest Giver NPC for interaction
    const questGiverDistance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.questGiverNPC.x,
      this.questGiverNPC.y
    );

    if (questGiverDistance < 70) {
      this.canInteractQuestGiver = true;
      this.questGiverInteractPrompt.setVisible(true);
    } else {
      this.canInteractQuestGiver = false;
      this.questGiverInteractPrompt.setVisible(false);
    }

    // Check distance to Test Dummy for interaction
    const testDummyDistance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.testDummy.x,
      this.testDummy.y
    );

    if (testDummyDistance < 70) {
      this.canInteractTestDummy = true;
      this.testDummyPrompt.setVisible(true);
    } else {
      this.canInteractTestDummy = false;
      this.testDummyPrompt.setVisible(false);
    }
  }

  onPointerDown(pointer) {
    // Start background music on first user interaction (browser autoplay policy)
    if (!this.musicStarted && this.townMusic) {
      console.log('🎵 Starting town music...');
      try {
        const playResult = this.townMusic.play();
        console.log('🎵 Music play result:', playResult);
        this.musicStarted = true;
      } catch (error) {
        console.error('❌ Error playing music:', error);
      }
    }

    // Ignore if modal is open
    if (this.isModalOpen) return;

    this.isDragging = true;
    this.dragStartX = pointer.worldX; // Use world coordinates
    this.dragStartY = pointer.worldY; // Use world coordinates
    this.dragStartTime = Date.now();
  }

  onPointerMove(pointer) {
    // Ignore if modal is open or not dragging
    if (this.isModalOpen || !this.isDragging) return;

    // Calculate drag delta (in world coordinates)
    const deltaX = pointer.worldX - this.dragStartX;
    const deltaY = pointer.worldY - this.dragStartY;

    // Convert to movement vector (normalized for consistent speed)
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > 5) { // Minimum drag threshold
      const speed = 160;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      // 4-direction only: move along the dominant axis
      if (absX > absY) {
        this.moveVector.x = (deltaX > 0 ? 1 : -1) * speed;
        this.moveVector.y = 0;
      } else {
        this.moveVector.x = 0;
        this.moveVector.y = (deltaY > 0 ? 1 : -1) * speed;
      }
    } else {
      this.moveVector.x = 0;
      this.moveVector.y = 0;
    }
  }

  onPointerUp(pointer) {
    // Calculate drag distance and duration for tap detection
    const dragDistance = Phaser.Math.Distance.Between(
      this.dragStartX,
      this.dragStartY,
      pointer.worldX,
      pointer.worldY
    );
    const dragDuration = Date.now() - this.dragStartTime;

    // Detect tap (small movement, short duration)
    const isTap = dragDistance < 10 && dragDuration < 300;

    if (isTap && !this.isModalOpen) {
      // Check if tapped on NPC
      const npcBounds = this.npc.getBounds();
      const tappedOnNPC = npcBounds.contains(pointer.worldX, pointer.worldY);

      // Check if player is within interaction range
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.npc.x,
        this.npc.y
      );

      if (tappedOnNPC && distance < 60) {
        this.openTaskModal();
      }

      // Check if tapped on Dungeon NPC
      const dungeonBounds = this.dungeonNPC.getBounds();
      const tappedOnDungeon = dungeonBounds.contains(pointer.worldX, pointer.worldY);

      // Check if player is within interaction range
      const dungeonDistance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.dungeonNPC.x,
        this.dungeonNPC.y
      );

      if (tappedOnDungeon && dungeonDistance < 70) {
        this.openBattle();
      }

      // Check if tapped on Quest Giver NPC
      const questGiverBounds = this.questGiverNPC.getBounds();
      const tappedOnQuestGiver = questGiverBounds.contains(pointer.worldX, pointer.worldY);

      // Check if player is within interaction range
      const questGiverDistance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.questGiverNPC.x,
        this.questGiverNPC.y
      );

      if (tappedOnQuestGiver && questGiverDistance < 70) {
        this.openWeeklyQuests();
      }

      // Check if tapped on Test Dummy
      const testDummyBounds = this.testDummy.getBounds();
      const tappedOnTestDummy = testDummyBounds.contains(pointer.worldX, pointer.worldY);

      const testDummyDist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.testDummy.x,
        this.testDummy.y
      );

      if (tappedOnTestDummy && testDummyDist < 70) {
        this.game.events.emit('test-xp');
      }
    }

    // Reset drag state
    this.isDragging = false;
    this.moveVector.x = 0;
    this.moveVector.y = 0;
  }

  openTaskModal() {
    // Emit event to React to open the modal
    this.game.events.emit('open-task-modal');
  }

  openBattle() {
    // Emit event to React to show dungeon confirmation
    this.game.events.emit('dungeon-confirm');
  }

  openWeeklyQuests() {
    // Emit event to React to open the weekly quests modal
    this.game.events.emit('open-weekly-quests');
  }

  showXPGainFeedback(data) {
    // Create floating text animation
    const xpText = this.add.text(this.player.x, this.player.y - 40, `+${data.xp} XP`, {
      fontSize: '20px',
      fill: data.color,
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);
    xpText.setDepth(100);

    // Create tier badge
    const tierText = this.add.text(this.player.x, this.player.y - 60, data.tier, {
      fontSize: '14px',
      fill: '#fff',
      backgroundColor: data.color,
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5);
    tierText.setDepth(100);

    // Animate both texts
    this.tweens.add({
      targets: [xpText, tierText],
      y: '-=80',
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        xpText.destroy();
        tierText.destroy();
      }
    });

    // Check if leveled up
    if (data.newStats.level > this.playerLevel) {
      this.showLevelUpAnimation(data.newStats.level);
    }

    // Particle effect
    const particles = this.add.particles(this.player.x, this.player.y, 'ms_base_v01', {
      speed: { min: -100, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.3, end: 0 },
      blendMode: 'ADD',
      lifespan: 1000,
      gravityY: -50,
      quantity: 10,
      tint: parseInt(data.color.replace('#', '0x'))
    });

    this.time.delayedCall(1000, () => {
      particles.destroy();
    });
  }

  showLevelUpAnimation(newLevel) {
    // Position at center of screen
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    const levelUpText = this.add.text(centerX, centerY, `LEVEL UP!\nLevel ${newLevel}`, {
      fontSize: '48px',
      fill: '#fbbf24',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 6,
      align: 'center'
    }).setOrigin(0.5);
    levelUpText.setScrollFactor(0);
    levelUpText.setDepth(200);
    levelUpText.setScale(0);

    // Animate level up text
    this.tweens.add({
      targets: levelUpText,
      scale: 1.2,
      duration: 500,
      ease: 'Back.easeOut',
      yoyo: true,
      onComplete: () => {
        this.tweens.add({
          targets: levelUpText,
          alpha: 0,
          duration: 500,
          delay: 1000,
          onComplete: () => {
            levelUpText.destroy();
          }
        });
      }
    });
  }
}
