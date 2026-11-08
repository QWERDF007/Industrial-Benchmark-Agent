/* Generated from Python KnowledgeScopeOpen by scripts/generate-contracts.js. */
export const knowledgeScopeParameters = {
    "dataset_id": {
        "type": "string",
        "title": "Dataset Id",
        "required": true
    },
    "objective": {
        "type": "string",
        "title": "Objective",
        "required": true
    },
    "search": {
        "type": "string",
        "title": "Search",
        "default": ""
    },
    "seed": {
        "oneOf": [
            {
                "type": "integer"
            },
            {
                "type": "null"
            }
        ],
        "title": "Seed"
    },
    "starting_version_id": {
        "oneOf": [
            {
                "type": "string"
            },
            {
                "type": "null"
            }
        ],
        "title": "Starting Version Id"
    }
};
