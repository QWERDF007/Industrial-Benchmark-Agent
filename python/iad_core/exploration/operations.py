from iad_core.storage.database import Database
from iad_core.analysis.queries import AnalysisQueries
from iad_core.exploration.models import DirectionRemoval


def direction_exploration_remove_direction(args, db_path):
    return AnalysisQueries(Database(db_path)).remove_direction(DirectionRemoval.model_validate(args)).model_dump(mode='json')


def direction_exploration_evidence(args, db_path):
    return AnalysisQueries(Database(db_path)).evidence(args['version_id'], args['evidence_id'])


def direction_exploration_presets(args, db_path):
    from iad_core.exploration.prompts import ExplorationPrompts
    return {'presets': [p.model_dump() for p in ExplorationPrompts().list()]}


def direction_exploration_preset_save(args, db_path):
    from iad_core.exploration.prompts import ExplorationPrompts
    from iad_core.exploration.models import ExplorationPresetEdit
    return ExplorationPrompts().create(ExplorationPresetEdit.model_validate(args)).model_dump()
