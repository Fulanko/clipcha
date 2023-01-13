import { executablePath } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { solve_hcaptcha } from "./solvers/hcaptcha.js";
puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-web-security",
      "--disable-features=site-per-process",
      "--disable-features=IsolateOrigins",
      "--disable-site-isolation-trials",
    ],
    executablePath: executablePath(),
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 })

  page.on("console", async (msg) => {
    const msgArgs = msg.args();
    for (let i = 0; i < msgArgs.length; ++i) {
      console.log(await msgArgs[i].jsonValue());
    }
  });

  //await page.goto("https://esearch.ipd.gov.hk/nis-pos-view/#/?lang=en");
  await page.goto("https://accounts.hcaptcha.com/demo");
  await solve_hcaptcha(page, 1000, 1000);
  
  //await browser.close();
})();
