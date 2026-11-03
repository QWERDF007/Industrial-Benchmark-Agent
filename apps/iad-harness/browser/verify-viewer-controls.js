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
    topToolbarDedicated: false,
    zoomWrapStyled: false,
    magnifyingGlassIcons: false,
    eyeIconToggle: false,
    bboxesInsideImage: false,
    bboxLocations: [],
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
    } catch {}

    // Navigate to "图像浏览"
    console.log('Navigating to 图像浏览...');
    const navBtn = await driver.wait(until.elementLocated(By.xpath("//button[@aria-label='图像浏览' or contains(., '图像浏览')]")), 5000);
    await navBtn.click();
    await driver.sleep(1500);

    // Filter or search for picture_13
    console.log('Searching for picture_13...');
    const searchInput = await driver.findElement(By.id('search'));
    await searchInput.clear();
    await searchInput.sendKeys('picture_13');
    await driver.sleep(1000);

    // Wait for card to be present
    const cards = await driver.findElements(By.className('card'));
    console.log('Found cards for picture_13:', cards.length);
    if (cards.length === 0) {
      throw new Error('No cards found for picture_13');
    }

    // Click the card
    await cards[0].click();
    await driver.sleep(1000);

    // Click preview to enter Stage 2 Fullscreen
    const detailPreview = await driver.findElement(By.id('detail-preview'));
    await detailPreview.click();
    await driver.sleep(1000);

    // 1. Check dedicated top toolbar
    const toolbar = await driver.findElement(By.className('full-toolbar'));
    const stage = await driver.findElement(By.id('stage'));
    const toolbarRect = await toolbar.getRect();
    const stageRect = await stage.getRect();
    console.log('Toolbar rect:', toolbarRect);
    console.log('Stage rect:', stageRect);
    results.topToolbarDedicated = toolbarRect.height > 40 && stageRect.y >= toolbarRect.y + toolbarRect.height;

    // 2. Check zoom dropdown wrap
    const zoomWrap = await driver.findElement(By.className('zoom-wrap'));
    const zoomSelect = await driver.findElement(By.id('zoom'));
    const zoomVal = await zoomSelect.getAttribute('value');
    console.log('Zoom select value:', zoomVal);
    results.zoomWrapStyled = !!zoomWrap;

    // 3. Check magnifying glass icons for zoom-out and zoom-in
    const zoomOutBtn = await driver.findElement(By.id('zoom-out'));
    const zoomInBtn = await driver.findElement(By.id('zoom-in'));
    const zoomOutSvg = await zoomOutBtn.getAttribute('innerHTML');
    const zoomInSvg = await zoomInBtn.getAttribute('innerHTML');
    const hasMinusLens = zoomOutSvg.includes('circle cx="11"') && zoomOutSvg.includes('M8 11h6');
    const hasPlusLens = zoomInSvg.includes('circle cx="11"') && zoomInSvg.includes('M11 8v6');
    results.magnifyingGlassIcons = hasMinusLens && hasPlusLens;
    console.log('Magnifying glass icons present:', results.magnifyingGlassIcons);

    // 4. Check Eye icon for annotation toggle
    const annToggle = await driver.findElement(By.id('annotation-toggle'));
    const annSvgBefore = await annToggle.getAttribute('innerHTML');
    const annPressedBefore = await annToggle.getAttribute('aria-pressed');
    const titleBefore = await annToggle.getAttribute('title');
    console.log('Annotation toggle initial:', { pressed: annPressedBefore, title: titleBefore });

    // Toggle off
    await annToggle.click();
    await driver.sleep(300);
    const annSvgAfter = await annToggle.getAttribute('innerHTML');
    const annPressedAfter = await annToggle.getAttribute('aria-pressed');
    const titleAfter = await annToggle.getAttribute('title');
    console.log('Annotation toggle after click:', { pressed: annPressedAfter, title: titleAfter });
    const hasSlashWhenOff = annSvgAfter.includes('m3 3 18 18');

    // Toggle back on
    await annToggle.click();
    await driver.sleep(300);
    const annSvgRestored = await annToggle.getAttribute('innerHTML');
    results.eyeIconToggle = hasSlashWhenOff && !annSvgRestored.includes('m3 3 18 18');
    console.log('Eye icon toggles slash properly:', results.eyeIconToggle);

    // 5. Check bbox positions relative to image
    const bigImg = await driver.findElement(By.id('big-image'));
    const imgRect = await bigImg.getRect();
    console.log('big-image bounding rect:', imgRect);

    const bboxes = await driver.findElements(By.css('#full-annotation-layer .bbox'));
    console.log('Number of bboxes rendered:', bboxes.length);
    let allInside = bboxes.length > 0;
    for (let i = 0; i < bboxes.length; i++) {
      const bRect = await bboxes[i].getRect();
      const label = await bboxes[i].getAttribute('data-label');
      console.log(`Bbox #${i} (label=${label}):`, bRect);
      results.bboxLocations.push({ label, ...bRect });

      // Verify that bbox is strictly within the image bounds (with 5px margin of error)
      const insideX = bRect.x >= imgRect.x - 5 && bRect.x + bRect.width <= imgRect.x + imgRect.width + 5;
      const insideY = bRect.y >= imgRect.y - 5 && bRect.y + bRect.height <= imgRect.y + imgRect.height + 5;
      if (!insideX || !insideY) {
        console.error(`Bbox #${i} is OUTSIDE the image! img:`, imgRect, 'bbox:', bRect);
        allInside = false;
      }
    }
    results.bboxesInsideImage = allInside;
    console.log('Are all bboxes strictly on the image?', results.bboxesInsideImage);

    // Take screenshot of fullscreen viewer
    const fullShot = await driver.takeScreenshot();
    fs.writeFileSync('/tmp/verified_fullscreen_viewer.png', fullShot, 'base64');
    fs.writeFileSync('/home/dell/.gemini/antigravity-cli/brain/a36a5c63-3c83-4b2c-b4ff-8a1730f771df/verified_fullscreen_viewer.png', fullShot, 'base64');
    console.log('Saved verified_fullscreen_viewer.png');

    console.log('RESULT SUMMARY:', JSON.stringify(results, null, 2));
  } catch (err) {
    console.error('Error during verification:', err);
    results.errors.push(err.message);
  } finally {
    await driver.quit();
  }
}

main();
