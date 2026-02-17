import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.player = null;
    this.npc = null;
    this.dungeonNPC = null;
    this.questGiverNPC = null;
    this.barriers = null;
    this.canInteract = false;
    this.canInteractDungeon = false;
    this.canInteractQuestGiver = false;
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
    const cacheBust = `?v=21`; // Arena update - force sprite reload

    // Load town map
    this.load.image('townMap', `/assets/sprites/map1.png${cacheBust}`);

    // Load NPC sprites
    this.load.image('taskmaster', `/assets/sprites/taskmaster.png${cacheBust}`);
    this.load.image('taskboard', `/assets/sprites/taskboard.png${cacheBust}`);
    this.load.image('dungeonSprite', `/assets/sprites/dungeon.png${cacheBust}`);

    // Load battle arena assets
    this.load.image('arenaBackground', `/assets/sprites/ARENA1background.png${cacheBust}`);
    this.load.image('orcBaddie', `/assets/sprites/Baddiearena1.png${cacheBust}`);


    // Load sprite sheets for each class
    // Paladin: 256x256 frames (original working configuration)
    // Others: 128x128 frames (1536x1024 sprite sheets, 12x8 grid)
    this.load.spritesheet('paladin', `/assets/sprites/paladin.png${cacheBust}`, {
      frameWidth: 256,
      frameHeight: 256
    });
    this.load.spritesheet('warrior', `/assets/sprites/warrior.png${cacheBust}`, {
      frameWidth: 128,
      frameHeight: 128
    });
    this.load.spritesheet('mage', `/assets/sprites/mage.png${cacheBust}`, {
      frameWidth: 128,
      frameHeight: 128
    });
    this.load.spritesheet('archer', `/assets/sprites/archer.png${cacheBust}`, {
      frameWidth: 128,
      frameHeight: 128
    });
    this.load.spritesheet('cleric', `/assets/sprites/cleric.png${cacheBust}`, {
      frameWidth: 128,
      frameHeight: 128
    });

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
    zoom = zoom * 0.5; // Zoom out 50% to show more of the town - using 0.5 for cleaner pixel alignment

    // Round to nearest 0.5 increment for crisp pixel rendering
    zoom = Math.round(zoom * 2) / 2;

    // Clamp zoom to prevent too zoomed in/out on different devices
    zoom = Phaser.Math.Clamp(zoom, 0.5, 2.0); // Using 0.5 instead of 0.4 for integer-like scaling
    this.cameras.main.setZoom(zoom);

    // Handle screen rotation and resize
    this.scale.on('resize', (gameSize) => {
      const TILE_SIZE = 32;
      const TILES_ACROSS = 14;
      let newZoom = gameSize.width / (TILES_ACROSS * TILE_SIZE);
      newZoom = newZoom * 0.5; // Zoom out 50% - using 0.5 for cleaner pixel alignment

      // Round to nearest 0.5 increment for crisp pixel rendering
      newZoom = Math.round(newZoom * 2) / 2;

      newZoom = Phaser.Math.Clamp(newZoom, 0.5, 2.0); // Using 0.5 for integer-like scaling
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
      const classChanged = this.playerClass !== stats.characterClass;
      this.playerLevel = stats.level;
      this.playerClass = stats.characterClass;

      // Recreate player if class changed
      if (classChanged && this.player) {
        const oldX = this.player.x;
        const oldY = this.player.y;
        this.player.destroy();

        // Recreate player at same position
        const centerX = oldX;
        const centerY = oldY;
        const spriteKey = this.playerClass;
        this.player = this.physics.add.sprite(centerX, centerY, spriteKey);
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(50);
        // Scale based on sprite size: paladin is 256x256, scale to ~96px
        const scale = spriteKey === 'paladin' ? 0.375 : 0.2; // 256 * 0.375 = 96px
        this.player.setScale(scale);

        // Recreate animations for new class
        this.createPlayerAnimations(spriteKey);

        // Restart camera follow
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
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
      this.productivityBoard.setScale(0.15);
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

  createPlayerAnimations(spriteKey) {
    // Paladin uses 256x256 frames (4x4 grid) - original working config
    // Others use 128x128 frames (12x8 grid)
    const isPaladin = spriteKey === 'paladin';

    if (isPaladin) {
      // Paladin: 4x4 grid (256x256 frames)
      // Row 1 (Down): frame 1 = idle, frames 2-4 = walk
      // Row 2 (Left): frame 7 = idle, frames 8-10 = walk
      // Row 3 (Right): frame 13 = idle, frames 14-16 = walk
      // Row 4 (Up): frame 19 = idle, frames 20-22 = walk

      this.anims.create({
        key: `${spriteKey}_walk_down`,
        frames: this.anims.generateFrameNumbers(spriteKey, { start: 2, end: 4 }),
        frameRate: 10,
        repeat: -1
      });

      this.anims.create({
        key: `${spriteKey}_walk_left`,
        frames: this.anims.generateFrameNumbers(spriteKey, { start: 8, end: 10 }),
        frameRate: 10,
        repeat: -1
      });

      this.anims.create({
        key: `${spriteKey}_walk_right`,
        frames: this.anims.generateFrameNumbers(spriteKey, { start: 14, end: 16 }),
        frameRate: 10,
        repeat: -1
      });

      this.anims.create({
        key: `${spriteKey}_walk_up`,
        frames: this.anims.generateFrameNumbers(spriteKey, { start: 20, end: 22 }),
        frameRate: 10,
        repeat: -1
      });

      this.anims.create({
        key: `${spriteKey}_idle_down`,
        frames: [{ key: spriteKey, frame: 1 }],
        frameRate: 1
      });

      this.anims.create({
        key: `${spriteKey}_idle_left`,
        frames: [{ key: spriteKey, frame: 7 }],
        frameRate: 1
      });

      this.anims.create({
        key: `${spriteKey}_idle_right`,
        frames: [{ key: spriteKey, frame: 13 }],
        frameRate: 1
      });

      this.anims.create({
        key: `${spriteKey}_idle_up`,
        frames: [{ key: spriteKey, frame: 19 }],
        frameRate: 1
      });
    } else {
      // Other classes: 12x8 grid (128x128 frames)
      // Row 0 (Down): frames 0-11 (idle=0, walk=1-3)
      // Row 1 (Left): frames 12-23 (idle=12, walk=13-15)
      // Row 2 (Right): frames 24-35 (idle=24, walk=25-27)
      // Row 3 (Up): frames 36-47 (idle=36, walk=37-39)

      this.anims.create({
        key: `${spriteKey}_walk_down`,
        frames: this.anims.generateFrameNumbers(spriteKey, { start: 1, end: 3 }),
        frameRate: 10,
        repeat: -1
      });

      this.anims.create({
        key: `${spriteKey}_walk_left`,
        frames: this.anims.generateFrameNumbers(spriteKey, { start: 13, end: 15 }),
        frameRate: 10,
        repeat: -1
      });

      this.anims.create({
        key: `${spriteKey}_walk_right`,
        frames: this.anims.generateFrameNumbers(spriteKey, { start: 25, end: 27 }),
        frameRate: 10,
        repeat: -1
      });

      this.anims.create({
        key: `${spriteKey}_walk_up`,
        frames: this.anims.generateFrameNumbers(spriteKey, { start: 37, end: 39 }),
        frameRate: 10,
        repeat: -1
      });

      this.anims.create({
        key: `${spriteKey}_idle_down`,
        frames: [{ key: spriteKey, frame: 0 }],
        frameRate: 1
      });

      this.anims.create({
        key: `${spriteKey}_idle_left`,
        frames: [{ key: spriteKey, frame: 12 }],
        frameRate: 1
      });

      this.anims.create({
        key: `${spriteKey}_idle_right`,
        frames: [{ key: spriteKey, frame: 24 }],
        frameRate: 1
      });

      this.anims.create({
        key: `${spriteKey}_idle_up`,
        frames: [{ key: spriteKey, frame: 36 }],
        frameRate: 1
      });
    }

    // Start with idle down animation
    this.player.play(`${spriteKey}_idle_down`);
  }

  createPlayer() {
    // Create player sprite near center of world map
    const centerX = 512;
    const centerY = 600; // Slightly below center

    // Use class sprite or default to paladin
    const spriteKey = this.playerClass || 'paladin';
    console.log('Creating player with sprite:', spriteKey);
    this.player = this.physics.add.sprite(centerX, centerY, spriteKey);

    this.player.setCollideWorldBounds(true);
    this.player.setDepth(50); // Increased depth to ensure above everything
    // Paladin uses 256x256 frames, others use 128x128 frames
    // Scale to similar visual size (~60-96px)
    const scale = spriteKey === 'paladin' ? 0.375 : 0.75; // Paladin: 256*0.375=96px, Others: 128*0.75=96px
    this.player.setScale(scale);
    console.log('Player created at:', centerX, centerY, 'depth:', this.player.depth, 'scale:', this.player.scale);

    // Create animations
    this.createPlayerAnimations(spriteKey);
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
      this.npc.setScale(0.15);
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
      this.dungeonNPC.setScale(0.225);
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

  createCollisionBarriers() {
    // Create a group for all collision barriers
    this.barriers = this.physics.add.staticGroup();

    // Water barriers (right side river)
    this.barriers.create(900, 300, null).setSize(250, 600).setVisible(false);

    // Houses (approximate positions based on typical town layout)
    // Bottom-left houses
    this.barriers.create(120, 350, null).setSize(100, 80).setVisible(false);
    this.barriers.create(120, 500, null).setSize(100, 80).setVisible(false);

    // Bottom-right houses
    this.barriers.create(900, 500, null).setSize(100, 80).setVisible(false);
    this.barriers.create(900, 650, null).setSize(100, 80).setVisible(false);

    // Top area structures
    this.barriers.create(150, 200, null).setSize(120, 100).setVisible(false);
    this.barriers.create(800, 200, null).setSize(100, 80).setVisible(false);

    // Center buildings/obstacles
    this.barriers.create(300, 250, null).setSize(80, 70).setVisible(false);
    this.barriers.create(650, 300, null).setSize(90, 75).setVisible(false);

    // Add collision between player and barriers
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

    // Get sprite key for animations
    const spriteKey = this.playerClass || 'paladin';
    let isMoving = false;
    let newDirection = this.lastDirection;

    // Check if touch/drag input is active
    if (this.isDragging && (this.moveVector.x !== 0 || this.moveVector.y !== 0)) {
      this.player.setVelocity(this.moveVector.x, this.moveVector.y);
      isMoving = true;

      // Determine animation direction based on movement vector
      const absX = Math.abs(this.moveVector.x);
      const absY = Math.abs(this.moveVector.y);

      if (absX > absY) {
        // Moving more horizontally
        newDirection = this.moveVector.x > 0 ? 'right' : 'left';
      } else {
        // Moving more vertically
        newDirection = this.moveVector.y > 0 ? 'down' : 'up';
      }
    }

    // Update animation based on movement
    if (isMoving) {
      const animKey = `${spriteKey}_walk_${newDirection}`;
      if (this.player.anims.currentAnim?.key !== animKey) {
        this.player.play(animKey, true);
      }
      this.lastDirection = newDirection;
    } else {
      // Play idle animation
      const idleKey = `${spriteKey}_idle_${this.lastDirection}`;
      if (this.player.anims.currentAnim?.key !== idleKey) {
        this.player.play(idleKey, true);
      }
    }

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
      this.moveVector.x = (deltaX / distance) * speed;
      this.moveVector.y = (deltaY / distance) * speed;
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
    const particles = this.add.particles(this.player.x, this.player.y, 'player', {
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
