"""
Dinomlay2 Bridge Script (Ticket H001~H005)
Executed within conda env /data1/anaconda3/envs/dinomaly2.
Loads trained Dinomaly2 model, performs float32 anomaly inference, and exports predictions JSONL.
"""
import sys
import os
import json
import time
import argparse
import numpy as np
import torch
from torchvision import transforms
from types import SimpleNamespace
from PIL import Image

def main():
    parser = argparse.ArgumentParser(description="Dinomaly2 Benchmark Inference Bridge")
    parser.add_argument("--repo_path", type=str, default="/data1/lzw/anomaly-detection/Dinomaly2")
    parser.add_argument("--model", type=str, required=True, help="Path to model.pth")
    parser.add_argument("--manifest", type=str, required=True, help="Path to input manifest JSONL")
    parser.add_argument("--output", type=str, required=True, help="Path to output predictions JSONL")
    parser.add_argument("--split", type=str, default="test")
    parser.add_argument("--backbone", type=str, default="dinov2reg_vit_small_14")
    parser.add_argument("--image_size", type=int, default=448)
    parser.add_argument("--crop_size", type=int, default=392)
    parser.add_argument("--cuda", type=str, default="0")
    args = parser.parse_args()

    # Add repo path to sys.path
    if args.repo_path not in sys.path:
        sys.path.insert(0, args.repo_path)

    try:
        from predict import build_model
        from utils import cal_anomaly_maps, get_gaussian_kernel
    except ImportError as e:
        sys.stderr.write(f"Failed to import Dinomaly2 from {args.repo_path}: {e}\n")
        sys.exit(1)

    device = f"cuda:{args.cuda}" if torch.cuda.is_available() and args.cuda != "-1" else "cpu"

    model_args = SimpleNamespace(
        lc=2,
        backbone=args.backbone,
        dropout=0.4,
        la=1,
        cr=1,
        image_size=args.image_size,
        crop_size=args.crop_size,
        threshold=None,
    )

    model = build_model(model_args, device)
    state_dict = torch.load(args.model, map_location=device, weights_only=True)
    model.load_state_dict(state_dict, strict=True)
    model.eval()

    transform = transforms.Compose([
        transforms.Resize((args.image_size, args.image_size)),
        transforms.ToTensor(),
        transforms.CenterCrop(args.crop_size),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    # Read manifest
    samples = []
    with open(args.manifest, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                samples.append(json.loads(line))

    gaussian_kernel = get_gaussian_kernel(kernel_size=5, sigma=4).to(device)

    preds = []
    for s in samples:
        sample_id = s["sample_id"]
        img_path = s["image_path"]

        if not os.path.exists(img_path):
            sys.stderr.write(f"Sample image does not exist: {img_path}\n")
            sys.exit(2)

        t0 = time.time()
        img = Image.open(img_path).convert("RGB")
        orig = np.array(img)
        img_tensor = transform(img).unsqueeze(0).to(device)

        with torch.no_grad():
            en, de = model(img_tensor)
            anomaly_map, _ = cal_anomaly_maps(en, de, orig.shape[:2])
            anomaly_map = gaussian_kernel(anomaly_map)

        score = float(anomaly_map[0, 0].cpu().numpy().max())
        elapsed_ms = (time.time() - t0) * 1000.0

        if not np.isfinite(score):
            sys.stderr.write(f"Non-finite anomaly score produced for sample {sample_id}: {score}\n")
            sys.exit(3)

        preds.append({
            "sample_id": sample_id,
            "image_score": score,
            "pixel_score_path": None,
            "latency_ms": elapsed_ms,
            "split_name": args.split,
        })

    # Write output
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        for p in preds:
            f.write(json.dumps(p) + "\n")

    print(f"Successfully evaluated {len(preds)} samples with Dinomaly2.")

if __name__ == "__main__":
    main()
