class ReferenceAliases:
    def __init__(self, aliases):
        self.public = dict(aliases)
        self.internal = {alias: identity for identity, alias in self.public.items()}
        if len(self.public) != len(self.internal):
            raise ValueError('冻结引用的短名称必须唯一')

    def translate(self, value, *, internal=False):
        identities = self.internal if internal else self.public
        if isinstance(value, str):
            return identities.get(value, value)
        if isinstance(value, list):
            return [self.translate(item, internal=internal) for item in value]
        if isinstance(value, dict):
            return {identities.get(key, key): self.translate(item, internal=internal) for key, item in value.items()}
        return value
