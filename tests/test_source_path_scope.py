from pathlib import Path

import pytest
import yaml
from PIL import Image

from iad_core.dataset.path_safety import AuthorizedDatasetPaths, PathSafetyError
from iad_core.evidence.sources import SampleContent
from iad_core.knowledge.scopes import KnowledgeScopeOpen, KnowledgeScopes
from iad_core.storage.repositories import SampleRepository


def test_path_authorization_is_frozen_only_for_one_operation(knowledge_dataset, tmp_path, monkeypatch):
    db, config = knowledge_dataset
    monkeypatch.chdir(tmp_path)
    sample = SampleRepository(db).get(config.dataset.id + ':part-0.png')
    paths = AuthorizedDatasetPaths(db.db_path)
    assert paths.image(sample) == str(Path(sample.image_path).resolve())
    link = tmp_path / 'external.png'
    link.symlink_to('/etc/hostname')
    external = sample.model_copy(update={'image_path': str(link)})
    with pytest.raises(PathSafetyError):
        paths.image(external)
    (tmp_path / 'configs').mkdir()
    (tmp_path / 'configs/authorized.yaml').write_text(yaml.safe_dump(
        config.model_copy(update={'root': '/etc'}).model_dump(mode='json')))
    with pytest.raises(PathSafetyError):
        paths.image(external)
    assert AuthorizedDatasetPaths(db.db_path).image(external) == '/etc/hostname'


def test_scope_reads_recheck_source_content_after_each_request(knowledge_dataset):
    db, config = knowledge_dataset
    scopes = KnowledgeScopes(db)
    frozen = scopes.open(KnowledgeScopeOpen(dataset_id=config.dataset.id, kind='normal', objective='核验全部来源'))
    assert frozen.total == frozen.remaining == 6
    path = Path(config.root) / 'part-0.png'
    original = path.read_bytes()
    with Image.open(path) as image:
        image.putpixel((1, 1), (255, 0, 0))
        image.save(path)
    changed = scopes.read(frozen.scope_run_id)
    assert (changed.stale, changed.remaining) == (1, 5)
    path.write_bytes(original)
    restored = scopes.read(frozen.scope_run_id)
    assert (restored.stale, restored.remaining) == (0, 6)


def test_audit_input_batch_matches_individual_sources_and_rechecks_content(knowledge_dataset):
    db, config = knowledge_dataset
    identities = [config.dataset.id + ':part-0.png', config.dataset.id + ':part-1.png']
    expected = [SampleContent.capture(db, identity) for identity in identities]
    assert SampleContent.capture_many(db, identities) == expected
    path = Path(config.root) / 'part-1.png'
    with Image.open(path) as image:
        image.putpixel((1, 1), (255, 0, 0))
        image.save(path)
    changed = SampleContent.capture_many(db, identities)
    assert changed[0] == expected[0]
    assert changed[1].sha256 != expected[1].sha256
