import hashlib
import json
import os
import tempfile
import zipfile
from pathlib import Path

from iad_core.feature.flat_index import CpuFlatIndex
from iad_core.feature.index_models import CorpusIndexInfo, IndexLimits


class IndexArtifacts:
    def __init__(self, root: Path):
        self.root=root
        root.mkdir(parents=True,exist_ok=True)

    def path(self, range_id: str, profile_id: str) -> Path:
        return self.root/(range_id+'__'+profile_id+'.zip')

    def stage(self, path: Path, info: CorpusIndexInfo, index: CpuFlatIndex) -> Path:
        handle,name=tempfile.mkstemp(dir=self.root,prefix=path.stem+'.',suffix='.tmp')
        temporary=Path(name)
        try:
            with os.fdopen(handle,'wb') as stream:
                payload=index.serialize()
                manifest={'format':1,'info':info.model_dump(mode='json',exclude={'index_path'}),
                    'group_ids':index.group_ids,'members':dict(index.members),
                    'sha256':hashlib.sha256(payload).hexdigest()}
                with zipfile.ZipFile(stream,'w',compression=zipfile.ZIP_STORED) as archive:
                    archive.writestr('manifest.json',json.dumps(manifest,sort_keys=True).encode())
                    archive.writestr('index.faiss',payload.tobytes())
                stream.flush();os.fsync(stream.fileno())
            return temporary
        except BaseException:
            temporary.unlink(missing_ok=True)
            raise

    def load(self, path: Path, expected: CorpusIndexInfo, group_ids, members, limits: IndexLimits):
        with zipfile.ZipFile(path) as archive:
            if set(archive.namelist())!={'manifest.json','index.faiss'}:
                raise ValueError('Incomplete index artifact')
            if archive.getinfo('index.faiss').file_size>expected.vector_bytes+4096 or archive.getinfo('manifest.json').file_size>limits.max_resident_bytes:
                raise ValueError('Index artifact exceeds the expected dimensions')
            manifest=json.loads(archive.read('manifest.json'))
            info=CorpusIndexInfo(**manifest['info'],index_path=str(path))
            ignored={'generation','index_path'}
            if (manifest['format']!=1 or info.model_dump(exclude=ignored)!=expected.model_dump(exclude=ignored)
                or tuple(manifest['group_ids'])!=group_ids or {key:tuple(value) for key,value in manifest['members'].items()}!=dict(members)):
                raise ValueError('Index artifact belongs to another corpus revision')
            payload=archive.read('index.faiss')
            if hashlib.sha256(payload).hexdigest()!=manifest['sha256']:
                raise ValueError('Index artifact checksum differs')
        return info,CpuFlatIndex.deserialize(payload,group_ids,members,expected.dim,limits)
