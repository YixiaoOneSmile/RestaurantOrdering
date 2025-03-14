const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');


async function generateTableQRCode(tableId, number) {
    const baseUrl = process.env.FRONTEND_URL;
    const url = `${baseUrl}/table/${tableId}`;

    // 确保二维码存储目录存在
    const qrCodeDir = path.join(__dirname, '../../db/qrcodes');
    if (!fs.existsSync(qrCodeDir)) {
        fs.mkdirSync(qrCodeDir, { recursive: true });
    }

    // 生成二维码图片文件
    const qrCodePath = path.join(qrCodeDir, `table_${number}.png`);
    await QRCode.toFile(qrCodePath, url, {
        color: {
            dark: '#000',
            light: '#FFF'
        },
        width: 300,
        margin: 1
    });

    return `/qrcodes/table_${number}.png`; // 返回相对路径
}

module.exports = {
    generateTableQRCode
};