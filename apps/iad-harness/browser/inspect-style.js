import { Builder, By, until } from "selenium-webdriver";
import firefox from "selenium-webdriver/firefox.js";

async function inspectBtn() {
  const options = new firefox.Options().addArguments("-headless");
  const driver = await new Builder().forBrowser("firefox").setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder("/tmp/geckodriver")).build();
  try {
    await driver.get("http://127.0.0.1:8000/");
    try {
      const later = await driver.wait(until.elementLocated(By.xpath('//button[normalize-space(.)="Configure later"]')), 2000);
      await later.click();
    } catch {}
    const navBtn = await driver.wait(until.elementLocated(By.css('button[aria-label="图像浏览"]')), 10000);
    await driver.executeScript('arguments[0].click()', navBtn);
    await driver.wait(until.elementLocated(By.id("refresh")), 10000);
    const styles = await driver.executeScript(() => {
      const refresh = document.getElementById("refresh");
      const reset = document.getElementById("reset");
      const rRect = refresh.getBoundingClientRect();
      const sRect = reset.getBoundingClientRect();
      function getMatchingRules(element) {
        const rules = [];
        for (const sheet of document.styleSheets) {
          try {
            for (const rule of sheet.cssRules) {
              if (rule.selectorText && element.matches(rule.selectorText)) {
                rules.push({ selector: rule.selectorText, cssText: rule.cssText });
              }
            }
          } catch {}
        }
        return rules;
      }
      return {
        refresh: {
          rect: { x: rRect.x, y: rRect.y, width: rRect.width, height: rRect.height },
          border: getComputedStyle(refresh).border,
          boxShadow: getComputedStyle(refresh).boxShadow,
          outline: getComputedStyle(refresh).outline,
          background: getComputedStyle(refresh).backgroundColor,
          rules: getMatchingRules(refresh)
        },
        reset: {
          rect: { x: sRect.x, y: sRect.y, width: sRect.width, height: sRect.height },
          border: getComputedStyle(reset).border,
          boxShadow: getComputedStyle(reset).boxShadow,
          outline: getComputedStyle(reset).outline,
          background: getComputedStyle(reset).backgroundColor,
          rules: getMatchingRules(reset)
        }
      };
    });
    console.log("Computed button styles:", JSON.stringify(styles, null, 2));
    const fs = await import("node:fs");
    const shot = await driver.takeScreenshot();
    fs.writeFileSync("/home/dell/.gemini/antigravity-cli/brain/a36a5c63-3c83-4b2c-b4ff-8a1730f771df/borderless_buttons_images.png", shot, "base64");
    console.log("Saved borderless_buttons_images.png");
  } finally {
    await driver.quit();
  }
}
inspectBtn().catch(console.error);

