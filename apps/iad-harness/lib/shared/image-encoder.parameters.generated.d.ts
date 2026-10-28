export declare const imageBackbones: {
    readonly dinov2_vitb14_reg: {
        readonly backend: "torch_hub";
        readonly processor: "dinov2_imagenet_eval";
        readonly input_size: 224;
        readonly pooling: "x_norm_clstoken";
        readonly dim: 768;
        readonly resize_size: 256;
        readonly resize_mode: "shorter_side";
        readonly crop: "center";
        readonly interpolation: "bicubic";
        readonly local_snapshot: false;
    };
    readonly dinov3_vitb16: {
        readonly backend: "torch_hub";
        readonly processor: "dinov3_lvd_eval";
        readonly input_size: 256;
        readonly pooling: "x_norm_clstoken";
        readonly dim: 768;
        readonly resize_size: 256;
        readonly resize_mode: "stretch";
        readonly crop: "none";
        readonly interpolation: "bilinear";
        readonly local_snapshot: true;
    };
    readonly sscd_disc_mixup: {
        readonly backend: "torchscript";
        readonly processor: "sscd_skew320";
        readonly input_size: 320;
        readonly pooling: "serialized_global";
        readonly dim: 512;
        readonly resize_size: 320;
        readonly resize_mode: "stretch";
        readonly crop: "none";
        readonly interpolation: "bilinear";
        readonly local_snapshot: false;
    };
};
//# sourceMappingURL=image-encoder.parameters.generated.d.ts.map