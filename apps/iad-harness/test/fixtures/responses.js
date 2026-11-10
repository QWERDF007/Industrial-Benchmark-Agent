export function chatRequest(body) {
  if (!body.input) return body;
  const content=value=>Array.isArray(value)?value.map(part=>part.type==='input_image'
    ?{type:'image_url',image_url:{url:part.image_url}}:{type:'text',text:part.text}):value;
  return {...body,responses:body,
    messages:body.input.map(item=>item.type==='function_call_output'?{role:'tool',content:content(item.output)}
      :item.type==='function_call'?{role:'assistant',tool_calls:[{id:item.call_id,type:'function',function:{name:item.name,arguments:item.arguments}}]}
      :{role:item.role,content:content(item.content)}),
    tools:body.tools?.map(tool=>({type:'function',function:tool})),max_tokens:body.max_output_tokens};
}

export function sendResponses(res,model,delta,usage={input_tokens:1000,output_tokens:100,total_tokens:1100}) {
  const output=delta.tool_calls?.map((call,index)=>({type:'function_call',id:'fc_fixture_'+index,call_id:call.id,
    name:call.function.name,arguments:call.function.arguments,status:'completed'}))
    ||[{id:'msg_fixture',type:'message',role:'assistant',status:'completed',
      content:[{type:'output_text',text:delta.content,annotations:[]}]}];
  const response={id:'resp_fixture',object:'response',created_at:1,model,status:'completed',output,
    parallel_tool_calls:true,tool_choice:'auto',tools:[],
    usage:{...usage,input_tokens_details:{cached_tokens:0},output_tokens_details:{reasoning_tokens:0}}};
  res.writeHead(200,{'Content-Type':'text/event-stream'});
  const write=event=>res.write('event: '+event.type+'\ndata: '+JSON.stringify(event)+'\n\n');
  write({type:'response.created',response:{...response,status:'in_progress',output:[]}});
  for(const [index,item] of output.entries()) {
    write({type:'response.output_item.added',output_index:index,item:{...item,status:'in_progress',
      ...(item.type==='function_call'?{arguments:''}:{content:[]})}});
    if(item.type==='function_call')write({type:'response.function_call_arguments.delta',item_id:item.id,output_index:index,delta:item.arguments});
    else {
      write({type:'response.content_part.added',item_id:item.id,output_index:index,content_index:0,
        part:{type:'output_text',text:'',annotations:[]}});
      write({type:'response.output_text.delta',item_id:item.id,output_index:index,content_index:0,delta:delta.content});
    }
    write({type:'response.output_item.done',output_index:index,item});
  }
  write({type:'response.completed',response});res.end();
}
