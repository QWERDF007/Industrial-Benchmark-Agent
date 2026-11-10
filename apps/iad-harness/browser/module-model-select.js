import {By,Key,until} from 'selenium-webdriver';

export async function selectModuleModel(driver,label,{keyboard=false}={}) {
  const trigger=await driver.wait(until.elementLocated(By.css('button[aria-label="分析模型"]')),10000);
  await trigger.click();
  const input=await driver.wait(until.elementLocated(By.css('input[aria-label="搜索模型"]')),5000);
  await input.sendKeys(label.split('（')[0]);
  const option=await driver.wait(until.elementLocated(By.xpath(`//*[@role='option'][@aria-label='${label}']`)),5000);
  if(keyboard){await input.sendKeys(Key.ARROW_DOWN);await driver.wait(async()=>!!await input.getAttribute('aria-activedescendant'),2000);await input.sendKeys(Key.ENTER);}
  else await option.click();
  await driver.wait(async()=>!(await driver.findElements(By.css('input[aria-label="搜索模型"]'))).length,5000);
}
