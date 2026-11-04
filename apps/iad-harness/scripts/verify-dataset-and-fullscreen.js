import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Builder, By, until } from "selenium-webdriver";
import firefox from "selenium-webdriver/firefox.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = "/home/dell/.gemini/antigravity-cli/brain/a36a5c63-3c83-4b2c-b4ff-8a1730f771df";

async function main() {
  const options = new firefox.Options().addArguments("-headless");
  const firefoxPath = process.env.FIREFOX_PATH || "/tmp/iad-firefox128/firefox/firefox";
  options.setBinary(firefoxPath);
  const geckodriverPath = process.env.GECKODRIVER_PATH || "/tmp/geckodriver";

  const driver = await new Builder()
    .forBrowser("firefox")
    .setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder(geckodriverPath))
    .build();

  try {
    await driver.manage().window().setRect({ width: 1920, height: 1080 });

    console.log("=== 1. 验证【数据集管理】添加数据集弹窗样式对齐 HTML 原型 ===");
    const workspace = path.resolve(__dirname, "../../..");
    const log = await fs.readFile(path.join(workspace, "runs/dsh_web.log"), "utf8");
    const appUrl = new URL(log.match(/https?:\/\/[^\s)]+/)[0]);
    appUrl.hostname = "127.0.0.1";
    console.log("Connecting to:", appUrl.href);
    await driver.get(appUrl.href);
    await driver.wait(until.elementLocated(By.css("button[aria-label^='数据集管理']")), 20000);
    const configure = await driver.wait(until.elementLocated(By.xpath("//button[.='Configure later']")), 3000).catch(() => null);
    if (configure) await configure.click();
    const notice = await driver.wait(until.elementLocated(By.xpath("//button[.='Continue']")), 2000).catch(() => null);
    if (notice) await notice.click();

    const sidebar = async label => {
      await driver.findElement(By.css(`button[aria-label^='${label}']`)).click();
      await driver.wait(async () => (await driver.findElement(By.css(".iad-workbench h1")).getText()) === label, 10000);
      await driver.sleep(600);
    };

    await sidebar("数据集管理");
    await driver.wait(until.elementLocated(By.xpath("//button[contains(., '添加数据集')]")), 15000);

    // Click "添加数据集"
    const addBtn = await driver.findElement(By.xpath("//button[contains(., '添加数据集')]"));
    await addBtn.click();

    // Wait for Add Dataset Modal to appear
    await driver.wait(until.elementLocated(By.css(".modal.add-dataset-modal")), 8000);
    await driver.sleep(500);

    // Verify modal styles
    const modalMetrics = await driver.executeScript(() => {
      const modal = document.querySelector(".modal.add-dataset-modal");
      const modalTop = modal.querySelector(".modal-top");
      const title = modalTop.querySelector("h2");
      const closeBtn = modalTop.querySelector(".modal-x");
      const radioRow = modal.querySelector(".radio-row");
      const activeRadioLabel = radioRow.querySelector("label:has(input:checked)");
      const actions = modal.querySelector(".modal-actions");
      const cancelBtn = actions.querySelector("button.secondary");
      const submitBtn = actions.querySelector("button.primary");

      const csModal = window.getComputedStyle(modal);
      const csTop = window.getComputedStyle(modalTop);
      const csTitle = window.getComputedStyle(title);
      const csClose = window.getComputedStyle(closeBtn);
      const csActiveLabel = window.getComputedStyle(activeRadioLabel);
      const csActions = window.getComputedStyle(actions);
      const csCancel = window.getComputedStyle(cancelBtn);
      const csSubmit = window.getComputedStyle(submitBtn);

      const modalRect = modal.getBoundingClientRect();

      return {
        width: Math.round(modalRect.width),
        padding: csModal.padding,
        borderRadius: csModal.borderRadius,
        boxShadow: csModal.boxShadow,
        topPaddingBottom: csTop.paddingBottom,
        topBorderBottom: csTop.borderBottom,
        topHeight: Math.round(parseFloat(csTop.height)),
        titleText: title.textContent?.trim(),
        titleFontSize: csTitle.fontSize,
        titleFontWeight: csTitle.fontWeight,
        titleColor: csTitle.color,
        closeFontSize: csClose.fontSize,
        activeRadioBg: csActiveLabel.backgroundColor,
        activeRadioBorder: csActiveLabel.borderColor,
        actionsMarginTop: csActions.marginTop,
        actionsBorderTop: csActions.borderTop,
        actionsBackground: csActions.backgroundColor,
        cancelHeight: Math.round(parseFloat(csCancel.height)),
        submitHeight: Math.round(parseFloat(csSubmit.height)),
      };
    });

    console.log("Modal Metrics (Group Mode):", JSON.stringify(modalMetrics, null, 2));

    assert.ok(
      Math.abs(modalMetrics.width - 720) <= 5,
      `弹窗宽度应约为 720px，实际: ${modalMetrics.width}px`
    );
    assert.ok(modalMetrics.padding.includes("24px") || modalMetrics.padding.includes("25px"), `弹窗内边距应包含 24px/25px，实际: ${modalMetrics.padding}`);
    assert.equal(modalMetrics.titleText, "添加数据集");
    assert.equal(modalMetrics.titleFontSize, "18px");
    assert.equal(modalMetrics.titleFontWeight, "700");
    assert.equal(modalMetrics.closeFontSize, "24px");
    assert.ok(modalMetrics.topHeight < 50, `modal-top 高度应自适应 (<50px)，实际: ${modalMetrics.topHeight}px`);
    assert.ok(modalMetrics.submitHeight >= 34 && modalMetrics.submitHeight <= 42, `按钮高度应为 36px 左右，实际: ${modalMetrics.submitHeight}px`);

    const screenshot1 = await driver.takeScreenshot();
    await fs.writeFile(path.join(outputDir, "add_dataset_modal_group.png"), screenshot1, "base64");
    console.log("已保存截图: add_dataset_modal_group.png");

    // Click "子数据集" radio
    const childRadioLabel = await driver.findElement(By.xpath("//label[contains(., '子数据集')]"));
    await childRadioLabel.click();
    await driver.sleep(300);

    const childModalMetrics = await driver.executeScript(() => {
      const modal = document.querySelector(".modal.add-dataset-modal");
      const parentSelect = modal.querySelector("#new-parent");
      const nameInput = modal.querySelector("#new-name");
      const pathInput = modal.querySelector("#new-path");
      const labelPathInput = modal.querySelector("#new-label-path");
      const hint = modal.querySelector(".modal-hint");

      return {
        hasParentSelect: !!parentSelect,
        hasNameInput: !!nameInput,
        hasPathInput: !!pathInput,
        hasLabelPathInput: !!labelPathInput,
        hintText: hint?.textContent?.trim(),
        nameInputHeight: nameInput ? Math.round(parseFloat(window.getComputedStyle(nameInput).height)) : 0,
      };
    });

    console.log("Child Mode Metrics:", JSON.stringify(childModalMetrics, null, 2));
    assert.ok(childModalMetrics.hasParentSelect, "应展示所属数据集下拉框");
    assert.ok(childModalMetrics.hasNameInput, "应展示子数据集名称输入框");
    assert.ok(childModalMetrics.hasPathInput, "应展示图像目录输入框");
    assert.ok(childModalMetrics.hasLabelPathInput, "应展示标注目录输入框");
    assert.equal(childModalMetrics.nameInputHeight, 40, "输入框高度应为 40px");

    const screenshot2 = await driver.takeScreenshot();
    await fs.writeFile(path.join(outputDir, "add_dataset_modal_child.png"), screenshot2, "base64");
    console.log("已保存截图: add_dataset_modal_child.png");

    // Close modal
    const closeBtn = await driver.findElement(By.css(".modal.add-dataset-modal .modal-x"));
    await closeBtn.click();
    await driver.sleep(500);

    console.log("\n=== 2. 验证【图像浏览】大图查看的适应窗口缩放及下拉选择 ===");
    await sidebar("图像浏览");
    await driver.wait(until.elementLocated(By.css(".grid .card, .iad-thumb-card, .iad-grid img, [data-testid='image-card']")), 15000);
    await driver.sleep(1000);

    // Click the first card
    const firstCard = await driver.findElement(By.css(".grid .card, .iad-thumb-card, .iad-grid img, [data-testid='image-card']"));
    await firstCard.click();

    // Wait for detail dialog
    await driver.wait(until.elementLocated(By.css(".detail-dialog, .iad-detail-dialog, #detailSection, .detail-modal")), 8000);
    await driver.sleep(500);

    // Click preview to open FullscreenViewer
    const preview = await driver.findElement(By.css("#detail-preview, .detail-preview, button[title='放大图像'], .preview-wrap img, .detail-image-box img"));
    await preview.click();

    // Wait for FullscreenViewer to appear
    await driver.wait(until.elementLocated(By.css("#full-overlay:not(.hidden)")), 8000);
    await driver.wait(until.elementLocated(By.css("#stage #image-world img")), 8000);
    await driver.sleep(600);

    // Check zoom dropdown and scale in "fit" mode
    const viewerMetrics = await driver.executeScript(() => {
      const zoomSelect = document.getElementById("zoom");
      const stage = document.getElementById("stage");
      const world = document.getElementById("image-world");
      const img = document.getElementById("big-image");

      const selectValue = zoomSelect.value;
      const selectedOptionText = zoomSelect.options[zoomSelect.selectedIndex]?.textContent?.trim();

      const stageRect = stage.getBoundingClientRect();
      const worldRect = world.getBoundingClientRect();
      const transform = window.getComputedStyle(world).transform;

      // Parse scale from transform matrix(a, b, c, d, tx, ty)
      let scale = 1;
      const match = transform.match(/matrix\(([^)]+)\)/);
      if (match) {
        const parts = match[1].split(",").map(Number);
        scale = parts[0];
      }

      return {
        selectValue,
        selectedOptionText,
        stageWidth: Math.round(stageRect.width),
        stageHeight: Math.round(stageRect.height),
        worldWidth: Math.round(worldRect.width),
        worldHeight: Math.round(worldRect.height),
        imgNaturalWidth: img.naturalWidth,
        imgNaturalHeight: img.naturalHeight,
        transform,
        scale: parseFloat(scale.toFixed(4)),
      };
    });

    console.log("Fullscreen Viewer Metrics (Initial Fit Mode):", JSON.stringify(viewerMetrics, null, 2));

    assert.equal(viewerMetrics.selectValue, "fit", "大图打开后缩放下拉框 value 应为 'fit'");
    assert.equal(viewerMetrics.selectedOptionText, "适应窗口", "大图打开后缩放下拉框选中文本应为 '适应窗口'");
    assert.ok(
      viewerMetrics.worldWidth <= viewerMetrics.stageWidth + 2 &&
      viewerMetrics.worldHeight <= viewerMetrics.stageHeight + 2,
      `图像应适应窗口！world尺寸: ${viewerMetrics.worldWidth}x${viewerMetrics.worldHeight}, stage尺寸: ${viewerMetrics.stageWidth}x${viewerMetrics.stageHeight}`
    );

    const screenshot3 = await driver.takeScreenshot();
    await fs.writeFile(path.join(outputDir, "fullscreen_viewer_fit.png"), screenshot3, "base64");
    console.log("已保存截图: fullscreen_viewer_fit.png");

    // Switch to 100% zoom
    console.log("\n切换至 100% 缩放...");
    const zoomSelectElem = await driver.findElement(By.id("zoom"));
    await zoomSelectElem.sendKeys("100%");
    await driver.sleep(400);

    const zoom100Metrics = await driver.executeScript(() => {
      const zoomSelect = document.getElementById("zoom");
      const world = document.getElementById("image-world");
      const transform = window.getComputedStyle(world).transform;
      let scale = 1;
      const match = transform.match(/matrix\(([^)]+)\)/);
      if (match) {
        scale = parseFloat(match[1].split(",")[0]);
      }
      return {
        selectValue: zoomSelect.value,
        scale: parseFloat(scale.toFixed(4)),
      };
    });

    console.log("Zoom 100% Metrics:", JSON.stringify(zoom100Metrics, null, 2));
    assert.equal(zoom100Metrics.selectValue, "1", "选择 100% 后 value 应为 '1'");
    assert.equal(zoom100Metrics.scale, 1, "选择 100% 后 transform scale 应为 1.0");

    const screenshot4 = await driver.takeScreenshot();
    await fs.writeFile(path.join(outputDir, "fullscreen_viewer_100.png"), screenshot4, "base64");
    console.log("已保存截图: fullscreen_viewer_100.png");

    // Click "适应窗口" button (#fit)
    console.log("\n点击 #fit 按钮恢复适应窗口...");
    const fitBtn = await driver.findElement(By.id("fit"));
    await fitBtn.click();
    await driver.sleep(400);

    const fitAgainMetrics = await driver.executeScript(() => {
      const zoomSelect = document.getElementById("zoom");
      const world = document.getElementById("image-world");
      const transform = window.getComputedStyle(world).transform;
      let scale = 1;
      const match = transform.match(/matrix\(([^)]+)\)/);
      if (match) {
        scale = parseFloat(match[1].split(",")[0]);
      }
      return {
        selectValue: zoomSelect.value,
        selectedOptionText: zoomSelect.options[zoomSelect.selectedIndex]?.textContent?.trim(),
        scale: parseFloat(scale.toFixed(4)),
      };
    });

    console.log("Fit Again Metrics:", JSON.stringify(fitAgainMetrics, null, 2));
    assert.equal(fitAgainMetrics.selectValue, "fit", "点击 #fit 按钮后 value 应为 'fit'");
    assert.equal(fitAgainMetrics.selectedOptionText, "适应窗口", "点击 #fit 按钮后选中文本应为 '适应窗口'");
    assert.equal(fitAgainMetrics.scale, viewerMetrics.scale, "点击 #fit 按钮后 scale 应恢复为自适应缩放比例");

    const screenshot5 = await driver.takeScreenshot();
    await fs.writeFile(path.join(outputDir, "fullscreen_viewer_fit_again.png"), screenshot5, "base64");
    console.log("已保存截图: fullscreen_viewer_fit_again.png");

    console.log("\n 全部断言通过！两项需求均已高质量对齐并验证通过。");
  } finally {
    await driver.quit();
  }
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
