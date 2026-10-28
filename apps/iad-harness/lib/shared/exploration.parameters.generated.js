/* Generated from Python ExplorationStart by scripts/generate-contracts.js. */
export const explorationParameters = {
    "dataset_id": {
        "type": "string",
        "title": "Dataset Id",
        "required": true
    },
    "normal_images": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "title": "Normal Images",
        "required": true
    },
    "defect_images": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "title": "Defect Images",
        "required": true
    },
    "objective": {
        "type": "string",
        "title": "Objective",
        "default": "联合比较候选良品和异常样例，自行提出适合此数据集的可观察检查方向。"
    },
    "prompt": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
            "preset_id": {
                "type": "string",
                "title": "Preset Id"
            },
            "preset_name": {
                "type": "string",
                "title": "Preset Name"
            },
            "text": {
                "type": "string",
                "title": "Text",
                "required": true
            }
        },
        "title": "FrozenExplorationPrompt"
    }
};
export const explorationPresetParameters = {
    "name": {
        "type": "string",
        "title": "Name",
        "required": true
    },
    "text": {
        "type": "string",
        "title": "Text",
        "required": true
    }
};
export const directionAdoptionParameters = {
    "dataset_id": {
        "type": "string",
        "title": "Dataset Id",
        "required": true
    },
    "kind": {
        "type": "string",
        "enum": [
            "normal",
            "defect"
        ],
        "title": "Kind",
        "required": true
    },
    "expected_revision": {
        "type": "string",
        "title": "Expected Revision",
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
                    "title": "Title"
                },
                "instruction": {
                    "type": "string",
                    "title": "Instruction"
                },
                "enabled": {
                    "type": "boolean",
                    "title": "Enabled",
                    "default": true
                }
            },
            "title": "DirectionChoice"
        },
        "title": "Directions",
        "required": true
    }
};
