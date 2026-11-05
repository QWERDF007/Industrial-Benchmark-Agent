RESPONSE_SCHEMA_SLOT = '{{response_schema}}'
RESPONSE_FORMAT_INSTRUCTION = ('若运行上下文提供输出校验结果，依据其中的Schema错误修正上次输出，重新返回一个完整结果。'
    '输出以下结构对应的一个完整JSON对象，不输出Markdown代码块、不复述格式定义，也不重复整个结果。根JSON对象闭合后立即结束生成，不继续输出右括号或其他内容。'
    '下面的格式变量在运行时替换为当前分析阶段的实际JSON Schema：\n' + RESPONSE_SCHEMA_SLOT + '\n')
