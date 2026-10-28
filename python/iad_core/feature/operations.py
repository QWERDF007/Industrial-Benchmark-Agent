from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.errors import ConsistencyError
from iad_core.feature.profiles import EmbeddingProfile, ImageEncoderConfig, ImageEncoderEdit, ImageEncoders, ImageModelId, EmbeddingPrecision
from iad_core.storage.database import Database


class ImageProfileCreate(AnalysisModel):
    model_id: ImageModelId
    weights_ref: str = Field(min_length=1)
    source_ref: str | None = None
    storage_dtype: EmbeddingPrecision = 'float32'


def feature_profile_create(args, db_path):
    request=ImageProfileCreate.model_validate(args)
    return EmbeddingProfile.create(**request.model_dump()).model_dump()


def feature_settings_view(args, db_path):
    return ImageEncoders(Database(db_path)).read().model_dump()


def feature_settings_save(args, db_path):
    return ImageEncoders(Database(db_path)).save(ImageEncoderEdit.model_validate(args)).model_dump()


def feature_connection_check(args, db_path):
    from iad_core.workbench.runtime import workbench
    runtime=workbench(db_path)
    selection=ImageEncoderConfig.model_validate(args['selection']) if 'selection' in args else ImageEncoders(runtime.db).read().selection
    if selection is None:
        raise ConsistencyError('PROFILE_NOT_CONFIGURED','Configure an image encoder before checking it')
    return runtime.images.check(selection)
