import fs from 'node:fs';
import { Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

async function main() {
  const options = new firefox.Options().addArguments('-headless');
  const driver = await new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder('/tmp/geckodriver'))
    .build();

  try {
    await driver.manage().window().setRect({ width: 1920, height: 1080 });
    console.log('Navigating to http://127.0.0.1:8000/ ...');
    await driver.get('http://127.0.0.1:8000/');

    // Dismiss any welcome modal if present
    try {
      const later = await driver.wait(until.elementLocated(By.xpath('//button[normalize-space(.)="Configure later"]')), 3000);
      await later.click();
      console.log('Dismissed Configure later modal.');
    } catch {}

    // Navigate to Dataset Manager tab if not already there
    try {
      const navBtn = await driver.wait(until.elementLocated(By.xpath("//button[@aria-label='数据集管理' or contains(., '数据集管理')]")), 5000);
      await navBtn.click();
      console.log('Clicked 数据集管理 navigation item.');
    } catch (e) {
      console.log('Note on navBtn:', e.message);
    }

    // Wait for the app and dataset table to load
    await driver.wait(until.elementLocated(By.css('table.dataset-table')), 15000);
    console.log('Dataset table found on live page!');

    // Wait a brief moment for styles/fonts to settle
    await driver.sleep(1000);

    // 1. Initial State: check selection and drawer
    const initialInfo = await driver.executeScript(() => {
      const selectedRows = document.querySelectorAll('tr[data-selected="true"]');
      const drawerRoot = document.getElementById('drawerRoot');
      const drawerOpen = drawerRoot?.classList.contains('open');
      const table = document.querySelector('table.dataset-table');
      const tableWidth = table?.getBoundingClientRect().width;

      // Check button borders and backgrounds
      const pencil = document.querySelector('.pencil');
      const expand = document.querySelector('.expand');
      const iconBtn = document.querySelector('.icon-button');

      function getBtnStyle(el) {
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          borderWidth: cs.borderWidth,
          borderStyle: cs.borderStyle,
          borderColor: cs.borderColor,
          backgroundColor: cs.backgroundColor,
          padding: cs.padding,
          minHeight: cs.minHeight,
        };
      }

      return {
        selectedRowCount: selectedRows.length,
        drawerOpen: !!drawerOpen,
        tableWidth,
        pencil: getBtnStyle(pencil),
        expand: getBtnStyle(expand),
        iconBtn: getBtnStyle(iconBtn),
      };
    });

    console.log('Initial State Inspection:', JSON.stringify(initialInfo, null, 2));

    // Take screenshot of Initial State
    const initialPng = await driver.takeScreenshot();
    fs.writeFileSync('/tmp/live_ui_01_initial.png', Buffer.from(initialPng, 'base64'));
    console.log('Saved /tmp/live_ui_01_initial.png');

    // 2. Click a child row to open drawer
    const childRow = await driver.findElement(By.css('tr.data-row:not(.parent-row)'));
    await driver.executeScript('arguments[0].click()', childRow);
    await driver.sleep(600);

    const openedInfo = await driver.executeScript(() => {
      const selectedRows = document.querySelectorAll('tr[data-selected="true"]');
      const drawerRoot = document.getElementById('drawerRoot');
      const drawerOpen = drawerRoot?.classList.contains('open');
      const table = document.querySelector('table.dataset-table');
      const tableWidth = table?.getBoundingClientRect().width;
      const drawer = document.querySelector('.dataset-drawer');
      const drawerRect = drawer?.getBoundingClientRect();

      const drawerClose = document.querySelector('.drawer-close');
      const copyId = document.querySelector('.copy-id');

      function getBtnStyle(el) {
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          borderWidth: cs.borderWidth,
          borderStyle: cs.borderStyle,
          borderColor: cs.borderColor,
          backgroundColor: cs.backgroundColor,
        };
      }

      return {
        selectedRowCount: selectedRows.length,
        drawerOpen: !!drawerOpen,
        tableWidth,
        drawerRect: drawerRect ? { width: drawerRect.width, left: drawerRect.left, right: drawerRect.right } : null,
        drawerClose: getBtnStyle(drawerClose),
        copyId: getBtnStyle(copyId),
      };
    });

    console.log('Opened Drawer State Inspection:', JSON.stringify(openedInfo, null, 2));

    // Take screenshot of Drawer Open State
    const openedPng = await driver.takeScreenshot();
    fs.writeFileSync('/tmp/live_ui_02_drawer_open.png', Buffer.from(openedPng, 'base64'));
    console.log('Saved /tmp/live_ui_02_drawer_open.png');

    // 3. Click Close Drawer button
    const closeBtn = await driver.findElement(By.css('.drawer-close'));
    await driver.executeScript('arguments[0].click()', closeBtn);
    await driver.sleep(600);

    const closedInfo = await driver.executeScript(() => {
      const selectedRows = document.querySelectorAll('tr[data-selected="true"]');
      const drawerRoot = document.getElementById('drawerRoot');
      const drawerOpen = drawerRoot?.classList.contains('open');
      const table = document.querySelector('table.dataset-table');
      const tableWidth = table?.getBoundingClientRect().width;
      return {
        selectedRowCount: selectedRows.length,
        drawerOpen: !!drawerOpen,
        tableWidth,
      };
    });

    console.log('After Close State Inspection:', JSON.stringify(closedInfo, null, 2));

    // Verification asserts:
    if (initialInfo.selectedRowCount !== 0) throw new Error('Expected 0 rows selected initially');
    if (initialInfo.drawerOpen !== false) throw new Error('Expected drawer to be closed initially');
    if (initialInfo.pencil && initialInfo.pencil.borderWidth !== '0px') throw new Error('Pencil button still has border: ' + initialInfo.pencil.borderWidth);
    if (initialInfo.expand && initialInfo.expand.borderWidth !== '0px') throw new Error('Expand button still has border: ' + initialInfo.expand.borderWidth);
    if (initialInfo.iconBtn && initialInfo.iconBtn.borderWidth !== '0px') throw new Error('Icon button still has border: ' + initialInfo.iconBtn.borderWidth);

    if (openedInfo.drawerOpen !== true) throw new Error('Expected drawer to open on row click');
    if (openedInfo.drawerClose.borderWidth !== '0px') throw new Error('Drawer close button has border');
    if (openedInfo.copyId.borderWidth !== '0px') throw new Error('Copy id button has border');

    // Table width should remain identical (no squeeze)
    const widthDiff = Math.abs(initialInfo.tableWidth - openedInfo.tableWidth);
    console.log(`Table width initial: ${initialInfo.tableWidth}px, when drawer open: ${openedInfo.tableWidth}px (diff: ${widthDiff}px)`);
    if (widthDiff > 2) throw new Error(`Table was squeezed! Width changed by ${widthDiff}px`);

    console.log('\nLIVE UI VERIFICATION ALL PASSED!');
  } finally {
    await driver.quit();
  }
}

main().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
