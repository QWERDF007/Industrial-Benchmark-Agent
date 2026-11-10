import re

from pydantic import BaseModel


class AnalysisCatalogReview:
    """Report factual linkage gaps and writing signals without changing model text."""

    @staticmethod
    def wording(text: str) -> list[str]:
        signals = re.findall(r'本轮|本批(?:新增)?|首轮|末轮|末批|末页|第\s*[\d一二三四五六七八九十]+\s*轮|[^\s/\\，。；]+\.(?:png|jpe?g|bmp|tiff?)\b'
            r'|\bimg_[a-f0-9]{1,63}\b|\b[NAU][1-9]\d*(?:\s*[、,，]\s*[NAU][1-9]\d*)+\b', text, re.IGNORECASE)
        return ['正文需按全部相关证据改写，不能用发现顺序、文件名或未登记的图像编号代替依据：' + '、'.join(dict.fromkeys(signals))] if signals else []

    @classmethod
    def prose(cls, item: BaseModel) -> list[str]:
        texts = item.model_dump(include={'title','instruction','rationale','subject','location','criterion',
            'allowed_variations','limitations','summary','unresolved_questions'})
        return cls.wording('\n'.join(text if isinstance(text, str) else '\n'.join(text) for text in texts.values()))

    def entry(self, item, arguments) -> list[str]:
        issues = self.prose(item)
        if not item.key_evidence:
            issues.append('尚未选择有独立作用及理由的关键原图')
        active = [item for item in arguments if item.state == 'active']
        if not active:
            issues.append('主张尚无当前有效的观察关联')
        if any(not item.reason for item in active):
            issues.append('完整有效论据仍有未核对的作用理由，请按条目回查并补齐')
        return issues
