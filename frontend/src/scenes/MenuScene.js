import { PixelFontGenerator } from '../utils/PixelFontGenerator.js';
import { getWalletAddress, getBlockNumber } from '../utils/Monad.js';
import contractABI from '../utils/fight_score_abi.json';
import { BrowserProvider, Contract } from "ethers";
export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        // 动态生成像素字体
        this.fontConfig = PixelFontGenerator.generateFont(this);
    }

    async create() {
        const { width, height } = this.scale;
        // 1. 获取钱包地址
        const address = await getWalletAddress();

        // 2. 获取分数
        let score = 0;
        try {
            const provider = new BrowserProvider(window.ethereum);
            const contract = new Contract(import.meta.env.VITE_REWARD_CONTRACT, contractABI, provider);
            score = await contract.score(address);
        } catch (e) {
            console.warn("pull score failed", e);
        }
        // 3. 左上角显示
        this.add.text(10, 5, `address: ${address}\nscore: ${score}`, {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#cccccc',
            align: 'left'
        }).setOrigin(0, 0);
        // 创建背景
        this.createBackground();
        
        // 创建标题
        this.add.text(width / 2, height / 3, 'Taco Taco', {
            fontSize: '32px',
            fontFamily: 'Courier New',
            color: '#ff6b6b',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // 创建开始按钮
        const startButton = this.add.text(width / 2, height / 2, 'Create Room', {
            fontSize: '24px',
            fontFamily: 'Courier New',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setInteractive();

        startButton.on('pointerover', () => {
            startButton.setColor('#ff6b6b');
        });

        startButton.on('pointerout', () => {
            startButton.setColor('#ffffff');
        });

        startButton.on('pointerdown', async () => {
            const player1Address = await getWalletAddress();
            const blockNumber = await getBlockNumber();
            const roomId = `${blockNumber}`;
            this.scene.start('GameScene',{ roomId, player1Address });
        });

        // 创建加入按钮
        const joinButton = this.add.text(width / 2, height * 0.6, 'Join', {
            fontSize: '24px',
            fontFamily: 'Courier New',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setInteractive();

        joinButton.on('pointerover', () => {
            joinButton.setColor('#ff6b6b');
        });

        joinButton.on('pointerout', () => {
            joinButton.setColor('#ffffff');
        });

        joinButton.on('pointerdown', async () => {
            const player2Address = "0xb33851673A9a8FC83CD5879d7596d593cDC11f62";
            const roomId =  prompt('Please enter the room ID to join:');
            this.scene.start('GameScene',{ roomId, player2Address });
        });

        // 创建说明文本
        this.add.text(width / 2, height * 0.7, 'Space: Jump A: Backward/Defend D: Forward', {
            fontSize: '16px',
            fontFamily: 'Courier New',
            color: '#cccccc'
        }).setOrigin(0.5);

        this.add.text(width / 2, height * 0.75, 'J/Left Mouse Button: Melee K/Right Mouse Button: Ranged', {
            fontSize: '16px',
            fontFamily: 'Courier New',
            color: '#cccccc'
        }).setOrigin(0.5);
    }
    
    createBackground() {
        // 创建 video 元素
    const video = document.createElement('video');
    video.src = 'assets/background.mp4'; // 路径相对于 public/
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true; // 移动端兼容
    video.style.position = 'absolute';
    video.style.left = '0';
    video.style.top = '0';
    video.style.width = '100vw';
    video.style.height = '100vh';
    video.style.objectFit = 'cover';
    video.style.zIndex = '-1'; // 保证在最底层

    // 插入到 Phaser canvas 父节点
    this.game.canvas.parentNode.appendChild(video);

    // 可选：在场景销毁时移除 video，避免切换场景后残留
    this.events.once('shutdown', () => {
        video.pause();
        video.remove();
    });
    }
} 