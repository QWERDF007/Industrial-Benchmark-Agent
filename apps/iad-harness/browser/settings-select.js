import {By,Key,until} from 'selenium-webdriver';

export async function selectSettingOption(driver,label,text) {
  const trigger=await driver.wait(until.elementLocated(By.css(`button[aria-label="${label}"]`)),7000);
  await trigger.click();
  const option=await driver.wait(until.elementLocated(By.xpath(`//*[@role='menuitem'][normalize-space(.)='${text}']`)),5000);
  await option.click();
  await driver.wait(async()=>(await trigger.getAttribute('aria-expanded'))==='false',5000);
}

export async function settingOptions(driver,label) {
  const trigger=await driver.wait(until.elementLocated(By.css(`button[aria-label="${label}"]`)),7000);
  await trigger.click();
  const options=await driver.findElements(By.css('[role="menuitem"]'));
  const labels=await Promise.all(options.map(option=>option.getText()));
  await driver.actions().sendKeys(Key.ESCAPE).perform();
  await driver.wait(async()=>(await trigger.getAttribute('aria-expanded'))==='false',5000);
  return labels;
}
