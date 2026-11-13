from typing import Literal


ConsistencyErrorCode = Literal['INVALID_SCOPE', 'SOURCE_UNAVAILABLE', 'UNSUPPORTED_IMAGE',
    'INDEX_NOT_READY', 'PROFILE_NOT_CONFIGURED', 'ENCODER_UNAVAILABLE', 'ANNOTATION_UNREADABLE',
    'RESOURCE_LIMIT', 'REFERENCE_NOT_FOUND', 'GATE_REVIEW_REQUIRED']


class ConsistencyError(ValueError):
    def __init__(self, code: ConsistencyErrorCode, message: str):
        super().__init__(message)
        self.code = code
        self.status_code = (404 if code=='REFERENCE_NOT_FOUND' else 400 if code in
            ('INVALID_SCOPE','UNSUPPORTED_IMAGE','RESOURCE_LIMIT') else 409)


class GateReviewRequired(ConsistencyError):
    def __init__(self):
        super().__init__('GATE_REVIEW_REQUIRED', '候选内容尚未正常完成核对，不能进入标注比较。')
