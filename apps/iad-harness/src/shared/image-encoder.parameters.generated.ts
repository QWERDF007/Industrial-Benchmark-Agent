/* Generated from Python image encoder models by scripts/generate-contracts.js. */
export const imageBackbones = {
  "dinov2_vitb14_reg": {
    "backend": "torch_hub",
    "processor": "dinov2_imagenet_eval",
    "input_size": 224,
    "pooling": "x_norm_clstoken",
    "dim": 768,
    "resize_size": 256,
    "resize_mode": "shorter_side",
    "crop": "center",
    "interpolation": "bicubic",
    "local_snapshot": false
  },
  "dinov3_vitb16": {
    "backend": "torch_hub",
    "processor": "dinov3_lvd_eval",
    "input_size": 256,
    "pooling": "x_norm_clstoken",
    "dim": 768,
    "resize_size": 256,
    "resize_mode": "stretch",
    "crop": "none",
    "interpolation": "bilinear",
    "local_snapshot": true
  },
  "sscd_disc_mixup": {
    "backend": "torchscript",
    "processor": "sscd_skew320",
    "input_size": 320,
    "pooling": "serialized_global",
    "dim": 512,
    "resize_size": 320,
    "resize_mode": "stretch",
    "crop": "none",
    "interpolation": "bilinear",
    "local_snapshot": false
  }
} as const;
