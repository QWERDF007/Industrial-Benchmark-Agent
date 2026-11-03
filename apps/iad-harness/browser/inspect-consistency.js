import { Builder, By, until } from "selenium-webdriver";
import firefox from "selenium-webdriver/firefox.js";
import fs from "fs";

async function main() {
  const options = new firefox.Options().addArguments("-headless");
  const driver = await new Builder().forBrowser("firefox").setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder("/tmp/geckodriver")).build();
  try {
    await driver.get("http://127.0.0.1:8000/");
    try {
      const later = await driver.wait(until.elementLocated(By.xpath('//button[normalize-space(.)="Configure later"]')), 2000);
      await later.click();
    } catch {}
    const navBtn = await driver.wait(until.elementLocated(By.xpath("//button[@aria-label='数据一致性' or contains(., '数据一致性')]")), 5000);
    await navBtn.click();
    await driver.sleep(2000);
    const shot = await driver.takeScreenshot();
    fs.writeFileSync('/tmp/current_consistency_page.png', shot, 'base64');
    console.log('Saved /tmp/current_consistency_page.png');
    const pageInfo = await driver.executeScript(async () => {
      const report = await fetch('/api/iad/consistency/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selection: { kind: 'batch', batch_id: 'batch_ebdf24374ffb404686b1ca24d965b967' },
          relation: 'EXACT',
          annotation_differences_only: true,
          page_size: 1
        })
      }).then(r => r.json()).catch(e => ({ error: e.message }));

      let gallerySearch = null;
      if (report && report.page?.query_id) {
        gallerySearch = await fetch('/api/iad/consistency/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query_id: report.page.query_id,
            kind: 'conflicts',
            page: 1,
            page_size: 6,
            search: 'TrackImg'
          })
        }).then(r => r.json()).catch(e => ({ error: e.message }));
      }

      return {
        gallerySearchTotal: gallerySearch?.total,
        gallerySearchItems: gallerySearch?.items?.map(it => it.anchor?.sample?.relative_path)
      };
    });
    console.log('Query result:', JSON.stringify(pageInfo, null, 2));
  } finally {
    await driver.quit();
  }
}
main().catch(console.error);
