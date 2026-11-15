from openai.types.responses import Response
from iad_core.workbench.model_profile import ReasoningEffort
from iad_core.workbench.completion import RetryableModelError


class ResponsesProtocol:
    @staticmethod
    def request(model: str, messages: list[dict], schema: dict, parameters: dict, reasoning_effort: ReasoningEffort | None = None) -> dict:
        inputs = []
        for message in messages:
            content = message['content']
            if isinstance(content, list):
                content = [{'type':'input_text','text':part['text']} if part['type']=='text'
                    else {'type':'input_image','image_url':part['image_url']['url']}
                    for part in content]
            inputs.append({'role':message['role'],'content':content})
        options = dict(parameters)
        response_format = options.pop('response_format', None)
        output_format = response_format if response_format else {'type':'json_schema', **schema}
        return {'model':model,'input':inputs,'text':{'format':output_format},'stream':True,'store':False,**options,
            **({'reasoning':{'effort':reasoning_effort}} if reasoning_effort is not None else {})}

    @staticmethod
    def text(body: dict) -> str:
        result = Response.model_construct(**body)
        if result.status != 'completed':
            reason = result.incomplete_details.reason if result.incomplete_details else result.error.message if result.error else result.status
            if result.status == 'failed' and result.error and result.error.code in (
                    'upstream_error', 'upstream_stream_read_error', 'server_error', 'rate_limit_exceeded'):
                raise RetryableModelError('Responses 模型服务临时失败：' + str(reason))
            raise ValueError('Responses 模型输出未完整完成：' + str(reason))
        if not result.output_text.strip():
            raise ValueError('Responses 模型没有返回最终文本')
        return result.output_text
