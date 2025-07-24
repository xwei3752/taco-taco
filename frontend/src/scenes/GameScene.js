import { Player } from '../entities/Player.js';
import * as Multisynq from "@multisynq/client";
import { BrowserProvider, Contract } from "ethers";
import contractABI from '../utils/fight_score_abi.json';

const ROOM_ID_PREFIX = 'taco-room-';
export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.players = [];
        this.synq = null;
        this.playerId = null;
        this.roomId = null;
        this.player1Address = null;
        this.player2Address = null;
    }
    init(data) {
        this.roomId = data.roomId;
        this.player1Address = data.player1Address;
        this.player2Address = data.player2Address;
    }

    preload() {
        // 加载背景图片
        this.load.image('background', 'assets/background.jpg');
        // 加载玩家行走动画 sprite sheet
        this.load.spritesheet('player_walk', 'assets/walking.png', { frameWidth: 180, frameHeight: 180 });
        this.load.image('taco', 'assets/taco.png');


    }

    create() {
        // 创建背景
        this.createBackground();
        
        // 创建地面
        this.createGround();
        
        // 创建玩家动画
        this.anims.create({
            key: 'walk_right',
            frames: this.anims.generateFrameNumbers('player_walk', { start: 6, end: 17 }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: 'walk_left',
            frames: this.anims.generateFrameNumbers('player_walk', { start: 6, end: 17 }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('player_walk', { start: 0, end: 5 }),
            frameRate: 6,
            repeat: -1
        });
        
        // 初始化多人对战
        this.initMultiplayer();
        
        // 创建UI
        this.createUI();
        
        // 设置物理碰撞
        this.setupPhysics();
    }


    createBackground() {
        // 使用图片作为背景，并缩放到合适尺寸
        const bg = this.add.image(400, 300, 'background').setDepth(-1);
        bg.setDisplaySize(800, 600);
    }

    createGround() {
        // 创建一个透明的物理地面
        this.ground = this.add.rectangle(400, 590, 800, 40, 0x000000, 0);
        this.physics.add.existing(this.ground, true);
    }

    async initMultiplayer() {
        while (true) {
            try {
                const apiKey = import.meta.env.VITE_MULTISYNQ_KEY;
                const room = `${ROOM_ID_PREFIX}${this.roomId}`;
                const appId = 'io.multisynq.biubiu';
                const password = room;
                // 启动Multisynq会话
                const session = await Multisynq.Session.join({
                    apiKey,
                    appId,
                    name: room,
                    password,
                    model: FightModel,
                    view: FightView,
                    autoSleep: false
                });
                this.synq = session;
                if (this.player1Address != undefined) {
                    this.playerId = this.player1Address;
                } else {
                    this.playerId = this.player2Address;
                }
                session.view.setScene(this, this.playerId);
                // 判断当前房间已有玩家数量
                let spawnX = 100;
                let spawnY = 400;
                if (this.player2Address != undefined) {
                    // 已有玩家，作为玩家2出生在右侧
                    spawnX = 700;
                }
                // 创建本地玩家
                const localPlayer = new Player(this, spawnX, spawnY, this.playerId, null, true);
                // 通知加入
                if (session.view) {
                    session.view.publish("global", "player-join", {
                        id: this.playerId,
                        x: localPlayer.x,
                        y: localPlayer.y,
                        health: localPlayer.health,
                        facingDirection: localPlayer.facingDirection
                    });
                }
                localPlayer.playerId = this.playerId;
                this.players.push(localPlayer);
                this.physics.add.collider(localPlayer, this.ground);
                this.startPlayerSync();
                break;
            } catch (error) {
                console.error('init failed:', error);
            }
        }
        
    }

    startPlayerSync() {
        // 定期同步本地玩家状态
        this.time.addEvent({
            delay: 50, // 20fps同步
            callback: () => {
                if (this.players.length > 0) {
                    const localPlayer = this.players.find(p => p.isLocal);
                    if (localPlayer && this.synq && this.synq.view) {
                        this.synq.view.publish("global", "player-update", {
                            id: this.playerId,
                            x: localPlayer.x,
                            y: localPlayer.y,
                            health: localPlayer.health,
                            facingDirection: localPlayer.facingDirection
                        });
                    }
                }
            },
            loop: true
        });
    }

    createSinglePlayerMode() {
        // 创建AI对手
        const aiPlayer = new Player(this, 700, 400, 'player2', null, false);
        aiPlayer.isAI = true;
        this.players.push(aiPlayer);
        
        // AI行为
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (aiPlayer.health > 0) {
                    this.updateAI(aiPlayer);
                }
            },
            loop: true
        });
    }

    updateAI(aiPlayer) {
        const localPlayer = this.players.find(p => p.isLocal);
        if (!localPlayer) return;
        
        const distance = Math.abs(aiPlayer.x - localPlayer.x);
        
        // 简单的AI逻辑
        if (distance > 100) {
            // 接近玩家
            const direction = localPlayer.x > aiPlayer.x ? 1 : -1;
            aiPlayer.setVelocityX(direction * 150);
            aiPlayer.facingDirection = direction;
        } else {
            // 攻击
            aiPlayer.setVelocityX(0);
            if (Math.random() < 0.3) {
                aiPlayer.meleeAttack();
            } else if (Math.random() < 0.2) {
                aiPlayer.rangedAttack();
            }
        }
        
        // 随机跳跃
        if (Math.random() < 0.1 && aiPlayer.body.touching.down) {
            aiPlayer.setVelocityY(-300);
        }
    }

    createUI() {
        // 创建游戏UI
        this.add.text(10, 10, 'Taco-Taco', {
            fontSize: '16px',
            fontFamily: 'Courier New',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        });
        
        // 玩家数量显示
        this.playerCountText = this.add.text(10, 30, 'Player: 1', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#cccccc'
        });
        // 新增：房间号显示
        if (this.player1Address != undefined) {
            alert("Room ID: " + this.roomId);

            // 等待玩家2加入提示
            this.waitText = this.add.text(400, 100, 'Waiting P2 join...', {
                fontSize: '18px',
                fontFamily: 'Courier New',
                color: '#ffffff'
            }).setOrigin(0.5);
        }
    }

    setupPhysics() {
        // 设置玩家之间的碰撞
        this.physics.add.collider(this.players, this.players);
        // 设置玩家和地面之间的碰撞
        this.players.forEach(player => {
            this.physics.add.collider(player, this.ground);
        });
    }

    update() {
        // 更新所有玩家
        this.players.forEach(player => {
            if (player.active) {
                player.update();
            }
        });
        
        // 更新UI
        this.updateUI();
    }

    updateUI() {
        // 更新玩家数量
        this.playerCountText.setText(`Player: ${this.players.length}`);
        // 如果有等待提示，且玩家数>=2，则隐藏
        if (this.waitText && this.players.length >= 2) {
            this.waitText.setVisible(false);
        }
    }

    gameOver(loser) {
        // 游戏结束逻辑
        const winner = this.players.find(p => p !== loser);
        
        const isLocalWin = winner && winner.isLocal;

        // 半透明遮罩
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.5);

        // 对话框背景
        const dialogBg = this.add.rectangle(400, 300, 350, 200, 0xffffff, 0.95)
            .setStrokeStyle(2, 0x333333);

        // 标题
        this.add.text(400, 240, 'Game Over!', {
            fontSize: '26px',
            fontFamily: 'Courier New',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // 胜负信息
        this.add.text(400, 290, isLocalWin ? 'You Win!' : 'You Losed!', {
            fontSize: '20px',
            fontFamily: 'Courier New',
            color: isLocalWin ? '#00cc66' : '#ff6600',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // “确认”按钮
        if (isLocalWin) { 
            const confirmBtn = this.add.text(340, 350, 'Claim', {
                fontSize: '16px',
                fontFamily: 'Courier New',
                color: '#222',
                backgroundColor: '#eee',
                padding: { left: 20, right: 20, top: 8, bottom: 8 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            // 按钮事件
            confirmBtn.on('pointerdown', async () => {
                const provider = new BrowserProvider(window.ethereum);
                await provider.send("eth_requestAccounts", []);
                const signer = await provider.getSigner();
                const contract = new Contract(import.meta.env.VITE_REWARD_CONTRACT, contractABI, signer);

                try {
                    const tx = await contract.claim(this.roomId);
                    await tx.wait();
                    
                    // 关闭弹窗等后续逻辑
                } catch (err) {
                    console.log(err);
                }
                setTimeout(() => {
                    this.scene.start('MenuScene');
                }, 10000); 
            });
        }


        // “返回”按钮
        const backBtn = this.add.text(460, 350, 'Back', {
            fontSize: '16px',
            fontFamily: 'Courier New',
            color: '#222',
            backgroundColor: '#eee',
            padding: { left: 20, right: 20, top: 8, bottom: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });


        backBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }
}

// Multisynq Model
class FightModel extends Multisynq.Model {
    init(options, persisted) {
        this.players = {};
        this.subscribe("global", "player-join", this.playerJoin);
        this.subscribe("global", "player-leave", this.playerLeave);
        this.subscribe("global", "player-update", this.playerUpdate);
        this.subscribe("global", "player-attack", this.playerAttack);
    }
    playerJoin(data) {
        this.players[data.id] = data;
        this.publish("global", "player-joined", data);
    }
    playerLeave(id) {
        delete this.players[id];
        this.publish("global", "player-left", id);
    }
    playerUpdate(data) {
        if (this.players[data.id]) {
            this.players[data.id] = data;
        }
        this.publish("global", "player-update-view", data);
    }
    playerAttack(data) {
        this.publish("global", "player-attack-view", data);
    }
}
FightModel.register("FightModel");

// Multisynq View
class FightView extends Multisynq.View {
    constructor(model) {
        super(model);
        this.model = model;
        this.scene = null;
        this.playerId = null;
        this.players = [];
        this.subscribe("global", "player-joined", this.onPlayerJoined.bind(this));
        this.subscribe("global", "player-left", this.onPlayerLeft.bind(this));
        this.subscribe("global", "player-update-view", this.onPlayerUpdate.bind(this));
        this.subscribe("global", "player-attack-view", this.onPlayerAttack.bind(this));
    }
    setScene(scene, playerId) {
        this.scene = scene;
        this.playerId = playerId;
    }
    onPlayerJoined(data) {
        if (!this.scene) return;
        if (data.id !== this.playerId && !this.scene.players.find(p => p.playerId === data.id)) {
            const localPlayer = this.scene.players.find(p => p.isLocal);
            if (localPlayer && this.scene.synq && this.scene.synq.view) {
                this.scene.synq.view.publish("global", "player-join", {
                    id: localPlayer.playerId,
                    x: localPlayer.x,
                    y: localPlayer.y,
                    health: localPlayer.health,
                    facingDirection: localPlayer.facingDirection
                });
            }
            const remotePlayer = new Player(this.scene, data.x, data.y, data.id, null, false);
            remotePlayer.playerId = data.id;
            this.scene.players.push(remotePlayer);
            this.scene.physics.add.collider(remotePlayer, this.scene.ground);

        }
    }
    
    onPlayerLeft(id) {
        if (!this.scene) return;
        const player = this.scene.players.find(p => p.playerId === id);
        if (player) {
            player.destroy();
            this.scene.players = this.scene.players.filter(p => p !== player);
        }
    }
    onPlayerUpdate(data) {
        if (!this.scene) return;
        const player = this.scene.players.find(p => p.playerId === data.id);
        if (player && !player.isLocal) {
            player.setPosition(data.x, data.y);
            player.health = data.health;
            player.facingDirection = data.facingDirection;
        }
    }
    onPlayerAttack(data) {
        if (!this.scene) return;
        const player = this.scene.players.find(p => p.playerId === data.id);
        if (player && !player.isLocal) {
            if (data.type === 'melee') {
                console.log('onPlayerAttack', data);
                player.meleeAttack(true);
            } else if (data.type === 'ranged') {
                player.rangedAttack(true);
            }
        }
    }
} 