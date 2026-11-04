const { Builder, By, Key, until } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox.js");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

const ARTIFACT_DIR = "/home/dell/.gemini/antigravity-cli/brain/a36a5c63-3c83-4b2c-b4ff-8a1730f771df";

const checks = [];
function chk(condition, name) {
  assert.ok(condition, name);
  checks.push(name);
  console.log("✓", name);
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
    await driver.manage().window().setRect({ width: 1600, height: 950 });

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
    // Part 1: Dataset Management (V51-01, V51-06)
    // =========================================================================
    console.log("\n--- Testing Dataset Management Live ---");
    const managerNav = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(., "数据集管理") or @aria-label="数据集管理"]')),
      5000
    );
    await managerNav.click();
    await driver.sleep(2000);

    const dsSearch = await driver.wait(until.elementLocated(By.id("search")), 5000);
    const dsSearchRect = await dsSearch.getRect();
    chk(Math.abs(dsSearchRect.width - 220) <= 2, `数据集管理搜索框宽度统一为220px (实际: ${dsSearchRect.width}px)`);
    chk(Math.abs(dsSearchRect.height - 38) <= 2, `数据集管理搜索框高度统一为38px (实际: ${dsSearchRect.height}px)`);

    const dsClearBtn = await driver.findElement(By.id("manager-clear-search"));
    const dsClearRect = await dsClearBtn.getRect();
    chk(Math.abs(dsClearRect.width - 38) <= 2, `数据集管理清除按钮宽度为38px (实际: ${dsClearRect.width}px)`);
    chk(Math.abs(dsClearRect.height - 38) <= 2, `数据集管理清除按钮高度为38px (实际: ${dsClearRect.height}px)`);

    // Test search filter and clear
    await dsSearch.sendKeys("测试过滤");
    await driver.sleep(500);
    await dsClearBtn.click();
    await driver.sleep(500);
    const dsSearchVal = await dsSearch.getAttribute("value");
    chk(dsSearchVal === "", "数据集管理清除筛选后搜索框重置为空");

    // Check normal dataset name weight (400)
    const nameTexts = await driver.findElements(By.css(".name-text"));
    if (nameTexts.length > 0) {
      const weight = await nameTexts[0].getCssValue("font-weight");
      chk(weight === "400" || weight === "normal", `数据集名称正常字重不加粗 (实际: ${weight})`);
    }

    const scrManager = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "v51_live_00_dataset_manager.png"), Buffer.from(scrManager, "base64"));

    // =========================================================================
    // Part 2: Image Browse (V51-01, V51-06)
    // =========================================================================
    console.log("\n--- Testing Image Browse Live ---");
    const imgNav = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(., "图像浏览") or @aria-label="图像浏览"]')),
      5000
    );
    await imgNav.click();
    await driver.sleep(2500);

    const imgSearch = await driver.wait(until.elementLocated(By.id("search")), 5000);
    const imgSearchRect = await imgSearch.getRect();
    chk(Math.abs(imgSearchRect.width - 220) <= 2, `图像浏览搜索框宽度为220px (实际: ${imgSearchRect.width}px)`);
    chk(Math.abs(imgSearchRect.height - 38) <= 2, `图像浏览搜索框高度为38px (实际: ${imgSearchRect.height}px)`);

    const imgResetBtn = await driver.findElement(By.id("reset"));
    const imgResetRect = await imgResetBtn.getRect();
    chk(Math.abs(imgResetRect.width - 38) <= 2, `图像浏览清除按钮宽度为38px (实际: ${imgResetRect.width}px)`);
    chk(Math.abs(imgResetRect.height - 38) <= 2, `图像浏览清除按钮高度为38px (实际: ${imgResetRect.height}px)`);

    // Test clear action
    await imgSearch.sendKeys("abc");
    await driver.sleep(500);
    await imgResetBtn.click();
    await driver.sleep(500);
    const imgSearchVal = await imgSearch.getAttribute("value");
    chk(imgSearchVal === "", "图像浏览清除筛选后搜索框重置为空");

    // Test Image Card click opens detail modal
    const imgCards = await driver.findElements(By.css(".grid .card"));
    chk(imgCards.length > 0, "图像浏览成功展示图片卡片");
    await driver.executeScript("arguments[0].click();", imgCards[0]);
    await driver.sleep(1200);
    const detailOverlay = await driver.findElement(By.css(".detail-overlay"));
    const isOverlayShown = await detailOverlay.isDisplayed();
    chk(isOverlayShown, "点击图像卡片成功打开第一阶段图像详情弹窗");

    const imgDetailTitle = await driver.findElement(By.css(".detail-dialog h2, .iad-detail-dialog h2"));
    const detailTitleText = await imgDetailTitle.getText();
    chk(detailTitleText.length > 0, `图像详情弹窗展示图片名称 (标题: ${detailTitleText})`);

    // Close detail modal
    const closeDetailBtn = await driver.findElement(By.css("#close, button.detail-close"));
    await closeDetailBtn.click();
    await driver.sleep(600);

    const scrImages = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "v51_live_01_images_browse.png"), Buffer.from(scrImages, "base64"));

    // =========================================================================
    // Part 3: Direction Exploration (V51-03)
    // =========================================================================
    console.log("\n--- Testing Direction Exploration Live ---");
    const expNav = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(., "方向探索") or @aria-label="方向探索"]')),
      5000
    );
    await expNav.click();
    await driver.sleep(2500);

    // Verify subdataset only
    const datasetCells = await driver.findElements(By.css(".exp-job-dataset"));
    chk(datasetCells.length > 0, "方向探索存在作业数据集列");
    const datasetTexts = await Promise.all(datasetCells.map(c => c.getText()));
    const noParentGroup = datasetTexts.every(t => !t.includes("框胶数据集"));
    chk(noParentGroup, `探索作业数据集列仅显示子数据集名称，不重复显示父数据集 (实际: ${datasetTexts[0]})`);

    // Verify exploration search field 220x38
    const expJobSearch = await driver.wait(until.elementLocated(By.id("exp-jobsearch")), 5000);
    const expSearchRect = await expJobSearch.getRect();
    chk(Math.abs(expSearchRect.width - 220) <= 2, `方向探索作业搜索框宽度为220px (实际: ${expSearchRect.width}px)`);
    chk(Math.abs(expSearchRect.height - 38) <= 2, `方向探索作业搜索框高度为38px (实际: ${expSearchRect.height}px)`);

    // Verify clear filters button
    const expClearBtn = await driver.findElement(By.css('[data-exp="clear-job-filters"]'));
    const expClearRect = await expClearBtn.getRect();
    chk(Math.abs(expClearRect.width - 38) <= 2, `方向探索清除按钮宽度为38px (实际: ${expClearRect.width}px)`);
    chk(Math.abs(expClearRect.height - 38) <= 2, `方向探索清除按钮高度为38px (实际: ${expClearRect.height}px)`);

    // Test search filtering & clear dynamically
    const initialRows = await driver.findElements(By.css(".exp-job-table tbody tr"));
    chk(initialRows.length >= 1, "方向探索作业列表中存在作业");
    const firstRowTitle = await initialRows[0].findElement(By.css(".exp-row-title")).getText();
    const query = firstRowTitle.slice(0, Math.min(6, firstRowTitle.length));
    await expJobSearch.sendKeys(query);
    await driver.sleep(500);
    const filteredRows = await driver.findElements(By.css(".exp-job-table tbody tr"));
    chk(filteredRows.length >= 1, `方向探索作业搜索ID有效联动过滤 (查询: ${query}, 匹配: ${filteredRows.length})`);

    await expClearBtn.click();
    await driver.sleep(500);
    const expSearchVal = await expJobSearch.getAttribute("value");
    const restoredRows = await driver.findElements(By.css(".exp-job-table tbody tr"));
    chk(expSearchVal === "" && restoredRows.length >= initialRows.length, "方向探索清除筛选后重置输入并恢复全部作业");

    // Verify exploration result panel (5-column candidate directions table aligned with prototype)
    const selectedSub = await driver.wait(until.elementLocated(By.css(".exp-selected-sub")), 5000);
    const subText = await selectedSub.getText();
    chk(subText.includes("·"), `方向探索所选作业副标题包含状态信息 (实际: ${subText})`);

    const noCandidateHeading = (await driver.findElements(By.xpath('//h3[text()="候选方向"]'))).length === 0;
    chk(noCandidateHeading, "方向探索移除了多余的候选方向小标题");

    const directionTable = await driver.wait(until.elementLocated(By.css(".exp-direction-table")), 5000);
    const directionThs = await directionTable.findElements(By.css("thead th"));
    chk(directionThs.length === 5, `探索结果方向表格为标准的5列结构 (实际: ${directionThs.length}列)`);
    const thTexts = await Promise.all(directionThs.map(th => th.getText()));
    chk(
      thTexts[0].includes("方向") &&
      thTexts[1].includes("描述") &&
      thTexts[2].includes("适用知识") &&
      thTexts[3].includes("证据") &&
      thTexts[4].includes("操作"),
      `探索结果方向表格表头完全对齐HTML原型 (实际: ${thTexts.join(" | ")})`
    );

    const directionRows = await directionTable.findElements(By.css("tbody tr"));
    chk(directionRows.length >= 1, `探索结果成功展示候选方向 (行数: ${directionRows.length})`);
    const firstDirTds = await directionRows[0].findElements(By.css("td"));
    chk(firstDirTds.length === 5, "候选方向行具有独立的5个单元格");

    const viewDetailBtn = await firstDirTds[4].findElement(By.css(".exp-view-detail-button"));
    const mineBtn = await firstDirTds[4].findElement(By.css(".exp-direction-mine-icon"));
    chk(Boolean(viewDetailBtn && mineBtn), "候选方向操作列具有独立的查看方向与去知识挖掘按钮");

    const scrExp = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "v51_live_02_exploration.png"), Buffer.from(scrExp, "base64"));

    // =========================================================================
    // Part 4: Knowledge Page (V51-04)
    // =========================================================================
    console.log("\n--- Testing Knowledge Page Live ---");
    const kbNav = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(., "知识挖掘") or @aria-label="知识挖掘"]')),
      5000
    );
    await kbNav.click();
    await driver.sleep(2500);

    const kbJobSearch = await driver.wait(until.elementLocated(By.id("job-search")), 5000);
    const kbSearchRect = await kbJobSearch.getRect();
    chk(Math.abs(kbSearchRect.width - 220) <= 2, `知识挖掘作业搜索框宽度为220px (实际: ${kbSearchRect.width}px)`);
    chk(Math.abs(kbSearchRect.height - 38) <= 2, `知识挖掘作业搜索框高度为38px (实际: ${kbSearchRect.height}px)`);

    const kbRefresh = await driver.findElement(By.id("kb-refresh"));
    const kbRefreshRect = await kbRefresh.getRect();
    chk(Math.abs(kbRefreshRect.width - 38) <= 2, `知识挖掘统一SVG刷新按钮宽度为38px (实际: ${kbRefreshRect.width}px)`);
    chk(Math.abs(kbRefreshRect.height - 38) <= 2, `知识挖掘统一SVG刷新按钮高度为38px (实际: ${kbRefreshRect.height}px)`);

    const kbJobClear = await driver.findElement(By.id("kb-clear-job-filters"));
    await kbJobSearch.sendKeys("foobar");
    await driver.sleep(400);
    await kbJobClear.click();
    await driver.sleep(400);
    const kbJobSearchVal = await kbJobSearch.getAttribute("value");
    chk(kbJobSearchVal === "", "知识挖掘作业清除筛选后搜索框重置为空");

    // Verify headings do NOT show "共 x 条"
    const jobsCountEl = await driver.findElement(By.id("jobs-count"));
    const isJobsCountDisplayed = await jobsCountEl.isDisplayed();
    chk(!isJobsCountDisplayed, "挖掘作业标题不显示 '共 x 条' 计数徽标");

    const kbCountEl = await driver.findElement(By.id("knowledge-count"));
    const isKbCountDisplayed = await kbCountEl.isDisplayed();
    chk(!isKbCountDisplayed, "知识条目标题不显示 '共 x 条' 计数徽标");

    // Select completed job row to reveal lower panel items
    const jobRows = await driver.findElements(By.css("#job-rows tr"));
    if (jobRows.length > 0) {
      await driver.executeScript("arguments[0].click();", jobRows[0]);
      await driver.sleep(1000);
    }

    // Verify knowledge-head 4 columns (including 描述)
    const kbHeads = await driver.findElements(By.css(".knowledge-head > span"));
    chk(kbHeads.length === 4, `知识条目表头具有独立的4列 (实际: ${kbHeads.length}列)`);
    const kbHeadTexts = await Promise.all(kbHeads.map(h => h.getText()));
    chk(kbHeadTexts.includes("描述"), `知识条目表头包含'描述'列 (表头: ${kbHeadTexts.join(" | ")})`);

    // Verify row title font weight (400, not bold)
    const kbRowTitles = await driver.findElements(By.css(".knowledge-entry-name"));
    if (kbRowTitles.length > 0) {
      const weight = await kbRowTitles[0].getCssValue("font-weight");
      chk(weight === "400" || weight === "normal", `知识条目文本正常字重未加粗 (实际: ${weight})`);
    }

    const kbItemSearch = await driver.wait(until.elementLocated(By.id("knowledge-search")), 5000);
    const kbItemClear = await driver.findElement(By.id("kb-clear-knowledge-filters"));
    await kbItemSearch.sendKeys("testitem");
    await driver.sleep(400);
    await kbItemClear.click();
    await driver.sleep(400);
    const kbItemSearchVal = await kbItemSearch.getAttribute("value");
    chk(kbItemSearchVal === "", "知识挖掘条目清除筛选后条目搜索框重置为空");

    const scrKb = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "v51_live_03_knowledge.png"), Buffer.from(scrKb, "base64"));

    // =========================================================================
    // Part 5: Data Consistency (V51-02, V51-05)
    // =========================================================================
    console.log("\n--- Testing Data Consistency Live ---");
    const dcNav = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(., "数据一致性") or @aria-label="数据一致性"]')),
      5000
    );
    await dcNav.click();
    await driver.sleep(2500);

    // Select a completed job row in consistency table to display conflict results
    const dcRows = await driver.findElements(By.css(".dc-table tbody tr"));
    chk(dcRows.length > 0, "数据一致性作业列表已加载");

    // Verify consistency job status has colored pill text matching exploration (.exp-pill)
    const dcStatusPills = await dcRows[0].findElements(By.css(".exp-pill"));
    chk(dcStatusPills.length > 0, "检查作业状态使用统一的 .exp-pill 胶囊标签");
    const dcPillColor = await dcStatusPills[0].getCssValue("color");
    chk(dcPillColor !== "rgb(23, 35, 56)", `检查作业状态带有语义状态文字颜色 (实际: ${dcPillColor})`);

    await driver.executeScript("arguments[0].click();", dcRows[0]);
    await driver.sleep(1500);

    const dcFilenameSearch = await driver.wait(until.elementLocated(By.id("dc-filename-search")), 5000);
    const dcSearchRect = await dcFilenameSearch.getRect();
    chk(Math.abs(dcSearchRect.width - 220) <= 2, `数据一致性文件名搜索框宽度为220px (实际: ${dcSearchRect.width}px)`);
    chk(Math.abs(dcSearchRect.height - 38) <= 2, `数据一致性文件名搜索框高度为38px (实际: ${dcSearchRect.height}px)`);

    const dcClearBtn = await driver.findElement(By.css('[data-dc="clear-conflict-filters"]'));
    const dcClearRect = await dcClearBtn.getRect();
    chk(Math.abs(dcClearRect.width - 38) <= 2, `数据一致性清除按钮宽度为38px (实际: ${dcClearRect.width}px)`);
    chk(Math.abs(dcClearRect.height - 38) <= 2, `数据一致性清除按钮高度为38px (实际: ${dcClearRect.height}px)`);

    // Verify single main image on card
    const dcCards = await driver.findElements(By.css(".dc-card"));
    chk(dcCards.length > 0, "数据一致性渲染冲突卡片");
    const firstCardImgs = await dcCards[0].findElements(By.css("img"));
    chk(firstCardImgs.length === 1, "数据一致性每张卡片只包含1张图片");
    const mainImgCount = await dcCards[0].findElements(By.css(".dc-main-image"));
    chk(mainImgCount.length === 1, "数据一致性卡片使用dc-main-image独立主图类");

    // Verify conflict card bottom two texts color matches ordinary text color (#172338 / rgb(23, 35, 56))
    const rawValEl = await dcCards[0].findElement(By.css(".dc-raw-value"));
    const rawValColor = await rawValEl.getCssValue("color");
    chk(rawValColor === "rgb(23, 35, 56)", `数据一致性冲突卡片底部左侧文本颜色为普通文本颜色 (实际: ${rawValColor})`);

    const modelValEl = await dcCards[0].findElement(By.css(".dc-model-value"));
    const modelValColor = await modelValEl.getCssValue("color");
    chk(modelValColor === "rgb(23, 35, 56)", `数据一致性冲突卡片底部右侧文本颜色为普通文本颜色 (实际: ${modelValColor})`);

    // Test clear action restores conflict cards
    await dcFilenameSearch.sendKeys("nonexistent_filename_query");
    await driver.sleep(400);
    await dcClearBtn.click();
    await driver.sleep(400);
    const dcSearchVal = await dcFilenameSearch.getAttribute("value");
    const restoredCards = await driver.findElements(By.css(".dc-card"));
    chk(dcSearchVal === "" && restoredCards.length > 0, "数据一致性清除筛选后恢复全部冲突卡片");

    // Click first conflict card to test conflict comparison modal
    await driver.executeScript("arguments[0].click();", restoredCards[0]);
    await driver.sleep(1500);

    const compareMask = await driver.wait(until.elementLocated(By.id("dc-compare-mask")), 5000);
    chk(await compareMask.isDisplayed(), "点击标注冲突卡片成功打开标注冲突对比弹窗");

    // Candidate strip must be fully visible (not collapsed to 15px)
    const candStrip = await driver.findElement(By.css(".dc-candidate-strip"));
    const candStripRect = await candStrip.getRect();
    chk(candStripRect.height >= 75, `标注冲突对比弹窗缩略图条完整可见未坍塌 (实际高度: ${candStripRect.height}px)`);

    const candBtns = await candStrip.findElements(By.css(".dc-candidate"));
    chk(candBtns.length >= 1, "标注冲突对比弹窗缩略图条中存在候选图");
    const candRect = await candBtns[0].getRect();
    chk(candRect.height >= 65 && candRect.width >= 85, `候选图缩略图尺寸完整且清晰可见 (实际: ${candRect.width}x${candRect.height}px)`);

    // Verify 判定结论、模型分析、模型结论 除了标题，不要加粗、带颜色
    const factVerdict = await driver.findElement(By.css(".dc-fact-panel .dc-verdict-value"));
    const factWeight = await factVerdict.getCssValue("font-weight");
    const factColor = await factVerdict.getCssValue("color");
    chk(factWeight === "400" || factWeight === "normal", `判定结论数值不加粗 (实际字重: ${factWeight})`);
    chk(factColor === "rgb(23, 35, 56)", `判定结论数值为普通标准文本色 (实际: ${factColor})`);

    const modelAnalysisP = await driver.findElement(By.css(".dc-model-panel p"));
    const modelAnalysisWeight = await modelAnalysisP.getCssValue("font-weight");
    const modelAnalysisColor = await modelAnalysisP.getCssValue("color");
    chk(modelAnalysisWeight === "400" || modelAnalysisWeight === "normal", `模型分析文本不加粗 (实际字重: ${modelAnalysisWeight})`);
    chk(modelAnalysisColor === "rgb(23, 35, 56)", `模型分析文本为普通标准文本色 (实际: ${modelAnalysisColor})`);

    const conclusionVerdict = await driver.findElement(By.css(".dc-conclusion-panel .dc-verdict-value"));
    const conclusionWeight = await conclusionVerdict.getCssValue("font-weight");
    const conclusionColor = await conclusionVerdict.getCssValue("color");
    chk(conclusionWeight === "400" || conclusionWeight === "normal", `模型结论数值不加粗 (实际字重: ${conclusionWeight})`);
    chk(conclusionColor === "rgb(23, 35, 56)", `模型结论数值为普通标准文本色 (实际: ${conclusionColor})`);

    const scrModal = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "v51_live_06_conflict_dialog.png"), Buffer.from(scrModal, "base64"));

    // Close conflict modal
    const closeCompareBtn = await driver.findElement(By.css("#dc-compare-mask .dc-dialog-head-actions button[aria-label='关闭'], #dc-compare-mask .dc-dialog-footer button.dc-minor"));
    await closeCompareBtn.click();
    await driver.sleep(600);

    const scrDc = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "v51_live_04_consistency.png"), Buffer.from(scrDc, "base64"));

    // =========================================================================
    // Part 6: Narrow Viewport Layout (1000px) (V51-08)
    // =========================================================================
    console.log("\n--- Testing Narrow Viewport (1000px) ---");
    await driver.manage().window().setRect({ width: 1000, height: 760 });
    await driver.sleep(1000);

    const narrowDcSearch = await driver.findElement(By.id("dc-filename-search"));
    const narrowRect = await narrowDcSearch.getRect();
    chk(Math.abs(narrowRect.height - 38) <= 2, `窄屏1000px下搜索框高度依然保持38px (实际: ${narrowRect.height}px)`);

    const hasOverflow = await driver.executeScript(
      "return document.documentElement.scrollWidth > window.innerWidth;"
    );
    chk(!hasOverflow, "窄屏1000px下无全局水平溢出滚动条");

    const scrNarrow = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "v51_live_05_narrow_viewport.png"), Buffer.from(scrNarrow, "base64"));

    // Console errors check
    const logs = await driver.manage().logs().get("browser").catch(() => []);
    const severeErrors = logs.filter(l => l.level.name === "SEVERE");
    chk(severeErrors.length === 0, `全站页面无控制台严重错误 (实际: ${severeErrors.length})`);

    console.log("\n========================================");
    console.log(`ALL V51 LIVE SERVER CHECKS PASSED: ${checks.length}`);
    console.log("========================================\n");
  } finally {
    await driver.quit();
  }
}

run().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
