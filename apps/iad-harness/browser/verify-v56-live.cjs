const { Builder, By, Key, until } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox.js");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

const ARTIFACT_DIR = "/home/dell/.gemini/antigravity-cli/brain/a36a5c63-3c83-4b2c-b4ff-8a1730f771df";

const results = {
  "exploration route": false,
  "direction detail visible": false,
  "direction detail dimensions": { w: 0, h: 0 },
  "direction images": 0,
  "direction cards": 0,
  "direction image height": 0,
  "direction evidence viewport height": 0,
  "direction Escape closes": false,
  "knowledge route": false,
  "create btn": false,
  "knowledge setup opens": false,
  "confirm header": "",
  "confirm summary": "",
  "confirm check": "",
  "start enabled": false,
  "legacy action bar removed": false,
  "prompt empty prevents submit": false,
  "prompt empty guidance": "",
  "restored prompt allows submit": false,
  "explore tab switches": false,
  "preset tab switches": false,
  "job demo created": false,
  "exploration headers no numbers": false,
  "exploration setup shows": false,
  "exploration headings": [],
  "consistency route": false,
  "direction narrow dialog dimensions": { w: 0, h: 0, vW: 900, vH: 700 },
  "narrow no horizontal overflow": false,
  "errors": []
};

function chk(condition, name) {
  assert.ok(condition, name);
  console.log("✓", name);
}

async function setViewport(driver, width, height) {
  const chrome = await driver.executeScript(
    "return { width: window.outerWidth - window.innerWidth, height: window.outerHeight - window.innerHeight };"
  );
  await driver.manage().window().setRect({
    width: Math.max(width + (chrome.width || 0), width),
    height: Math.max(height + (chrome.height || 0), height)
  });
  await driver.sleep(600);
}

