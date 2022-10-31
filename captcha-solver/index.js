import puppeteer from "puppeteer";
import superagent from "superagent";

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
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
  });
  const page = await browser.newPage();

  page.on("console", async (msg) => {
    const msgArgs = msg.args();
    for (let i = 0; i < msgArgs.length; ++i) {
      console.log(await msgArgs[i].jsonValue());
    }
  });

  await page.goto("https://esearch.ipd.gov.hk/nis-pos-view/#/?lang=en");

  // patent link
  const patentLink = "img[src='app/assets/images/patentSearch.png']";
  await page.waitForSelector(patentLink);
  await page.click(patentLink);

  // captcha link
  let iframe = await page.waitForSelector("iframe");
  console.log("iframe found");
  let frame = await iframe.contentFrame();
  const captchaLink = "#checkbox";
  await frame.waitForSelector(captchaLink);
  console.log("captcha found");
  await frame.click(captchaLink);

  const imageLink = ".image";
  await delay(2000);

  iframe = await page.waitForSelector(
    "iframe[title='Main content of the hCaptcha challenge']"
  );
  frame = await iframe.contentFrame();
  console.log("images found");

  const { word, images } = await frame.evaluate(() => {
    return {
      word: document
        .querySelector(".prompt-text span")
        .innerHTML.split("containing")
        .pop()
        .trim(),
      images: [...document.querySelectorAll(".image-wrapper .image")].map(
        (x) => x.style.background.match(/url\(["']?([^"']*)["']?\)/)[1]
      ),
    };
  });

  const nodes = await frame.$$(`.image-wrapper .image`);

  let requests = [];
  for (let i in images) {
    requests.push(
      superagent
        .post("http://localhost:5000/images")
        .type("form")
        .field("word", word)
        .field("url", images[i])
    );
  }
  const results = await Promise.all(requests);

  for (let i in results) {
    console.log(results[i].body);
    if (results[i].body == true) {
      await nodes[i].click();
      await nodes[i].dispose();
    }
  }

  await browser.close();
})();
