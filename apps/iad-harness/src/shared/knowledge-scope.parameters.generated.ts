/* Generated from Python KnowledgeScopeOpen by scripts/generate-contracts.js. */
export const knowledgeScopeParameters = {
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
    "type": "integer",
    "title": "Seed"
  },
  "starting_version_id": {
    "type": "string",
    "title": "Starting Version Id"
  },
  "normal_version_id": {
    "type": "string",
    "title": "Normal Version Id"
  }
} as const;
