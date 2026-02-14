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
    const cacheBust = `?v=7`; // Zoom out 30%, double player size

    // Load town map
    this.load.image('townMap', `/assets/sprites/map1.png${cacheBust}`);

    // Load NPC sprites
    this.load.image('taskmaster', `/assets/sprites/taskmaster.png${cacheBust}`);
    this.load.image('taskboard', `/assets/sprites/taskboard.png${cacheBust}`);
    this.load.image('dungeonSprite', `/assets/sprites/dungeon.png${cacheBust}`);

    // Load sprite sheets for each class
    // Sprites are 1024x1536 (4 frames x 256px wide, 4 rows x 384px tall)
    // Row 0: Walking DOWN, Row 1: Walking LEFT, Row 2: Walking RIGHT, Row 3: Walking UP
    this.load.spritesheet('paladin', `/assets/sprites/paladin.png${cacheBust}`, {
      frameWidth: 256,
      frameHeight: 384
    });
    this.load.spritesheet('warrior', `/assets/sprites/warrior.png${cacheBust}`, {
      frameWidth: 256,
      frameHeight: 384
    });
    this.load.spritesheet('mage', `/assets/sprites/mage.png${cacheBust}`, {
      frameWidth: 256,
      frameHeight: 384
    });
    this.load.spritesheet('archer', `/assets/sprites/archer.png${cacheBust}`, {
      frameWidth: 256,
      frameHeight: 384
    });
    this.load.spritesheet('cleric', `/assets/sprites/cleric.png${cacheBust}`, {
      frameWidth: 256,
      frameHeight: 384
    });
  }

  create() {
    // Map is 1024x1024 - set world bounds to match
    const WORLD_WIDTH = 1024;
    const WORLD_HEIGHT = 1024;

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Enable pixel-perfect rendering for crisp sprites
    this.cameras.main.setRoundPixels(true);

    // Tile-based zoom: show ~14 tiles across screen for readable sprites
    const TILE_SIZE = 32;
    const TILES_ACROSS = 14;
    let zoom = this.scale.width / (TILES_ACROSS * TILE_SIZE);
    zoom = zoom * 0.7; // Zoom out 30% to show more of the town

    // Clamp zoom to prevent too zoomed in/out on different devices
    zoom = Phaser.Math.Clamp(zoom, 1.0, 2.0);
    this.cameras.main.setZoom(zoom);

    // Handle screen rotation and resize
    this.scale.on('resize', (gameSize) => {
      const TILE_SIZE = 32;
      const TILES_ACROSS = 14;
      let newZoom = gameSize.width / (TILES_ACROSS * TILE_SIZE);
      newZoom = newZoom * 0.7; // Zoom out 30%
      newZoom = Phaser.Math.Clamp(newZoom, 1.0, 2.0);
      this.cameras.main.setZoom(newZoom);
    });

    // Create town background
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
      this.playerLevel = stats.level;
      this.playerClass = stats.characterClass;
      this.levelText.setText(`Lv ${stats.level}`);
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
  }

  createTown() {
    // Add town map background (1024x1024)
    const map = this.add.image(512, 512, 'townMap');
    map.setDepth(0);

    // Add Productivity Board in center
    this.productivityBoard = this.add.image(512, 512, 'taskboard');
    this.productivityBoard.setDepth(5);
    this.productivityBoard.setScale(0.18); // Scaled down for proper sizing

    // Add board name tag
    const boardNameTag = this.add.text(512, 420, 'Productivity Board', {
      fontSize: '12px',
      fill: '#fff',
      backgroundColor: '#10b981',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    boardNameTag.setDepth(11);
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
    this.player.setScale(0.3); // Scale for 256x384 sprite frames (doubled from 0.15)
    console.log('Player created at:', centerX, centerY, 'depth:', this.player.depth, 'scale:', this.player.scale);

    // Create walking animations for each direction
    // Assuming sprite sheet layout: Row 0=Down, Row 1=Left, Row 2=Right, Row 3=Up
    // Each row has 4 frames (idle + 3 walking frames)

    // Walking DOWN (row 0, frames 0-3)
    this.anims.create({
      key: `${spriteKey}_walk_down`,
      frames: this.anims.generateFrameNumbers(spriteKey, { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });

    // Walking LEFT (row 1, frames 4-7)
    this.anims.create({
      key: `${spriteKey}_walk_left`,
      frames: this.anims.generateFrameNumbers(spriteKey, { start: 4, end: 7 }),
      frameRate: 8,
      repeat: -1
    });

    // Walking RIGHT (row 2, frames 8-11)
    this.anims.create({
      key: `${spriteKey}_walk_right`,
      frames: this.anims.generateFrameNumbers(spriteKey, { start: 8, end: 11 }),
      frameRate: 8,
      repeat: -1
    });

    // Walking UP (row 3, frames 12-15)
    this.anims.create({
      key: `${spriteKey}_walk_up`,
      frames: this.anims.generateFrameNumbers(spriteKey, { start: 12, end: 15 }),
      frameRate: 8,
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
      frames: [{ key: spriteKey, frame: 4 }],
      frameRate: 1
    });

    this.anims.create({
      key: `${spriteKey}_idle_right`,
      frames: [{ key: spriteKey, frame: 8 }],
      frameRate: 1
    });

    this.anims.create({
      key: `${spriteKey}_idle_up`,
      frames: [{ key: spriteKey, frame: 12 }],
      frameRate: 1
    });

    // Start with idle down animation
    this.player.play(`${spriteKey}_idle_down`);

    // Add player name tag
    this.playerNameTag = this.add.text(0, 0, 'You', {
      fontSize: '12px',
      fill: '#fff',
      backgroundColor: '#000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    this.playerNameTag.setDepth(11);

    // Add level indicator on player
    this.levelText = this.add.text(0, 0, 'Lv 1', {
      fontSize: '11px',
      fill: '#fbbf24',
      backgroundColor: '#000',
      padding: { x: 3, y: 1 }
    }).setOrigin(0.5);
    this.levelText.setDepth(11);
  }

  createNPC() {
    // Create Task Master in top right area (as requested)
    const taskmasterX = 850; // Top right area
    const taskmasterY = 200;
    this.npc = this.physics.add.sprite(taskmasterX, taskmasterY, 'taskmaster');

    this.npc.setImmovable(true);
    this.npc.setDepth(10);
    this.npc.setScale(0.1); // Scaled down for proper sizing

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
    this.dungeonNPC.setScale(0.12); // Scaled down for proper sizing

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

    // Update player name tag position (always do this)
    this.playerNameTag.setPosition(this.player.x, this.player.y - 25);
    this.levelText.setPosition(this.player.x, this.player.y + 25);

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
