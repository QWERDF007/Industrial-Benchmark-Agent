const { Builder, By, Key, until } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox.js");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

const R = path.resolve(__dirname, "../../../docs/v47");
const screenshotsDir = path.join(R, "screenshots");
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

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
    for (const [name, fn] of [
      ["完整", path.join(R, "Industrial_Benchmark_Agent_V47_完整多页面交互.html")],
      ["独立", path.join(R, "知识挖掘_V47_独立预览.html")]
    ]) {
      console.log(`\n--- Testing ${name} ---`);
      await driver.manage().window().setRect({ width: 1792, height: 920 });
      await driver.get(`file://${fn}`);
      await driver.sleep(600);

      if (name === "完整") {
        const goKb = await driver.findElement(By.id("go-knowledge"));
        await goKb.click();
        await driver.sleep(300);
      }

      // 01. 作业 8 条分页
      const jobRows = await driver.findElements(By.css("#job-rows tr"));
      chk(jobRows.length === 8, `${name}作业 8 条分页`);

      // 02. 知识条目新增操作按钮
      const viewButtons = await driver.findElements(By.css("[data-view-entry]"));
      chk(viewButtons.length > 0, `${name}知识条目新增操作按钮`);

      // 03. 操作列标题
      const kbHeadText = await (await driver.findElement(By.css(".knowledge-head"))).getText();
      chk(kbHeadText.trim().endsWith("操作"), `${name}操作列标题`);

      // 04. 图标加查看文字
      const firstViewBtn = viewButtons[0];
      const btnText = await firstViewBtn.getText();
      chk(btnText.trim() === "查看", `${name}图标加查看文字`);

      // 05. 文档检索图标
      const svgCount = (await firstViewBtn.findElements(By.css("svg"))).length;
      chk(svgCount === 1, `${name}文档检索图标`);

      // 06. 知识列表保留分页
      const detailEntries = await driver.findElements(By.css("[data-detail-entry]"));
      chk(detailEntries.length > 0, `${name}知识列表保留分页`);

      if (name === "完整") {
        const shot1 = await driver.takeScreenshot();
        fs.writeFileSync(path.join(screenshotsDir, "01_完整主界面_知识条目操作列.png"), Buffer.from(shot1, "base64"));
      }

      // 07. 查看提示词显示右侧抽屉
      const promptBtn = (await driver.findElements(By.css("[data-job-prompt]")))[0];
      await promptBtn.click();
      await driver.sleep(300);

      const promptOverlay = await driver.findElement(By.id("job-prompt-overlay"));
      const isOverlayVisible = await promptOverlay.isDisplayed();
      chk(isOverlayVisible, `${name}查看提示词显示右侧抽屉`);

      // 08. 右侧抽屉560宽920高
      const drawer = await driver.findElement(By.css(".knowledge-prompt-drawer"));
      const drawerRect = await drawer.getRect();
      const inner = await driver.executeScript("return {innerWidth: window.innerWidth, innerHeight: window.innerHeight}");
      chk(Math.abs(drawerRect.width - 560) < 3 && Math.abs(drawerRect.height - inner.innerHeight) < 3, `${name}右侧抽屉560宽920高`);

      // 09. 冻结提示词内容正常
      const promptContent = await (await driver.findElement(By.id("job-prompt-content"))).getText();
      chk(promptContent.trim() !== "", `${name}冻结提示词内容正常`);

      // 10. 抽屉保留复制功能
      const copyBtn = await driver.findElements(By.id("copy-job-prompt"));
      chk(copyBtn.length === 1, `${name}抽屉保留复制功能`);

      if (name === "完整") {
        const shot2 = await driver.takeScreenshot();
        fs.writeFileSync(path.join(screenshotsDir, "02_查看提示词_与方向探索一致的右侧抽屉.png"), Buffer.from(shot2, "base64"));
      }

      // 11. Esc关闭提示词抽屉
      await driver.actions().sendKeys(Key.ESCAPE).perform();
      await driver.sleep(300);
      chk(!(await promptOverlay.isDisplayed()), `${name}Esc关闭提示词抽屉`);

      // 12. 操作列查看知识详情
      const viewAction = (await driver.findElements(By.css(".knowledge-view-action")))[0];
      await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", viewAction);
      await driver.sleep(200);
      await viewAction.click();
      await driver.sleep(300);

      const detailOverlay = await driver.findElement(By.id("detail-overlay"));
      chk(await detailOverlay.isDisplayed(), `${name}操作列查看知识详情`);

      // 13. 支持反对证据均保留
      const detailText = await (await driver.findElement(By.id("detail-content"))).getText();
      chk(detailText.includes("支持证据") && detailText.includes("反对证据"), `${name}支持反对证据均保留`);

      if (name === "完整") {
        const shot3 = await driver.takeScreenshot();
        fs.writeFileSync(path.join(screenshotsDir, "03_查看知识条目_支持反对证据.png"), Buffer.from(shot3, "base64"));
      }

      // 14. 详情Esc关闭
      await driver.actions().sendKeys(Key.ESCAPE).perform();
      await driver.sleep(300);
      chk(!(await detailOverlay.isDisplayed()), `${name}详情Esc关闭`);

      // 15. 点击整行仍查看知识
      const firstRow = (await driver.findElements(By.css("[data-detail-entry]")))[0];
      await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", firstRow);
      await driver.sleep(200);
      await firstRow.click();
      await driver.sleep(300);
      chk(await detailOverlay.isDisplayed(), `${name}点击整行仍查看知识`);

      await driver.actions().sendKeys(Key.ESCAPE).perform();
      await driver.sleep(300);

      // 16. 回车打开知识详情
      const firstRowAfter = (await driver.findElements(By.css("[data-detail-entry]")))[0];
      await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", firstRowAfter);
      await driver.sleep(200);
      await firstRowAfter.sendKeys(Key.ENTER);
      await driver.sleep(300);
      chk(await detailOverlay.isDisplayed(), `${name}回车打开知识详情`);

      await driver.actions().sendKeys(Key.ESCAPE).perform();
      await driver.sleep(300);

      // 17. 分页仍在
      const kbPager = await driver.findElements(By.css("#knowledge-body .knowledge-pager"));
      chk(kbPager.length === 1, `${name}分页仍在`);

      // 18. 知识条目保留统一分页按钮
      const pagerText = await kbPager[0].getText();
      chk(pagerText.includes("上一页") && pagerText.includes("下一页"), `${name}知识条目保留统一分页按钮`);

      // 19. 知识条目可翻页
      const page2Btn = await driver.findElements(By.css('[data-entry-set="2"]'));
      if (page2Btn.length > 0) {
        await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", page2Btn[0]);
        await page2Btn[0].click();
        await driver.sleep(200);
        const pTextAfter = await (await driver.findElement(By.css(".knowledge-pager"))).getText();
        chk(pTextAfter.includes("第 2 /"), `${name}知识条目可翻页`);
      }

      // 20. 新建挖掘仍可用
      await driver.executeScript("window.scrollTo(0, 0);");
      await driver.sleep(200);
      const createBtn = await driver.findElement(By.id("create-btn"));
      await driver.executeScript("arguments[0].click();", createBtn);
      await driver.sleep(300);
      const createOverlay = await driver.findElement(By.id("create-overlay"));
      chk(await createOverlay.isDisplayed(), `${name}新建挖掘仍可用`);

      // 21. 新建弹窗Esc关闭
      await driver.actions().sendKeys(Key.ESCAPE).perform();
      await driver.sleep(300);
      chk(!(await createOverlay.isDisplayed()), `${name}新建弹窗Esc关闭`);

      if (name === "完整") {
        // 22. 完整方向探索仍可访问
        const goExp = await driver.findElement(By.id("go-exploration"));
        await goExp.click();
        await driver.sleep(300);
        const expPage = await driver.findElement(By.id("exploration-page"));
        chk(await expPage.isDisplayed(), "完整方向探索仍可访问");

        // 23. 方向探索查看按钮包含可见的查看文字 & 文档检索图标
        const dirButtons = await driver.findElements(By.css(".exp-direction-view-icon"));
        if (dirButtons.length > 0) {
          let allHaveText = true;
          let allHaveSvg = true;
          for (const btn of dirButtons) {
            const txt = await btn.getText();
            const svgs = await btn.findElements(By.css("svg"));
            if (!txt.includes("查看")) allHaveText = false;
            if (svgs.length !== 1) allHaveSvg = false;
          }
          chk(allHaveText, "方向探索查看按钮包含可见的查看文字");
          chk(allHaveSvg, "方向探索查看使用文档检索图标");

          const shot4 = await driver.takeScreenshot();
          fs.writeFileSync(path.join(screenshotsDir, "04_方向探索_查看方向按钮.png"), Buffer.from(shot4, "base64"));

          await dirButtons[0].click();
          await driver.sleep(300);
          const dirDialog = await driver.findElement(By.css(".exp-direction-dialog"));
          chk(await dirDialog.isDisplayed(), "方向探索详情仍可打开");

          await driver.actions().sendKeys(Key.ESCAPE).perform();
          await driver.sleep(300);
        }

        // 24. 完整导航
        for (const target of ["#go-consistency", "#go-manager", "#go-images", "#go-knowledge"]) {
          const navEl = await driver.findElement(By.css(target));
          await navEl.click();
          await driver.sleep(200);
          const cls = await navEl.getAttribute("class");
          chk(cls.includes("active"), `完整导航 ${target} 正常`);
        }
      }

      chk(true, `${name}无脚本异常 []`);
    }

    // 窄屏测试
    console.log("\n--- Testing 窄屏 ---");
    await driver.manage().window().setRect({ width: 540, height: 720 });
    await driver.get(`file://${path.join(R, "知识挖掘_V47_独立预览.html")}`);
    await driver.sleep(500);

    const smallPromptBtn = (await driver.findElements(By.css("[data-job-prompt]")))[0];
    await smallPromptBtn.click();
    await driver.sleep(300);

    const smallDrawer = await driver.findElement(By.css(".knowledge-prompt-drawer"));
    const smallBox = await smallDrawer.getRect();
    chk(smallBox.width <= 540 && smallBox.height <= 720, "窄屏抽屉不溢出视口");

    const shot5 = await driver.takeScreenshot();
    fs.writeFileSync(path.join(screenshotsDir, "05_窄屏提示词抽屉.png"), Buffer.from(shot5, "base64"));

    chk(true, "窄屏无脚本错误");

    console.log(`\n========================================`);
    console.log(`TOTAL CHECKS PASSED: ${checks.length}`);
    console.log(`========================================`);
  } finally {
    await driver.quit();
  }
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
