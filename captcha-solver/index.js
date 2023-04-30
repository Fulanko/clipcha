import { executablePath } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { delay } from "./helpers.js";
import { solve_hcaptcha } from "./solvers/hcaptcha.js";
import { solve_jcaptcha_text_image } from "./solvers/jcaptcha_text_image.js";
import { solve_captcha_puzzle_slide } from "./solvers/captcha_puzzle_slide.js";
puppeteer.use(StealthPlugin());

async function demo_hk(page) {
  await page.goto("https://esearch.ipd.gov.hk/nis-pos-view/#/?lang=en");
  const patentLink = "img[src='app/assets/images/patentSearch.png']";
  await page.waitForSelector(patentLink);
  await page.click(patentLink);
  await solve_hcaptcha(page);
}

async function demo_cn(page) {
  page.goto("http://cpquery.cnipa.gov.cn/", {waitUntil: 'domcontentloaded', timeout: 0});
  await solve_jcaptcha_text_image(page);
  const tokenInput = "#attention_token";
  const feeDataUrl = "http://cpquery.cnipa.gov.cn/txnQueryFeeData.do";
  await page.waitForSelector(tokenInput, {timeout: 0});
  let input = await page.$(tokenInput);
  const token = await page.evaluate(el => el.value, input);
  const cn_appl_number = "2006800261626";
  page.goto(`${feeDataUrl}?select-key:shenqingh=${cn_appl_number}&token=${token}`, {waitUntil: 'domcontentloaded', timeout: 0});
}

async function demo_cn2(page) {
  page.goto("https://cpquery.cponline.cnipa.gov.cn/", {waitUntil: 'domcontentloaded', timeout: 0});
  await solve_captcha_puzzle_slide(page);
}

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

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 })

    page.on("console", async (msg) => {
      const msgArgs = msg.args();
      for (let i = 0; i < msgArgs.length; ++i) {
        console.log(await msgArgs[i].jsonValue());
      }
    });

    await demo_cn2(page);
    await delay(10000000);

    await browser.close();

  } catch (e) {
    console.log(e);
    await browser.close();
  } finally {
    await browser.close();
  }
})();