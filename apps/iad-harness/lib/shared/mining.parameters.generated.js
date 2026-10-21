/* Generated from Python MiningStart by scripts/generate-contracts.js. */
export const miningParameters = {
    "knowledge_preset": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "description": "可选知识版本引用；省略或空列表表示不使用预设，不隐式读取当前版本",
        "title": "Knowledge Preset"
    },
    "image_count": {
        "type": "integer",
        "description": "本次原始图像数量，必须严格等于images长度",
        "title": "Image Count",
        "required": true
    },
    "images": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "description": "从knowledge_sources查询复制的已导入sample_id引用，不接受相对路径或图像编码",
        "title": "Images",
        "required": true
    }
};
