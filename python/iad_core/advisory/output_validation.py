from pydantic_core import PydanticCustomError


REPAIRABLE_OUTPUT = 'repairable_output'


def repairable_output_error(code: str, message: str) -> PydanticCustomError:
    return PydanticCustomError(code, message, {REPAIRABLE_OUTPUT: True})
