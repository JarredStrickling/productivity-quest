import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.player = null;
    this.npc = null;
    this.dungeonNPC = null;
    this.canInteract = false;
    this.canInteractDungeon = false;
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
    const cacheBust = `?v=20`; // Fixed disappearing frame (5 frames per direction)

    // Load town map
    this.load.image('townMap', `/assets/sprites/map1.png${cacheBust}`);

    // Load NPC sprites
    this.load.image('taskmaster', `/assets/sprites/taskmaster.png${cacheBust}`);
    this.load.image('taskboard', `/assets/sprites/taskboard.png${cacheBust}`);
    this.load.image('dungeonSprite', `/assets/sprites/dungeon.png${cacheBust}`);


    // Load sprite sheets for each class
    // Paladin uses full 256x256 frames (1024x1024 total, 4 rows x 4 cols)
    this.load.spritesheet('paladin', `/assets/sprites/paladin.png${cacheBust}`, {
      frameWidth: 256,
      frameHeight: 256
    });
    this.load.spritesheet('warrior', `/assets/sprites/warrior.png${cacheBust}`, {
      frameWidth: 256,
      frameHeight: 512
    });
    this.load.spritesheet('mage', `/assets/sprites/mage.png${cacheBust}`, {
      frameWidth: 256,
      frameHeight: 512
    });
    this.load.spritesheet('archer', `/assets/sprites/archer.png${cacheBust}`, {
      frameWidth: 256,
      frameHeight: 512
    });
    this.load.spritesheet('cleric', `/assets/sprites/cleric.png${cacheBust}`, {
      frameWidth: 256,
      frameHeight: 512
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

    // Add Productivity Board in center
    this.productivityBoard = this.add.image(512, 512, 'taskboard');
    this.productivityBoard.setDepth(5);
    this.productivityBoard.setScale(0.35); // Increased for visibility with zoom out

    // Add board name tag
    const boardNameTag = this.add.text(512, 420, 'Productivity Board', {
      fontSize: '12px',
      fill: '#fff',
      backgroundColor: '#10b981',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    boardNameTag.setDepth(11);
  }

  createPlayerAnimations(spriteKey) {
    // Create walking animations for each direction
    // Paladin: 256x256 frames, 1536x1024 total (6 frames wide x 4 rows tall)
    // Using 5 frames per direction (6th frame appears to be blank/empty)
    // Row 1 (frames 0-4): Walking DOWN
    // Row 2 (frames 6-10): Walking LEFT
    // Row 3 (frames 12-16): Walking RIGHT
    // Row 4 (frames 18-22): Walking UP

    // Walking DOWN (frames 0-4)
    this.anims.create({
      key: `${spriteKey}_walk_down`,
      frames: this.anims.generateFrameNumbers(spriteKey, { start: 0, end: 4 }),
      frameRate: 10,
      repeat: -1
    });

    // Walking LEFT (frames 6-10)
    this.anims.create({
      key: `${spriteKey}_walk_left`,
      frames: this.anims.generateFrameNumbers(spriteKey, { start: 6, end: 10 }),
      frameRate: 10,
      repeat: -1
    });

    // Walking RIGHT (frames 12-16)
    this.anims.create({
      key: `${spriteKey}_walk_right`,
      frames: this.anims.generateFrameNumbers(spriteKey, { start: 12, end: 16 }),
      frameRate: 10,
      repeat: -1
    });

    // Walking UP (frames 18-22)
    this.anims.create({
      key: `${spriteKey}_walk_up`,
      frames: this.anims.generateFrameNumbers(spriteKey, { start: 18, end: 22 }),
      frameRate: 10,
      repeat: -1
    });

    // Idle poses (first frame of each direction)
    this.anims.create({
      key: `${spriteKey}_idle_down`,
      frames: [{ key: spriteKey, frame: 0 }],
      frameRate: 1
    });

    this.anims.create({
      key: `${spriteKey}_idle_left`,
      frames: [{ key: spriteKey, frame: 6 }],
      frameRate: 1
    });

    this.anims.create({
      key: `${spriteKey}_idle_right`,
      frames: [{ key: spriteKey, frame: 12 }],
      frameRate: 1
    });

    this.anims.create({
      key: `${spriteKey}_idle_up`,
      frames: [{ key: spriteKey, frame: 18 }],
      frameRate: 1
    });

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
    // Scale based on sprite size: paladin is 256x256, scale to ~96px
    const scale = spriteKey === 'paladin' ? 0.375 : 0.2; // 256 * 0.375 = 96px
    this.player.setScale(scale);
    console.log('Player created at:', centerX, centerY, 'depth:', this.player.depth, 'scale:', this.player.scale);

    // Create animations
    this.createPlayerAnimations(spriteKey);
  }

  createNPC() {
    // Create Task Master in top right area (as requested)
    const taskmasterX = 850; // Top right area
    const taskmasterY = 200;
    this.npc = this.physics.add.sprite(taskmasterX, taskmasterY, 'taskmaster');

    this.npc.setImmovable(true);
    this.npc.setDepth(10);
    this.npc.setScale(0.2); // Increased for visibility with zoom out

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
    // Create Dungeon entrance in bottom-left area for balanced layout
    const dungeonX = 200;
    const dungeonY = 850;
    this.dungeonNPC = this.physics.add.sprite(dungeonX, dungeonY, 'dungeonSprite');

    this.dungeonNPC.setImmovable(true);
    this.dungeonNPC.setDepth(10);
    this.dungeonNPC.setScale(0.25); // Increased for visibility with zoom out

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
    // Emit event to React to open the battle modal
    this.game.events.emit('open-battle');
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
