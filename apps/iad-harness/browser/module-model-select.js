import {By,Key,until} from 'selenium-webdriver';

export async function selectModuleModel(driver,label,{keyboard=false}={}) {
  const [,name,provider]=label.match(/^(.+)（(.+)）$/);
  const trigger=await driver.wait(until.elementLocated(By.css('button[aria-label="分析模型"]')),10000);
  await driver.wait(until.elementIsEnabled(trigger),10000);
  await trigger.click();
  const input=await driver.wait(until.elementLocated(By.css('input[aria-label="搜索模型"]')),5000);
  await input.sendKeys(name);
  const option=await driver.wait(until.elementLocated(By.xpath(`//*[@role='group'][.//*[normalize-space(.)='${provider}']]//button[@role='menuitem'][normalize-space(.)='${name}']`)),5000);
  if(keyboard){await input.sendKeys(Key.ARROW_DOWN);await driver.wait(()=>driver.executeScript('return document.activeElement===arguments[0]',option),2000);await option.sendKeys(Key.ENTER);}
  else await option.click();
  await driver.wait(async()=>!(await driver.findElements(By.css('input[aria-label="搜索模型"]'))).length,5000);
}
