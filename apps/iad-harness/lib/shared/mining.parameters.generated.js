/* Generated from Python MiningStart by scripts/generate-contracts.js. */
export const miningParameters = {
    "knowledge_preset": {
        "oneOf": [
            {
                "type": "array",
                "items": {
                    "type": "string"
                }
            },
            {
                "type": "null"
            }
        ],
        "description": "可选父知识版本引用；省略或空列表表示不使用预设，不隐式读取当前版本",
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
    },
    "mining_prompt": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
            "objective": {
                "type": "string",
                "title": "Objective",
                "required": true
            },
            "directions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "properties": {
                        "direction_id": {
                            "type": "string",
                            "title": "Direction Id",
                            "required": true
                        },
                        "title": {
                            "type": "string",
                            "title": "Title",
                            "required": true
                        },
                        "instruction": {
                            "type": "string",
                            "title": "Instruction",
                            "required": true
                        },
                        "enabled": {
                            "type": "boolean",
                            "title": "Enabled",
                            "default": true,
                            "required": true
                        },
                        "origin": {
                            "type": "string",
                            "enum": [
                                "preset",
                                "dataset",
                                "explored"
                            ],
                            "title": "Origin",
                            "default": "dataset",
                            "required": true
                        }
                    },
                    "title": "MiningDirection"
                },
                "title": "Directions",
                "required": true
            },
            "instruction": {
                "type": "string",
                "title": "Instruction",
                "required": true
            },
            "exploration": {
                "oneOf": [
                    {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "version_id": {
                                "type": "string",
                                "title": "Version Id",
                                "required": true
                            },
                            "summary": {
                                "type": "string",
                                "title": "Summary",
                                "required": true
                            },
                            "limitations": {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                },
                                "title": "Limitations",
                                "required": true
                            }
                        },
                        "title": "MiningExploration"
                    },
                    {
                        "type": "null"
                    }
                ],
                "required": true
            }
        },
        "title": "SubmittedMiningPrompt",
        "required": true
    }
};
