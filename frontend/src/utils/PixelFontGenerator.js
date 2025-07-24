export class PixelFontGenerator {
    static generateFont(scene) {
        const graphics = scene.add.graphics();
        
        // 创建像素字体纹理
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?()[]{}:;"\'<>/=+-*%#@$&|\\~`^';
        const charWidth = 8;
        const charHeight = 8;
        const charsPerRow = 16;
        
        // 创建字体纹理
        graphics.clear();
        graphics.fillStyle(0xffffff);
        
        for (let i = 0; i < chars.length; i++) {
            const char = chars[i];
            const x = (i % charsPerRow) * charWidth;
            const y = Math.floor(i / charsPerRow) * charHeight;
            
            // 绘制字符（简单的像素表示）
            this.drawChar(graphics, char, x, y, charWidth, charHeight);
        }
        
        graphics.generateTexture('pixel-font', charsPerRow * charWidth, Math.ceil(chars.length / charsPerRow) * charHeight);
        graphics.destroy();
        
        // 创建字体配置
        const fontConfig = {
            font: 'pixel-font',
            size: charHeight,
            chars: chars,
            charsPerRow: charsPerRow,
            charWidth: charWidth,
            charHeight: charHeight
        };
        
        return fontConfig;
    }
    
    static drawChar(graphics, char, x, y, width, height) {
        // 简单的像素字符绘制
        const pixels = this.getCharPixels(char);
        
        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                if (pixels[py] && pixels[py][px]) {
                    graphics.fillRect(x + px, y + py, 1, 1);
                }
            }
        }
    }
    
    static getCharPixels(char) {
        // 简单的像素字符定义
        const charMap = {
            'A': [
                '  ###  ',
                ' #   # ',
                '#     #',
                '#     #',
                '#######',
                '#     #',
                '#     #'
            ],
            'B': [
                '###### ',
                '#     #',
                '#     #',
                '###### ',
                '#     #',
                '#     #',
                '###### '
            ],
            'W': [
                '#     #',
                '#     #',
                '#     #',
                '#  #  #',
                '# # # #',
                '##   ##',
                '#     #'
            ],
            'D': [
                '###### ',
                '#     #',
                '#     #',
                '#     #',
                '#     #',
                '#     #',
                '###### '
            ],
            ' ': [
                '       ',
                '       ',
                '       ',
                '       ',
                '       ',
                '       ',
                '       '
            ]
        };
        
        return charMap[char.toUpperCase()] || charMap[' '];
    }
} 