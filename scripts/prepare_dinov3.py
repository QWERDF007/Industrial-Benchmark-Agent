"""Prepare an official DINOv3 snapshot in the application's fixed model directory."""

import argparse
import shutil
from pathlib import Path

from filelock import FileLock

from iad_core.feature.backbones import DinoModelId
from iad_core.feature.local_dino import LocalDinoSnapshot
from iad_core.feature.profiles import EmbeddingProfile
from iad_core.feature.settings import DINO_MODEL_DIRECTORY


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('model', type=DinoModelId, choices=list(DinoModelId))
    parser.add_argument('--source', type=Path, help='Existing local Hugging Face snapshot directory')
    args = parser.parse_args()
    root = DINO_MODEL_DIRECTORY / args.model
    root.mkdir(parents=True, exist_ok=True)
    with FileLock(str(root) + '.lock'):
        if args.source:
            LocalDinoSnapshot.read(args.source, args.model)
            for name in ('config.json', 'preprocessor_config.json', 'model.safetensors'):
                pending = root / (name + '.pending')
                shutil.copyfile(args.source / name, pending)
                pending.replace(root / name)
        else:
            from huggingface_hub import snapshot_download
            snapshot_download(args.model.repository, local_dir=root,
                allow_patterns=['config.json', 'preprocessor_config.json', 'model.safetensors'])
        profile = EmbeddingProfile.create(args.model, str(root), storage_dtype='float16')
        print(f'{args.model}: ready, {profile.dim} dimensions, {profile.weights_sha256}')


if __name__ == '__main__':
    main()
