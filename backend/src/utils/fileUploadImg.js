const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// 配置常量
const CONFIG = {
    IMAGE_DIR: path.join(__dirname, '../../db/img'),
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: /jpeg|jpg|png|gif|webp/,
    IMAGE_URL_PREFIX: '/img/'
};

/**
 * 确保图片存储目录存在
 * @returns {string} 图片目录路径
 */
const createImageDir = () => {
    if (!fs.existsSync(CONFIG.IMAGE_DIR)) {
        fs.mkdirSync(CONFIG.IMAGE_DIR, { recursive: true });
    }
    return CONFIG.IMAGE_DIR;
};

/**
 * 生成安全的唯一文件名
 * @param {string} originalName - 原始文件名
 * @returns {string} 安全的唯一文件名
 */
const generateSafeFileName = (originalName) => {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName).toLowerCase();
    return `dish-${timestamp}-${randomString}${ext}`;
};

// 配置存储
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            const imgDir = createImageDir();
            cb(null, imgDir);
        } catch (error) {
            cb(new Error(`无法创建目标目录: ${error.message}`));
        }
    },
    filename: (req, file, cb) => {
        try {
            const fileName = generateSafeFileName(file.originalname);
            cb(null, fileName);
        } catch (error) {
            cb(new Error(`文件名生成失败: ${error.message}`));
        }
    }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
    try {
        // 验证MIME类型和扩展名
        const extname = CONFIG.ALLOWED_TYPES.test(path.extname(file.originalname).toLowerCase());
        const mimetype = CONFIG.ALLOWED_TYPES.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            return cb(new Error('只允许上传JPEG, JPG, PNG, GIF或WEBP格式的图片'));
        }
    } catch (error) {
        return cb(new Error(`文件过滤错误: ${error.message}`));
    }
};

// 创建上传中间件
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: CONFIG.MAX_FILE_SIZE
    }
});

const getErrorMessage = (err) => {
    if (err instanceof multer.MulterError) {
        // 处理Multer特定错误
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                return `文件大小超过限制 (最大 ${CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB)`;
            case 'LIMIT_UNEXPECTED_FILE':
                return '意外的字段名称';
            default:
                return `上传错误: ${err.message}`;
        }
    }
    // 处理自定义错误或其他错误
    return err.message;
};

// 处理单个图片上传
const handleImageUpload = (req, res, next) => {
    // 单文件上传中间件
    const singleUpload = upload.single('image');

    singleUpload(req, res, (err) => {
        if (err) {
            const errorMessage = getErrorMessage(err);
            return res.status(400).json({
                code: 1,
                message: errorMessage,
                success: false
            });
        }

        // 如果有文件上传成功，设置图片路径
        if (req.file) {
            // 存储相对路径到req.body.image
            req.body.image = `${CONFIG.IMAGE_URL_PREFIX}${req.file.filename}`;

            // 可选：添加更多文件信息到请求对象
            req.fileInfo = {
                originalName: req.file.originalname,
                size: req.file.size,
                mimeType: req.file.mimetype,
                path: req.file.path
            };
        }

        next();
    });
};

// 处理多个图片上传
/*
const handleMultipleImageUpload = (fieldName = 'images', maxCount = 5) => {
    return (req, res, next) => {
        const multiUpload = upload.array(fieldName, maxCount);

        multiUpload(req, res, (err) => {
            if (err) {
                const errorMessage = getErrorMessage(err);
                return res.status(400).json({
                    code: 1,
                    message: errorMessage,
                    success: false
                });
            }

            // 如果有文件上传成功，设置图片路径数组
            if (req.files && req.files.length > 0) {
                req.body[fieldName] = req.files.map(file =>
                    `${CONFIG.IMAGE_URL_PREFIX}${file.filename}`
                );

                // 可选：添加更多文件信息到请求对象
                req.filesInfo = req.files.map(file => ({
                    originalName: file.originalname,
                    size: file.size,
                    mimeType: file.mimetype,
                    path: file.path
                }));
            }

            next();
        });
    };
};
*/

module.exports = {
    upload,
    handleImageUpload,
};