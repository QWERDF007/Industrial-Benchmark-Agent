import base64
import hashlib
import json

from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.retrieval_models import RetrievalCursor, RetrievalPage, RetrievalPaging


class RetrievalPagination:
    def __init__(self, limits: RetrievalPaging | None = None):
        self.limits = limits or RetrievalPaging()

    @staticmethod
    def token(cursor: RetrievalCursor) -> str:
        return base64.urlsafe_b64encode(cursor.model_dump_json().encode()).decode().rstrip('=')

    def page(self, result: RetrievalPage, cursor: str | None) -> RetrievalPage:
        content = result.model_dump(mode='json')
        revision = hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()
        position = None
        if cursor is not None:
            try:
                if len(cursor) > 2048:
                    raise ValueError('Cursor is too long')
                position = RetrievalCursor.model_validate_json(base64.b64decode(cursor + '=' * (-len(cursor) % 4), altchars=b'-_', validate=True))
            except ValueError as error:
                raise ConsistencyError('INVALID_SCOPE', 'Invalid retrieval cursor') from error
            if position.revision != revision:
                raise ConsistencyError('SOURCE_UNAVAILABLE', 'Retrieval sources changed; restart pagination')
        result = result.model_copy(deep=True)
        for name in ('exact', 'visual'):
            branch = getattr(result, name)
            selected = position if position is not None and position.branch == name else None
            offset = selected.group_offset if selected else 0
            if selected and offset >= len(branch.groups):
                raise ConsistencyError('INVALID_SCOPE', 'Cursor group is outside the result')
            groups = branch.groups[offset:offset + self.limits.group_page_size]
            for index, group in enumerate(groups, offset):
                member_offset = selected.member_offset if selected and index == offset else 0
                if member_offset and member_offset >= group.member_count:
                    raise ConsistencyError('INVALID_SCOPE', 'Cursor member is outside the group')
                group.members = group.members[member_offset:member_offset + self.limits.member_page_size]
                following = member_offset + len(group.members)
                if following < group.member_count:
                    group.next_member_cursor = self.token(RetrievalCursor(revision=revision, branch=name,
                        group_offset=index, member_offset=following))
            branch.groups = groups
            following = offset + len(groups)
            if following < branch.group_count:
                branch.next_cursor = self.token(RetrievalCursor(revision=revision, branch=name, group_offset=following))
        return result
