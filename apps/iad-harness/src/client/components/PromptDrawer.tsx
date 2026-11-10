import React, {useState} from 'react';
import {Button} from './Button.js';
import {Modal} from './Modal.js';
import {IconButton} from './IconButton.js';
import {copyText} from '../clipboard.js';

export function PromptDrawer({title, text, systemText, additionalSections=[], onClose}: {
  title: string; text: string; systemText?:string|null;
  additionalSections?:ReadonlyArray<{title:string;text:string}>;onClose(): void;
}) {
  const [notice,setNotice] = useState('');
  const sections=[...(systemText?[{title:'系统提示词',text:systemText}]:[]),
    {title:systemText?'用户提示词':'',text},...additionalSections];
  return <Modal title={title} className="iad-drawer iad-prompt-drawer" header={false} onClose={onClose}>
    <header className="iad-dialog-header"><h2>{title}</h2>
      <Button onClick={async()=>{
        try {await copyText(sections.map(section=>(section.title?section.title+'\n':'')+section.text).join('\n\n')); setNotice('已复制');}
        catch {setNotice('复制失败');}
      }}>复制提示词</Button>
      <IconButton icon="close" label={`关闭${title}抽屉`} onClick={onClose} />
    </header>
    <div className="iad-dialog-body">{notice && <p role="status">{notice}</p>}
      {sections.map(section=><React.Fragment key={section.title}>
        {section.title&&<h3>{section.title}</h3>}<pre className="iad-prompt-text">{section.text}</pre>
      </React.Fragment>)}</div>
  </Modal>;
}
