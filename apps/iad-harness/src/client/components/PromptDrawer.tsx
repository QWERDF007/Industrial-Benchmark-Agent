import React, {useState} from 'react';
import {Button} from './Button.js';
import {Modal} from './Modal.js';

export function PromptDrawer({title, text, onClose}: {title: string; text: string; onClose(): void}) {
  const [notice,setNotice] = useState('');
  return <Modal title={title} className="iad-drawer" onClose={onClose}>
    <div className="iad-dialog-body"><pre className="iad-prompt-text">{text}</pre></div>
    <footer className="iad-dialog-footer">{notice && <p role="status">{notice}</p>}
      <Button onClick={async()=>{
        try {await navigator.clipboard.writeText(text); setNotice('已复制');}
        catch {setNotice('复制失败');}
      }}>复制提示词</Button>
    </footer>
  </Modal>;
}
