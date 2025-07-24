// 简化的多人对战模拟器
export class MultiplayerSimulator {
    constructor() {
        this.id = 'player-' + Math.random().toString(36).substr(2, 9);
        this.room = null;
        this.listeners = {};
        this.connected = false;
        this.otherPlayers = new Map();
    }

    async join(roomName) {
        this.room = roomName;
        this.connected = true;
        
        // 模拟其他玩家加入
        setTimeout(() => {
            this.emit('player-joined', {
                id: 'ai-player-' + Math.random().toString(36).substr(2, 9)
            });
        }, 1000);
        
        return Promise.resolve();
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        // 模拟网络延迟
        setTimeout(() => {
            if (this.listeners[event]) {
                this.listeners[event].forEach(callback => {
                    callback(data);
                });
            }
        }, Math.random() * 100 + 50);
    }

    disconnect() {
        this.connected = false;
        this.emit('player-left', this.id);
    }
} 