async function run() {
  const options = new firefox.Options().addArguments("-headless");
  options.setPreference("javascript.options.intl_segmenter", true);

  const driver = await new Builder()
    .forBrowser("firefox")
    .setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder("/tmp/geckodriver"))
    .build();

  try {
    await driver.manage().window().setRect({ width: 1600, height: 1000 });
    await setViewport(driver, 1600, 1000);

    const logContent = fs.readFileSync("/data1/wt/Industrial-Benchmark-Agent/runs/dsh_web.log", "utf8");
    const matches = [...logContent.matchAll(/token=([^\s\)\&]+)/g)];
    const token = matches.length ? matches[matches.length - 1][1] : "";
    const url = `http://127.0.0.1:8000/?token=${token}`;
    console.log("Navigating to live app:", url);
    await driver.get(url);
    await driver.sleep(3000);

    // Dismiss welcome/config dialog if present
    try {
      const later = await driver.wait(
        until.elementLocated(By.xpath('//button[contains(., "稍后配置") or @aria-label="稍后配置"]')),
        2000
      );
      await later.click();
      await driver.sleep(1000);
    } catch (_) {}

    // =========================================================================
    // Part 1: Exploration Route & Headings (V56-04, V56-01, V56-02)
    // =========================================================================
    console.log("\n--- Testing Direction Exploration ---");
    const expNav = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(., "方向探索") or @aria-label="方向探索"]')),
      5000
    );
    await expNav.click();
    await driver.sleep(2500);
    results["exploration route"] = true;
    chk(true, "成功进入方向探索页面");

    // Click '新建探索' to inspect step panel headings
    const newExpBtns = await driver.findElements(By.xpath('//button[contains(., "新建探索")]'));
    if (newExpBtns.length > 0) {
      await newExpBtns[0].click();
      await driver.sleep(1000);
    }

    const stepEls = await driver.findElements(By.css(".exp-panel .exp-panel-title h2, .exp-panel h2"));
    const headings = [];
    for (const h of stepEls) {
      const text = (await h.getText()).trim();
      if (text) headings.push(text);
    }
    results["exploration headings"] = headings;
    results["exploration setup shows"] = headings.length >= 3;
    console.log("Exploration headings found:", headings);

    const hasNoNumbers =
      headings.includes("选择对比样例") &&
      headings.includes("探索提示词") &&
      headings.includes("确认并启动") &&
      !headings.some((h) => /^\d+[\.\、\s]/.test(h));
    results["exploration headers no numbers"] = hasNoNumbers;
    chk(hasNoNumbers, `探索步骤标题已无序号: ${JSON.stringify(headings)}`);

    // Click '返回作业与结果' to return to direction table view
    const backBtns = await driver.findElements(By.xpath('//button[contains(., "返回作业与结果")]'));
    if (backBtns.length > 0) {
      await backBtns[0].click();
      await driver.sleep(1000);
    }

    // Open Direction Detail Dialog
    const dirRows = await driver.findElements(
      By.css('tr[data-action="direction"], .exp-direction-view-icon, .exp-view-detail-button, .exp-direction-card')
    );
    chk(dirRows.length > 0, "探索页面存在方向卡片或表格行");
    await driver.executeScript("arguments[0].click();", dirRows[0]);
    await driver.sleep(1200);

    const dirDialog = await driver.wait(until.elementLocated(By.css(".exp-direction-dialog")), 3000);
    chk(await dirDialog.isDisplayed(), "方向详情弹窗已展示");
    results["direction detail visible"] = true;

    // Verify desktop dimensions 1380 x 820
    const desktopRect = await dirDialog.getRect();
    console.log("Desktop direction dialog rect:", desktopRect);
    results["direction detail dimensions"] = {
      w: Math.round(desktopRect.width),
      h: Math.round(desktopRect.height)
    };
    chk(Math.abs(desktopRect.width - 1380) <= 2, `桌面端方向详情宽度为1380px (实际: ${desktopRect.width})`);
    chk(Math.abs(desktopRect.height - 820) <= 2, `桌面端方向详情高度为820px (实际: ${desktopRect.height})`);

    // Verify evidence viewport and thumbnails
    const evViewport = await driver.findElement(By.css(".exp-evidence-viewport"));
    const evVpRect = await evViewport.getRect();
    results["direction evidence viewport height"] = Math.round(evVpRect.height);
    chk(Math.abs(evVpRect.height - 144) <= 2, `证据预览视口高度为144px (实际: ${evVpRect.height})`);

    const evCards = await dirDialog.findElements(By.css(".exp-direction-evidence-card, .exp-evidence-card"));
    const evImgs = await dirDialog.findElements(By.css(".exp-direction-evidence-card img, .exp-evidence-card img"));
    results["direction cards"] = evCards.length;
    results["direction images"] = evImgs.length;
    chk(evCards.length >= 6, `证据卡片数量应不低于6 (实际: ${evCards.length})`);
    chk(evImgs.length >= 6, `证据图片数量应不低于6 (实际: ${evImgs.length})`);

    const imgRect = await evImgs[0].getRect();
    results["direction image height"] = Math.round(imgRect.height);
    chk(Math.abs(imgRect.height - 114) <= 2, `证据缩略图高度为114px (实际: ${imgRect.height})`);

    // Screenshot 01: Direction Detail Desktop
    const scr01 = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "01_方向详情_统一宽高_紧凑证据.png"), Buffer.from(scr01, "base64"));
    console.log("Saved screenshot: 01_方向详情_统一宽高_紧凑证据.png");

    // Test Escape key closes dialog
    const body = await driver.findElement(By.css("body"));
    await body.sendKeys(Key.ESCAPE);
    await driver.sleep(800);
    const dialogsAfterEsc = await driver.findElements(By.css(".exp-direction-dialog"));
    const escClosed = dialogsAfterEsc.length === 0 || !(await dialogsAfterEsc[0].isDisplayed());
    results["direction Escape closes"] = escClosed;
    chk(escClosed, "Escape按键成功关闭方向详情弹窗");

    // =========================================================================
    // Part 2: Narrow Screen Dimensions & Overflow Check (900x700)
    // =========================================================================
    console.log("\n--- Testing Narrow Screen (900x700) ---");
    await setViewport(driver, 900, 700);
    await driver.sleep(1200);

    // Re-open direction detail dialog in narrow view
    const dirRowsNarrow = await driver.findElements(
      By.css('tr[data-action="direction"], .exp-direction-view-icon, .exp-view-detail-button, .exp-direction-card')
    );
    await driver.executeScript("arguments[0].click();", dirRowsNarrow[0]);
    await driver.sleep(1200);

    const narrowDialog = await driver.wait(until.elementLocated(By.css(".exp-direction-dialog")), 3000);
    const narrowRect = await narrowDialog.getRect();
    console.log("Narrow direction dialog rect:", narrowRect);
    results["direction narrow dialog dimensions"] = {
      w: Math.round(narrowRect.width),
      h: Math.round(narrowRect.height),
      vW: 900,
      vH: 700
    };
    chk(Math.abs(narrowRect.width - 855) <= 2, `窄屏端方向详情宽度为855px (实际: ${narrowRect.width})`);
    chk(Math.abs(narrowRect.height - 655) <= 2, `窄屏端方向详情高度为655px (实际: ${narrowRect.height})`);

    // Check no horizontal overflow
    const overflowCheck = await driver.executeScript(`
      return document.documentElement.scrollWidth <= 900;
    `);
    results["narrow no horizontal overflow"] = Boolean(overflowCheck);
    chk(overflowCheck, "窄屏视口无横向溢出滚动条");

    // Screenshot 03: Narrow screen direction detail
    const scr03 = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "03_窄屏_详情证据.png"), Buffer.from(scr03, "base64"));
    console.log("Saved screenshot: 03_窄屏_详情证据.png");

    await body.sendKeys(Key.ESCAPE);
    await driver.sleep(800);

    // Restore desktop window size
    await setViewport(driver, 1600, 1000);
    await driver.sleep(1000);

    // =========================================================================
    // Part 3: Knowledge Mining Setup Page & Confirmation (V56-03, V56-01)
    // =========================================================================
    console.log("\n--- Testing Knowledge Mining Setup ---");
    const kbNav = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(., "知识挖掘") or @aria-label="知识挖掘"]')),
      5000
    );
    await kbNav.click();
    await driver.sleep(2500);
    results["knowledge route"] = true;
    chk(true, "成功进入知识挖掘页面");

    // Open Knowledge Detail Dialog to test unified dimensions
    const kbRows = await driver.findElements(By.css(".knowledge-row, [data-detail-entry], button.knowledge-entry-view"));
    if (kbRows.length > 0) {
      await driver.executeScript("arguments[0].click();", kbRows[0]);
      await driver.sleep(1200);
      const kbDetailModal = await driver.wait(until.elementLocated(By.css(".detail-modal")), 3000);
      if (await kbDetailModal.isDisplayed()) {
        const kbDetailRect = await kbDetailModal.getRect();
        console.log("Knowledge detail modal rect:", kbDetailRect);
        chk(Math.abs(kbDetailRect.width - 1380) <= 2, `知识详情弹窗宽度统一为1380px (实际: ${kbDetailRect.width})`);
        chk(Math.abs(kbDetailRect.height - 820) <= 2, `知识详情弹窗高度统一为820px (实际: ${kbDetailRect.height})`);

        // Screenshot 04: Knowledge Detail Dialog
        const scr04 = await driver.takeScreenshot();
        fs.writeFileSync(path.join(ARTIFACT_DIR, "04_知识详情_统一宽高.png"), Buffer.from(scr04, "base64"));
        console.log("Saved screenshot: 04_知识详情_统一宽高.png");

        const closeKbDetail = await driver.findElement(By.id("close-detail"));
        await closeKbDetail.click();
        await driver.sleep(600);
      }
    }

    // Check create btn
    const createBtn = await driver.findElement(By.id("create-btn"));
    chk(await createBtn.isDisplayed(), "新建挖掘任务按钮展示正常");
    results["create btn"] = true;

    // Click create btn to open #kb-setup-page
    await createBtn.click();
    await driver.sleep(1500);

    const setupPage = await driver.wait(until.elementLocated(By.id("kb-setup-page")), 3000);
    chk(await setupPage.isDisplayed(), "#kb-setup-page 成功展开为独立子页面");
    results["knowledge setup opens"] = true;

    // Verify confirm header
    const confirmHeader = await driver.findElement(By.id("kb-confirm-title"));
    const headerText = (await confirmHeader.getText()).trim();
    results["confirm header"] = headerText;
    chk(headerText === "确认并启动", `确认区标题正确为'确认并启动' (实际: ${headerText})`);

    // Verify confirm summary
    const summaryEl = await driver.findElement(By.id("kb-run-summary"));
    const summaryText = (await summaryEl.getText()).trim();
    results["confirm summary"] = summaryText;
    console.log("Confirm summary text:\n", summaryText);
    const expectedSummary = "子数据集 1 个\n挖掘方向 2 项\n知识类型 良品\n范围 选中子数据集全部合格来源\n模型 当前工作台模型";
    chk(summaryText.replace(/\r/g, "") === expectedSummary, `摘要信息与V56契约完全一致`);

    // Verify confirm check
    const checkEl = await driver.findElement(By.id("kb-run-check"));
    const checkText = (await checkEl.getText()).trim();
    results["confirm check"] = checkText;
    chk(checkText === "已满足启动条件", `校验文案正确为'已满足启动条件' (实际: ${checkText})`);

    // Verify start enabled
    const submitBtn = await driver.findElement(By.id("submit-job"));
    const isStartEnabled = await submitBtn.isEnabled();
    results["start enabled"] = isStartEnabled;
    chk(isStartEnabled, "满足条件时启动按钮可用");

    // Verify legacy action bar removed
    const legacyFooters = await driver.findElements(By.css("#kb-setup-page .modalfooter, #kb-setup-page .modal-footer"));
    results["legacy action bar removed"] = legacyFooters.length === 0;
    chk(legacyFooters.length === 0, "旧版浮层底部操作条已被彻底移除");

    // Screenshot 02: Knowledge Setup with Confirmation Panel
    const scr02 = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "02_新建挖掘_底部确认并启动.png"), Buffer.from(scr02, "base64"));
    console.log("Saved screenshot: 02_新建挖掘_底部确认并启动.png");

    // Test prompt validation: clear prompt
    const promptArea = await driver.findElement(By.id("prompt-text"));
    await promptArea.sendKeys(Key.CONTROL, "a");
    await promptArea.sendKeys(Key.BACK_SPACE);
    await driver.sleep(600);

    const submitDisabledAfterClear = !(await submitBtn.isEnabled());
    results["prompt empty prevents submit"] = submitDisabledAfterClear;
    chk(submitDisabledAfterClear, "提示词清空后提交按钮被禁用");

    const guidanceText = (await checkEl.getText()).trim();
    results["prompt empty guidance"] = guidanceText;
    chk(guidanceText === "请填写完整提示词", `提示词为空时校验提示正确为'请填写完整提示词' (实际: ${guidanceText})`);

    // Test restore prompt button
    const composeBtn = await driver.findElement(By.id("compose-prompt"));
    await composeBtn.click();
    await driver.sleep(600);

    const confirmBtns = await driver.findElements(By.css(".confirm-overlay.show button.confirm-btn-primary, .confirm-modal.show button.confirm-btn-primary"));
    if (confirmBtns.length > 0) {
      await confirmBtns[0].click();
      await driver.sleep(600);
    }

    const submitEnabledAfterRestore = await submitBtn.isEnabled();
    results["restored prompt allows submit"] = submitEnabledAfterRestore;
    chk(submitEnabledAfterRestore, "恢复提示词后启动按钮重新启用");

    // Test direction tab switches
    const tabExplore = await driver.findElement(By.id("kb-tab-explore"));
    await tabExplore.click();
    await driver.sleep(500);
    const exploreTable = await driver.findElement(By.id("explored-directions"));
    results["explore tab switches"] = await exploreTable.isDisplayed();
    chk(results["explore tab switches"], "方向切换Tab成功切换到探索沉淀方向");

    const tabPreset = await driver.findElement(By.id("kb-tab-preset"));
    await tabPreset.click();
    await driver.sleep(500);
    const presetTable = await driver.findElement(By.id("general-directions"));
    results["preset tab switches"] = await presetTable.isDisplayed();
    chk(results["preset tab switches"], "方向切换Tab成功切换回通用预设方向");

    // Test submit job
    await submitBtn.click();
    await driver.sleep(2000);

    const setupPagesAfterSubmit = await driver.findElements(By.id("kb-setup-page"));
    const setupClosed = setupPagesAfterSubmit.length === 0 || !(await setupPagesAfterSubmit[0].isDisplayed());
    results["job demo created"] = setupClosed;
    chk(setupClosed, "点击启动后新建作业成功创建并自动返回挖掘列表");

    // =========================================================================
    // Part 4: Consistency Route (V56)
    // =========================================================================
    console.log("\n--- Testing Consistency Route ---");
    const csNav = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(., "数据一致性") or @aria-label="数据一致性"]')),
      5000
    );
    await csNav.click();
    await driver.sleep(2500);
    results["consistency route"] = true;
    chk(true, "成功进入数据一致性页面");

    console.log("\n========================================================");
    console.log("🎉 ALL V56 CHECKS PASSED!");
    console.log("========================================================");
  } catch (err) {
    console.error("Test failed with error:", err);
    results.errors.push(String(err));
    throw err;
  } finally {
    await driver.quit();

    // Write acceptance JSON report matching V56_浏览器验收.json
    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "v56_live_acceptance_result.json"),
      JSON.stringify(results, null, 2)
    );
    console.log("Acceptance result written to artifact dir.");
  }
}

run();
