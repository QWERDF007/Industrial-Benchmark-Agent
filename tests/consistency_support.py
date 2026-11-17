from iad_core.consistency.agent_preparation import ConsistencyAgentPreparation
from tests.test_consistency_agent_preparation import wait_for_preparation


def start_prepared(checks, request):
    result = checks.start(request)
    wait_for_preparation(ConsistencyAgentPreparation(checks.runtime), result['run_id'])
    return result
