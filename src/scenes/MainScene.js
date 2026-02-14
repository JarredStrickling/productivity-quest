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
    // Load sprite sheets for each class
    // Each sprite sheet should be 128x128 (4 frames x 32px wide, 4 directions x 32px tall)
    // Row 1: Walking DOWN, Row 2: Walking LEFT, Row 3: Walking RIGHT, Row 4: Walking UP

    // Add cache-busting timestamp to force reload
    const cacheBust = `?v=${Date.now()}`;

    this.load.spritesheet('paladin', `/assets/sprites/paladin.png${cacheBust}`, {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet('warrior', `/assets/sprites/warrior.png${cacheBust}`, {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet('mage', `/assets/sprites/mage.png${cacheBust}`, {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet('archer', `/assets/sprites/archer.png${cacheBust}`, {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet('cleric', `/assets/sprites/cleric.png${cacheBust}`, {
      frameWidth: 32,
      frameHeight: 32
    });
  }

  create() {
    // Get responsive dimensions
    const width = this.scale.width;
    const height = this.scale.height;

    // Set world bounds to match canvas size
    this.cameras.main.setBounds(0, 0, width, height);
    this.physics.world.setBounds(0, 0, width, height);

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

    // Camera follows player
    this.cameras.main.startFollow(this.player);

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
    // Use responsive dimensions
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Grass background - fill entire canvas
    const grass = this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x4ade80);

    // Town buildings (simple rectangles for now)
    // House 1 - position relative to canvas size
    const house1X = this.scale.width * 0.2;
    this.add.rectangle(house1X, 150, 120, 100, 0x8b4513);
    this.add.rectangle(house1X, 120, 120, 40, 0x991b1b); // roof

    // House 2 - position relative to canvas size
    const house2X = this.scale.width * 0.8;
    this.add.rectangle(house2X, 150, 120, 100, 0x8b4513);
    this.add.rectangle(house2X, 120, 120, 40, 0x991b1b);

    // Town center building (where NPC will be) - use center position
    const townCenterY = this.scale.height * 0.75;
    this.add.rectangle(centerX, townCenterY, 200, 150, 0x6366f1);
    this.add.rectangle(centerX, townCenterY - 50, 200, 50, 0x4338ca); // roof

    // Add some decorative trees - position relative to canvas
    this.createTree(this.scale.width * 0.15, this.scale.height * 0.67);
    this.createTree(this.scale.width * 0.85, this.scale.height * 0.67);
    this.createTree(this.scale.width * 0.3, this.scale.height * 0.83);
    this.createTree(this.scale.width * 0.7, this.scale.height * 0.83);

    // Path - center path with responsive sizing
    this.add.rectangle(centerX, centerY, 60, this.scale.height, 0xd4a574);
  }

  createTree(x, y) {
    this.add.rectangle(x, y + 15, 20, 30, 0x78350f); // trunk
    this.add.circle(x, y - 10, 25, 0x15803d); // leaves
  }

  createPlayer() {
    // Create player sprite at center of screen
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height * 0.4;

    // Use class sprite or default to paladin
    const spriteKey = this.playerClass || 'paladin';
    this.player = this.physics.add.sprite(centerX, centerY, spriteKey);

    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);

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
    // Create NPC near the town center building
    const centerX = this.scale.width / 2;
    const npcY = this.scale.height * 0.63;
    this.npc = this.physics.add.sprite(centerX, npcY, null);

    // Draw NPC as a different colored character
    const graphics = this.add.graphics();
    graphics.fillStyle(0xfbbf24, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture('npc', 32, 32);
    graphics.destroy();

    this.npc.setTexture('npc');
    this.npc.setImmovable(true);
    this.npc.setDepth(10);

    // Add NPC name tag
    const npcNameTag = this.add.text(this.npc.x, this.npc.y - 25, 'Task Master', {
      fontSize: '12px',
      fill: '#fff',
      backgroundColor: '#f59e0b',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    npcNameTag.setDepth(11);

    // Add interaction prompt
    this.interactPrompt = this.add.text(this.npc.x, this.npc.y + 30, 'Tap to talk', {
      fontSize: '14px',
      fill: '#fff',
      backgroundColor: '#000',
      padding: { x: 6, y: 4 }
    }).setOrigin(0.5);
    this.interactPrompt.setVisible(false);
    this.interactPrompt.setDepth(11);
  }

  createDungeonNPC() {
    // Create Dungeon entrance near bottom of map
    const dungeonX = this.scale.width / 2;
    const dungeonY = this.scale.height * 0.9;
    this.dungeonNPC = this.physics.add.sprite(dungeonX, dungeonY, null);

    // Draw dungeon entrance as a dark portal
    const graphics = this.add.graphics();
    graphics.fillStyle(0x4338ca, 1);
    graphics.fillRect(0, 0, 40, 40);
    graphics.generateTexture('dungeon', 40, 40);
    graphics.destroy();

    this.dungeonNPC.setTexture('dungeon');
    this.dungeonNPC.setImmovable(true);
    this.dungeonNPC.setDepth(10);

    // Add dungeon name tag
    const dungeonNameTag = this.add.text(this.dungeonNPC.x, this.dungeonNPC.y - 30, 'Dungeon', {
      fontSize: '14px',
      fill: '#fff',
      backgroundColor: '#4338ca',
      padding: { x: 6, y: 3 }
    }).setOrigin(0.5);
    dungeonNameTag.setDepth(11);

    // Add interaction prompt
    this.dungeonInteractPrompt = this.add.text(this.dungeonNPC.x, this.dungeonNPC.y + 35, 'Tap to enter', {
      fontSize: '14px',
      fill: '#fff',
      backgroundColor: '#000',
      padding: { x: 6, y: 4 }
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
    this.dragStartX = pointer.x;
    this.dragStartY = pointer.y;
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
      pointer.x,
      pointer.y
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
