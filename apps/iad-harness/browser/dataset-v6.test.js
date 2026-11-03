import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import esbuild from 'esbuild';
import {Builder, By, Key, until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {viewport} from './workbench-layout.js';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('V6 DatasetManager prototype alignment: drawer, inline rename, identifier, actions layout', {timeout: 60000}, async () => {
  const bundle = await esbuild.build({
    stdin: {
      contents: `
        import React, { useState } from 'react';
        import ReactDOM from 'react-dom/client';
        import { DatasetManager } from './src/client/components/DatasetManager.tsx';
        import { datasetsStyles } from './src/client/styles/datasets.ts';
        import { themeStyles } from './src/client/theme.ts';
        import { WorkspaceContext } from './src/client/workspace.tsx';

        const mockSnapshot = { datasetId: 'ds_8bf1c1e9ef8042869adb044a36b7e2a0', pageId: 'industrial-datasets' };
        const mockWorkspace = {
          view: () => ({ tab: 'results', page: 1, filters: {} }),
          updateView: () => {},
          selectDataset: () => {},
          forgetDataset: () => {},
          subscribe: () => () => {},
          getSnapshot: () => mockSnapshot,
        };

        const initialGroups = [
          { group_id: 'group-1', name: '框胶大数据集' },
          { group_id: 'group-2', name: '超节点数据集' }
        ];

        const base = '/data1/wt/data/框胶数据集/';
        const initialDatasets = [
          { dataset_id: 'ds_a', group_id: 'group-1', name: '框胶_数据增强', format: 'labelme', total_samples: 57, annotation_count: 69, image_dir: base + 'ExportImage_数据增强', annotation_dir: base + 'ExportLabel_数据增强' },
          { dataset_id: 'ds_8bf1c1e9ef8042869adb044a36b7e2a0', group_id: 'group-1', name: '框胶_框胶10x连续蓝色背景_0904-Test', format: 'labelme', total_samples: 505, annotation_count: 642, image_dir: base + 'ExportImage_框胶10x连续蓝色背景_0904-Test', annotation_dir: base + 'ExportLabel_框胶10x连续蓝色背景_0904-Test' },
          { dataset_id: 'ds_c', group_id: 'group-1', name: '框胶_框胶10x连续蓝色背景_0904-Train', format: 'labelme', total_samples: 4508, annotation_count: 6042, image_dir: base + 'ExportImage_框胶10x连续蓝色背景_0904-Train', annotation_dir: base + 'ExportLabel_框胶10x连续蓝色背景_0904-Train' },
          { dataset_id: 'ds_d', group_id: 'group-1', name: '框胶_漏检', format: 'labelme', total_samples: 4, annotation_count: 1, image_dir: base + 'ExportImage_漏检', annotation_dir: base + 'ExportLabel_漏检' },
          { dataset_id: 'ds_e', group_id: 'group-2', name: '超节点异常检测数据', format: 'folder_classification', total_samples: 980, annotation_count: 980, labeled_sample_count: 980, image_dir: '/data1/wt/data/超节点异常检测数据', annotation_dir: '', folder_rules: [{ path: 'OK', role: 'normal' }, { path: 'NG', role: 'anomaly' }] }
        ];

        function App() {
          const [datasets, setDatasets] = useState(initialDatasets);
          const [groups, setGroups] = useState(initialGroups);

          return (
            <WorkspaceContext.Provider value={mockWorkspace}>
              <div className="iad-workbench" data-page="industrial-datasets">
                <style>{themeStyles}</style>
                <style>{datasetsStyles}</style>
                <DatasetManager
                  datasets={datasets}
                  groups={groups}
                  selected={datasets[1]}
                  onChanged={(id) => {}}
                />
              </div>
            </WorkspaceContext.Provider>
          );
        }

        ReactDOM.createRoot(document.getElementById('root')).render(<App />);
      `,
      loader: 'tsx',
      resolveDir: app,
    },
    bundle: true,
    format: 'iife',
    write: false,
    target: 'es2022',
    define: { 'process.env.NODE_ENV': '"production"' },
  });

  const server = http.createServer((req, res) => {
    if (req.url === '/browser.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(bundle.outputFiles[0].contents);
    } else if (req.url.startsWith('/api/iad/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, directories: [], items: [], datasets: [], groups: [] }));
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<!DOCTYPE html><html><head><meta charset="UTF-8"><script>window.__errors=[];window.onerror=function(msg,url,l,c,e){window.__errors.push({msg,stack:e?.stack});document.body.innerHTML+="<pre>"+msg+"\\n"+e?.stack+"</pre>";};</script><style>body{margin:0;font-family:sans-serif}</style></head><body><div id="root"></div><script src="/browser.js"></script></body></html>');
    }
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let driver;
  try {
    const options = new firefox.Options().addArguments('-headless');
    if (process.env.FIREFOX_PATH) options.setBinary(process.env.FIREFOX_PATH);
    driver = await new Builder()
      .forBrowser('firefox')
      .setFirefoxOptions(options)
      .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH || '/tmp/geckodriver'))
      .build();

    await viewport(driver, 1920, 1080);
    await driver.get(`http://127.0.0.1:${server.address().port}`);

    const el = selector => driver.wait(until.elementLocated(By.css(selector)), 5000);
    await el('table.dataset-table');

    // 1. Verify layout & alignment
    const measured = await driver.executeScript(() => {
      const table = document.querySelector('table.dataset-table');
      const thLast = table.querySelector('th:last-child');
      const pencil = table.querySelector('.pencil');
      const actions = table.querySelector('.actions');
      const parentRow = table.querySelector('tr.parent-row');
      const childRow = table.querySelector('tr.data-row:not(.parent-row)');
      return {
        tableFont: getComputedStyle(table).fontSize,
        rowHeight: parentRow?.getBoundingClientRect().height,
        headerAlign: getComputedStyle(thLast).textAlign,
        pencilDisplay: getComputedStyle(pencil).display,
        pencilMarginLeft: getComputedStyle(pencil).marginLeft,
        actionsJustify: getComputedStyle(actions).justifyContent,
        childPaddingLeft: getComputedStyle(childRow.querySelector('.name-area')).paddingLeft,
      };
    });

    assert.equal(measured.tableFont, '13px', '表格使用13px字号');
    assert.equal(measured.headerAlign, 'right', '表头操作右对齐');
    assert.equal(measured.pencilDisplay, 'grid', '铅笔居中显示');
    assert.equal(measured.actionsJustify, 'flex-end', '操作列按钮靠右对齐');
    assert.equal(measured.childPaddingLeft, '33px', '子级行名称缩进33px');

    // 2. Drawer Verification for Child Dataset
    const drawer = await el('.dataset-drawer');
    const subTitle = await (await el('#detailSub')).getText();
    assert.equal(subTitle, '子数据集', '选中子数据集时抽屉副标题显示“子数据集”');

    const idHeading = await (await el('.identifier-section h3')).getText();
    assert.equal(idHeading, '数据集标识', '存在独立的“数据集标识”小标题');

    const idValue = await (await el('.identifier-section .identifier-value span')).getText();
    assert.equal(idValue, 'ds_8bf1c1e9ef8042869adb044a36b7e2a0', '展示正确的数据集标识');

    const copyBtn = await el('.identifier-section button[aria-label="复制数据集标识"]');
    assert.ok(copyBtn, '数据集标识右侧有复制按钮');

    // 3. Select Parent Row -> Drawer updates
    const parentRow = await el('.data-row.parent-row[data-id="group-1"]');
    await driver.executeScript('arguments[0].click()', parentRow);

    await driver.wait(async () => {
      const text = await (await el('#detailSub')).getText();
      return text === '数据集';
    }, 3000);

    const parentIdVal = await (await el('.identifier-section .identifier-value span')).getText();
    assert.equal(parentIdVal, 'group-1', '父级抽屉展示group-1标识');
    assert.equal((await driver.findElements(By.css('.dataset-drawer input'))).length, 0, '父级抽屉无输入框配置项');

    // 4. Inline rename with Enter and Esc
    const childRow = await el('.data-row[data-id="ds_a"]');
    await driver.executeScript('arguments[0].click()', childRow);
    const pencilBtn = await el('.data-row[data-id="ds_a"] .pencil');
    await driver.executeScript('arguments[0].click()', pencilBtn);

    const editInput = await el('input[data-edit-input]');
    await driver.executeScript(`
      const input = arguments[0];
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, '新名称测试');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    `, editInput);
    await editInput.sendKeys(Key.ENTER);

    await driver.wait(async () => {
      const title = await (await el('.data-row[data-id="ds_a"] .name-text')).getText();
      return title === '新名称测试';
    }, 3000);

    // 5. Expand / Collapse chevron
    const expandBtn = await el('button[data-expand="group-1"]');
    await expandBtn.click();
    await driver.wait(async () => {
      const rows = await driver.findElements(By.css('.data-row[data-id="ds_a"]'));
      return rows.length === 0;
    }, 3000);
    await expandBtn.click();
    await driver.wait(async () => {
      const rows = await driver.findElements(By.css('.data-row[data-id="ds_a"]'));
      return rows.length > 0;
    }, 3000);

    // 5.5 Verify Drawer Close
    const closeBtn = await el('.drawer-close');
    await closeBtn.click();
    await driver.wait(async () => {
      const root = await el('#drawerRoot');
      const cls = await root.getAttribute('class');
      return !cls.includes('open');
    }, 3000);

    // 6. Add Dataset Modal from parent row '+'
    const addParentBtn = await el('button[data-add-parent="group-1"]');
    await addParentBtn.click();
    await el('.modal[aria-label="添加数据集"]');

    const groupRadio = await el('input[name="new-kind"][value="group"]');
    assert.equal(await groupRadio.isEnabled(), false, '从父级+入口打开时禁止选择父数据集类型');
    const childRadio = await el('input[name="new-kind"][value="child"]');
    assert.equal(await childRadio.isSelected(), true, '默认选中子数据集');

    await (await el('.modal-x')).click();
    await driver.wait(async () => (await driver.findElements(By.css('.modal'))).length === 0, 3000);

    // 7. Delete modal protection on group with children
    const groupDeleteBtn = await el('.data-row[data-id="group-1"] button[data-delete]');
    await groupDeleteBtn.click();
    await el('.modal[aria-label="删除大数据集"]');
    const confirmDeleteBtn = await el('.modal button.primary');
    assert.equal(await confirmDeleteBtn.isEnabled(), false, '含子数据集的大数据集删除按钮被禁用');
    await (await el('.modal button.secondary')).click();

    console.log('V6 DatasetManager browser test completed successfully!');
  } finally {
    await driver?.quit();
    server.close();
  }
});
