import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.player = null;
    this.npc = null;
    this.canInteract = false;
    this.playerLevel = 1;
    this.playerClass = null;
    this.isModalOpen = false;

    // Touch/pointer input state
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragStartTime = 0;
    this.moveVector = { x: 0, y: 0 };
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
    this.player = this.physics.add.sprite(centerX, centerY, null);

    // Class-based colors
    const classColors = {
      paladin: 0xf59e0b,   // Gold
      warrior: 0xdc2626,   // Red
      mage: 0x3b82f6,      // Blue
      archer: 0x10b981,    // Green
      cleric: 0x8b5cf6     // Purple
    };

    const playerColor = this.playerClass
      ? classColors[this.playerClass]
      : 0x3b82f6;

    // Draw player as a simple character
    const graphics = this.add.graphics();
    graphics.fillStyle(playerColor, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture('player', 32, 32);
    graphics.destroy();

    this.player.setTexture('player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);

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

    // Check if touch/drag input is active
    if (this.isDragging && (this.moveVector.x !== 0 || this.moveVector.y !== 0)) {
      this.player.setVelocity(this.moveVector.x, this.moveVector.y);
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
