import hashlib
import json
import os
import tempfile
import zipfile
from pathlib import Path

from iad_core.consistency.evidence_models import EvidenceBundle
from iad_core.contracts import ArtifactRef
from iad_core.evidence.consistency_media import ConsistencyMedia
from iad_core.evidence.retained import RetainedImages
from iad_core.evidence.files import file_sha256
from iad_core.storage.database import Database


class ConsistencyExport:
    def __init__(self, db: Database):
        self.db=db

    def create(self, evidence: EvidenceBundle) -> ArtifactRef:
        retained=RetainedImages(self.db)
        renderer=ConsistencyMedia(self.db)
        files,assets={},{}
        for source in (evidence.sources.left,evidence.sources.right):
            for blob in (source.image,*source.masks.values()):assets[blob.sha256]=retained.path(blob)
        for media in evidence.media:
            if not media.available:continue
            path=renderer.render(evidence,media)['path']
            sha=file_sha256(path)
            assets[sha]=path;files[media.media_id]=f'assets/{sha}.png'
        root=Path(self.db.db_path).resolve().parent/'cache'/'consistency-exports';root.mkdir(parents=True,exist_ok=True)
        path=root/(evidence.result.evidence_id+'.zip')
        temporary=None
        try:
            with tempfile.NamedTemporaryFile(dir=root,suffix='.zip.tmp',delete=False) as target:temporary=Path(target.name)
            with zipfile.ZipFile(temporary,'w',compression=zipfile.ZIP_DEFLATED) as archive:
                archive.writestr('evidence.json',json.dumps({'evidence':evidence.model_dump(mode='json'),'files':files},ensure_ascii=False,indent=2))
                archive.writestr('README.txt','本包为一次真实检查的冻结证据，非示例数据。\n原图PNG保留原始解码像素和位深，未套用EXIF旋转。预览是派生图像，不能代替原像素证明。\nsource_sha256标识当次源文件字节，assets文件名是包内文件的SHA-256。mask按sources中的masks摘要定位，mask_path仅记录当时本机路径。\nfiles列出媒体ID对应的包内路径；reference_from_other表示来自另一侧标注的位置参考，不是本侧原标注。\n检查参数、范围、规范、未知项与时间见evidence.json。\n')
                for sha,asset in assets.items():archive.write(asset,f'assets/{sha}.png')
            with zipfile.ZipFile(temporary) as archive:
                for sha in assets:
                    digest=hashlib.sha256()
                    with archive.open(f'assets/{sha}.png') as source:
                        for block in iter(lambda:source.read(1024*1024),b''):digest.update(block)
                    if digest.hexdigest()!=sha:raise ValueError('Export evidence bytes changed during packaging')
            with temporary.open('rb') as source:os.fsync(source.fileno())
            os.replace(temporary,path)
        finally:
            if temporary is not None:temporary.unlink(missing_ok=True)
        return ArtifactRef(artifact_id=evidence.result.evidence_id,artifact_type='consistency_evidence_zip',
            uri=f'iad://consistency/evidence/{evidence.result.evidence_id}/export',path=str(path),summary='冻结原图、标注、差异及来源')
