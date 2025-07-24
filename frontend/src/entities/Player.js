export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, frame, isLocal = false) {
        super(scene, x, y, 'player_walk', 8); // 默认 idle 第一帧
        
        this.scene = scene;
        this.isLocal = isLocal;
        
        // 添加到场景和物理系统
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // 设置物理属性
        this.setCollideWorldBounds(true);
        this.setBounce(0.1);
        this.setGravityY(600);
        // 设置更小的碰撞体积
        this.setSize(100, 120);
        
        // 玩家状态
        this.health = 100;
        this.maxHealth = 100;
        this.isAttacking = false;
        this.isDefending = false;
        this.isJumping = false;
        this.attackCooldown = 0;
        this.defenseCooldown = 0;
        
        // 动画状态
        this.facingDirection = 1; // 1 = 右, -1 = 左
        
        // 创建血条
        this.createHealthBar();
        
        // 设置输入控制（仅本地玩家）
        if (isLocal) {
            this.setupControls();
        }
    }
    
    createHealthBar() {
        const barWidth = 50;
        const barHeight = 6;
        
        this.healthBarBg = this.scene.add.rectangle(
            this.x, this.y - 80, 
            barWidth, barHeight, 
            0x000000, 0.8
        );
        
        this.healthBar = this.scene.add.rectangle(
            this.x, this.y - 80, 
            barWidth, barHeight, 
            0xff0000, 1
        );
        
        this.healthBar.setOrigin(0, 0.5);
        this.healthBarBg.setOrigin(0, 0.5);
    }
    
    setupControls() {
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.wasd = this.scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.SPACE,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        // 新增 J/K 键
        this.jk = this.scene.input.keyboard.addKeys({
            melee: Phaser.Input.Keyboard.KeyCodes.J,
            ranged: Phaser.Input.Keyboard.KeyCodes.K
        });
        // 鼠标输入
        this.scene.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.meleeAttack();
            } else if (pointer.rightButtonDown()) {
                this.rangedAttack();
            }
        });
    }
    
    update() {
        if (this.isLocal) {
            // 更新冷却时间
            if (this.attackCooldown > 0) this.attackCooldown--;
            if (this.defenseCooldown > 0) this.defenseCooldown--;
            // 处理移动输入
            this.handleMovement();
            // J/K 键攻击
            if (Phaser.Input.Keyboard.JustDown(this.jk.melee)) {
                this.meleeAttack();
            }
            if (Phaser.Input.Keyboard.JustDown(this.jk.ranged)) {
                this.rangedAttack();
            }
        }
        // 更新血条位置
        this.updateHealthBar();
        // 更新动画
        this.updateAnimation();
    }
    
    handleMovement() {
        const speed = 200;
        
        // 重置速度
        this.setVelocityX(0);
        
        // 水平移动
        if (this.wasd.right.isDown) {
            this.setVelocityX(speed);
            this.facingDirection = 1;
            this.setFlipX(false);
        } else if (this.wasd.left.isDown) {
            this.setVelocityX(-speed);
            this.facingDirection = -1;
            this.setFlipX(true);
        }
        
        // 跳跃
        if (this.wasd.up.isDown && this.body.touching.down && !this.isJumping) {
            this.setVelocityY(-400);
            this.isJumping = true;
        }
        
        // 重置跳跃状态
        if (this.body.touching.down) {
            this.isJumping = false;
        }
        
        // 防御（A键）
        if (this.wasd.left.isDown && this.defenseCooldown === 0) {
            this.defend();
        } else {
            this.isDefending = false;
        }
    }
    
    meleeAttack(remote = false) {
        if ((this.attackCooldown > 0 || this.isAttacking) && !remote) return;
        
        this.isAttacking = true;
        this.attackCooldown = 30;
        
        // 同步攻击到多人对战系统
        if (this.isLocal && this.scene.synq && this.scene.synq.view && !remote) {
            this.scene.synq.view.publish('global', 'player-attack', {
                id: this.playerId,
                type: 'melee',
                direction: this.facingDirection
            });
        }
        
        // 创建近战攻击效果
        const attackRange = 60;
        const attackX = this.x + (this.facingDirection * attackRange);
        const attackY = this.y - 20;
        
        // 创建攻击碰撞箱
        const attackBox = this.scene.add.rectangle(attackX, attackY, 40, 40, 0xff0000, 0.5);
        this.scene.physics.add.existing(attackBox);
        
        // 检测攻击碰撞
        const hitTargets = new Set();
        this.scene.physics.add.overlap(attackBox, this.scene.players, (attackBox, target) => {
            if (target !== this && !target.isDefending && !hitTargets.has(target)) {
                hitTargets.add(target);
                target.takeDamage(20);
            }
        });
        
        // 攻击动画效果
        this.scene.tweens.add({
            targets: attackBox,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                attackBox.destroy();
                this.isAttacking = false;
            }
        });
    }
    
    rangedAttack(remote = false) {
        if (this.attackCooldown > 0 && !remote) return;
        
        this.attackCooldown = 60;
        
        // 同步攻击到多人对战系统
        if (this.isLocal && this.scene.synq && this.scene.synq.view && !remote) {
            this.scene.synq.view.publish('global', 'player-attack', {
                id: this.playerId,
                type: 'ranged',
                direction: this.facingDirection
            });
        }
        
        // 创建远程攻击弹丸
        const projectile = this.scene.add.image(
            this.x + (this.facingDirection * 30), 
            this.y - 20, 
            'taco'
        );
        projectile.setDisplaySize(50, 50); // 根据需要调整弹丸大小

        this.scene.physics.add.existing(projectile);
        projectile.body.setVelocityX(this.facingDirection * 400);
        
        // 检测弹丸碰撞
        this.scene.physics.add.overlap(projectile, this.scene.players, (projectile, target) => {
            if (target !== this && !target.isDefending) {
                target.takeDamage(15);
            }
            if (target != this) {
                projectile.destroy();
            }
        });
        
        // 弹丸生命周期
        this.scene.time.delayedCall(2000, () => {
            if (projectile.active) {
                projectile.destroy();
            }
        });
    }
    
    defend() {
        this.isDefending = true;
        this.defenseCooldown = 20;
        
        // 防御效果
        this.setTint(0x00ff00);
        this.scene.time.delayedCall(200, () => {
            this.clearTint();
        });
    }
    
    takeDamage(damage) {
        if (this.isDefending) {
            damage = Math.floor(damage * 0.3); // 防御减少70%伤害
        }
        
        this.health = Math.max(0, this.health - damage);
        
        // 受伤闪烁效果
        this.scene.tweens.add({
            targets: this,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 2
        });
        
        // 检查死亡
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        this.setTint(0xff0000);
        this.setVelocity(0, 0);
        this.body.setEnable(false);
        
        // 游戏结束逻辑
        this.scene.gameOver(this);
    }
    
    updateHealthBar() {
        const barWidth = 50;
        const healthPercent = this.health / this.maxHealth;
        
        this.healthBarBg.setPosition(this.x - 25, this.y - 80);
        this.healthBar.setPosition(this.x - 25, this.y - 80);
        this.healthBar.setScale(healthPercent, 1);
        
        // 根据血量改变颜色
        if (healthPercent > 0.6) {
            this.healthBar.setFillStyle(0x00ff00);
        } else if (healthPercent > 0.3) {
            this.healthBar.setFillStyle(0xffff00);
        } else {
            this.healthBar.setFillStyle(0xff0000);
        }
    }
    
    updateAnimation() {
        // 找到对手
        const opponent = this.scene.players.find(p => p !== this);
        if (opponent) {
            // 如果对手在左边，面朝左；在右边，面朝右
            this.setFlipX(opponent.x < this.x);
        }
        // 根据移动状态更新动画
        if (this.body.velocity.x > 0) {
            this.anims.play('walk_right', true);
        } else if (this.body.velocity.x < 0) {
            this.anims.play('walk_left', true);
        } else {
            this.anims.play('idle', true);
        }
    }
} 