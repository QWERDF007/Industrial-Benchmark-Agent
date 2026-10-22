from iad_core.storage.database import Database
from iad_core.workbench.runtime import workbench

def direction_exploration_start(args, db_path):
    from iad_core.exploration.models import ExplorationStart
    return workbench(db_path).invoke_model(args.get('_model_execution'), lambda services:
        services.exploration.start(ExplorationStart.model_validate(args['request']), args.get('model_name'), args.get('origin_session_id')))


def direction_exploration_status(args, db_path):
    return workbench(db_path).jobs.status(args['run_id'], ('DIRECTION_EXPLORATION',))


def direction_exploration_list(args, db_path):
    return {'jobs': workbench(db_path).jobs.list(args['dataset_id'], ('DIRECTION_EXPLORATION',))}


def direction_exploration_cancel(args, db_path):
    return workbench(db_path).jobs.cancel(args['run_id'], ('DIRECTION_EXPLORATION',))


def direction_exploration_retry(args, db_path):
    return workbench(db_path).invoke_model(args.get('_model_execution'),
        lambda services: services.exploration.retry(args['run_id']), args['run_id'])


def direction_exploration_get(args, db_path):
    from iad_core.exploration.repository import ExplorationRepository
    return ExplorationRepository(Database(db_path)).catalog(args['dataset_id'], args.get('version_id'), args.get('direction_id')).model_dump()


def direction_exploration_evidence(args, db_path):
    from iad_core.exploration.repository import ExplorationRepository
    from iad_core.evidence.images import EvidenceImages
    snapshot = ExplorationRepository(Database(db_path)).get(args['version_id'])
    image = next((e.image for e in snapshot.evidence if e.image.evidence_id == args['evidence_id']), None)
    if image is None:
        raise LookupError('该探索版本不存在指定证据')
    return {'path': EvidenceImages(db_path).path(image), 'media_type': image.media_type}
