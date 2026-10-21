from typing import Iterable, Optional

from iad_core.task.config import FolderRule


class FolderRules:
    """Confirmed, non-overlapping directory roles shared by preview and scanning."""

    aliases = {
        **dict.fromkeys(('ok', 'good', 'normal'), 'normal'),
        **dict.fromkeys(('ng', 'bad', 'abnormal', 'anomaly', 'defect'), 'anomaly'),
    }

    def __init__(self, rules: Iterable[FolderRule]):
        self.rules = sorted(rules, key=lambda rule: rule.path)
        self.conflicts = []
        for index, rule in enumerate(self.rules):
            for other in self.rules[:index]:
                if rule.path == other.path or (other.path != '.' and rule.path.startswith(other.path + '/')):
                    self.conflicts.append(f"目录规则重叠或冲突：'{other.path}' 与 '{rule.path}'")

    def resolve(self, directory: str) -> Optional[FolderRule]:
        return next((rule for rule in self.rules if directory == rule.path or
                     (rule.path != '.' and directory.startswith(rule.path + '/'))), None)

    @classmethod
    def suggest(cls, directories: Iterable[str]) -> 'FolderRules':
        rules = {}
        for directory in sorted(directories):
            parts = [] if directory == '.' else directory.split('/')
            candidates = []
            for index, name in enumerate(parts):
                role = cls.aliases.get(name.lower())
                if role and (not candidates or candidates[-1].role != role):
                    candidates.append(FolderRule(path='/'.join(parts[:index + 1]), role=role))
            for rule in candidates or [FolderRule(path=directory, role='unlabeled')]:
                rules[rule.path] = rule
        return cls(rules.values())
