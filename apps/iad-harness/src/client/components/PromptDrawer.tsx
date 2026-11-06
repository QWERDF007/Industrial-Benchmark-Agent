import React, {useState} from 'react';
import {Button} from './Button.js';
import {Modal} from './Modal.js';
import {IconButton} from './IconButton.js';
import {copyText} from '../clipboard.js';

export function PromptDrawer({title, text, onClose}: {title: string; text: string; onClose(): void}) {
  const [notice,setNotice] = useState('');
  return <Modal title={title} className="iad-drawer iad-prompt-drawer" header={false} onClose={onClose}>
    <header className="iad-dialog-header"><h2>{title}</h2>
      <Button onClick={async()=>{
        try {await copyText(text); setNotice('已复制');}
        catch {setNotice('复制失败');}
      }}>复制提示词</Button>
      <IconButton icon="close" label={`关闭${title}抽屉`} onClick={onClose} />
    </header>
    <div className="iad-dialog-body">{notice && <p role="status">{notice}</p>}<pre className="iad-prompt-text">{text}</pre></div>
  </Modal>;
}
