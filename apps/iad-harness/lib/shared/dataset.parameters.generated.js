/* Generated from Python FolderRule by scripts/generate-contracts.js. */
export const folderRulesParameter = {
    "type": "array",
    "items": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
            "path": {
                "type": "string",
                "description": "Relative directory path under dataset root, or '.' for root images",
                "title": "Path",
                "required": true
            },
            "role": {
                "type": "string",
                "enum": [
                    "normal",
                    "anomaly",
                    "unlabeled",
                    "excluded"
                ],
                "description": "Role assigned to this directory",
                "title": "Role",
                "required": true
            }
        },
        "title": "FolderRule"
    }
};
