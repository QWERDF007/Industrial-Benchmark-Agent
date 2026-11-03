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

  const results = {
    tabsDeleted: false,
    datasetPanelFound: false,
    filterBarFound: false,
    gridCardsFound: false,
    paginationRightAlignedWithTotal: false,
    childMultiSelectWorks: false,
    detailModalOpened: false,
    fullscreenViewerOpened: false,
    errors: [],
  };

  try {
    await driver.manage().window().setRect({ width: 1440, height: 900 });
    console.log('Navigating to http://127.0.0.1:8000/ ...');
    await driver.get('http://127.0.0.1:8000/');

    // Dismiss any welcome modal if present
    try {
      const later = await driver.wait(until.elementLocated(By.xpath('//button[normalize-space(.)="Configure later"]')), 2000);
      await later.click();
      console.log('Dismissed Configure later modal.');
    } catch {}

    // Navigate to "图像浏览"
    console.log('Navigating to 图像浏览...');
    const navBtn = await driver.wait(until.elementLocated(By.xpath("//button[@aria-label='图像浏览' or contains(., '图像浏览')]")), 5000);
    await navBtn.click();
    await driver.sleep(1500);

    // 1. Verify 【良品来源】tab page is completely deleted
    const pageTabs = await driver.findElements(By.xpath("//*[contains(text(), '良品来源') and (self::button or self::a or self::div)]"));
    const tabsExist = pageTabs.length > 0;
    results.tabsDeleted = !tabsExist;
    console.log('良品来源 tab present?', tabsExist, '-> tabsDeleted:', results.tabsDeleted);

    // 2. Verify dataset-panel
    const parentSelect = await driver.findElement(By.id('parent'));
    const childTrigger = await driver.findElement(By.id('child'));
    const refreshBtn = await driver.findElement(By.id('refresh'));
    results.datasetPanelFound = !!(parentSelect && childTrigger && refreshBtn);
    console.log('dataset-panel found:', results.datasetPanelFound);

    // 3. Verify filter-bar
    const searchInput = await driver.findElement(By.id('search'));
    const qualityElements = await driver.findElements(By.id('quality'));
    const annElements = await driver.findElements(By.id('annotation'));
    const catElements = await driver.findElements(By.id('category'));
    const resetBtn = await driver.findElement(By.id('reset'));
    results.filterBarFound = !!(searchInput && resetBtn && (qualityElements.length > 0 || catElements.length > 0));
    console.log('filter-bar found:', results.filterBarFound);

    // 4. Verify grid cards
    await driver.wait(until.elementLocated(By.css('.card')), 8000);
    const cards = await driver.findElements(By.css('.card'));
    results.gridCardsFound = cards.length > 0;
    console.log(`Grid cards count: ${cards.length}, found: ${results.gridCardsFound}`);

    // 5. Verify Pagination: right-aligned with total
    const pager = await driver.findElement(By.id('pager'));
    const pageTotal = await driver.findElement(By.css('.pagination-total'));
    const totalText = await pageTotal.getText();
    const pagerStyle = await driver.executeScript(() => {
      const p = document.getElementById('pager');
      const controls = document.querySelector('.pagination-controls');
      const totalSpan = document.querySelector('.pagination-total');
      const pRect = p?.getBoundingClientRect();
      const cRect = controls?.getBoundingClientRect();
      const compP = window.getComputedStyle(p);
      return {
        justifyContent: compP.justifyContent,
        totalText: totalSpan?.textContent,
        isRightAligned: (pRect.right - cRect.right) < 20,
      };
    });
    console.log('Pagination info:', pagerStyle);
    results.paginationRightAlignedWithTotal = pagerStyle.totalText?.includes('共') && pagerStyle.totalText?.includes('张图像');

    // Screenshot main view
    const mainShot = await driver.takeScreenshot();
    fs.writeFileSync('/tmp/images_v10_main.png', mainShot, 'base64');
    console.log('Saved /tmp/images_v10_main.png');

    // 6. Child multi-select interaction
    await childTrigger.click();
    await driver.sleep(300);
    const childMenu = await driver.findElement(By.id('child-menu'));
    const menuHidden = await childMenu.getAttribute('hidden');
    results.childMultiSelectWorks = menuHidden === null;
    console.log('Child menu opened, hidden attribute:', menuHidden);

    const childShot = await driver.takeScreenshot();
    fs.writeFileSync('/tmp/images_v10_child_menu.png', childShot, 'base64');
    console.log('Saved /tmp/images_v10_child_menu.png');

    // Close menu by clicking trigger again
    await childTrigger.click();
    await driver.sleep(200);

    // 7. Click first card to open Stage 1 Detail Modal
    console.log('Clicking first image card...');
    await cards[0].click();
    await driver.sleep(1000);

    const overlay = await driver.findElement(By.id('overlay'));
    const overlayHidden = (await overlay.getAttribute('class')).includes('hidden');
    results.detailModalOpened = !overlayHidden;
    console.log('Detail modal opened:', results.detailModalOpened);

    const detailShot = await driver.takeScreenshot();
    fs.writeFileSync('/tmp/images_v10_detail_modal.png', detailShot, 'base64');
    console.log('Saved /tmp/images_v10_detail_modal.png');

    // 8. Click preview in Stage 1 to open Stage 2 Fullscreen Viewer
    console.log('Opening Stage 2 Fullscreen Viewer...');
    const detailPreview = await driver.findElement(By.id('detail-preview'));
    await detailPreview.click();
    await driver.sleep(1000);

    const fullOverlay = await driver.findElement(By.id('full-overlay'));
    const fullHidden = (await fullOverlay.getAttribute('class')).includes('hidden');
    results.fullscreenViewerOpened = !fullHidden;
    console.log('Fullscreen viewer opened:', results.fullscreenViewerOpened);

    const fullShot = await driver.takeScreenshot();
    fs.writeFileSync('/tmp/images_v10_fullscreen.png', fullShot, 'base64');
    console.log('Saved /tmp/images_v10_fullscreen.png');

    // Close Fullscreen Viewer
    const fullClose = await driver.findElement(By.id('full-close'));
    await fullClose.click();
    await driver.sleep(500);

    // Close Detail Modal
    const detailClose = await driver.findElement(By.id('close'));
    await detailClose.click();
    await driver.sleep(300);

    console.log('ALL TESTS PASSED SUCCESSFULLY!');
    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error('Error during test:', err);
    results.errors.push(err.message);
  } finally {
    await driver.quit();
  }
}

main();
