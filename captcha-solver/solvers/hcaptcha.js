import superagent from "superagent";
import { delay } from "../helpers.js";

const patentLink = "img[src='app/assets/images/patentSearch.png']";
const captchaLink = "#checkbox";
const captchaIframe = "iframe[title='Main content of the hCaptcha challenge']";
const submitButton = ".button-submit";

async function step(frame) {
    // retrieve searched word and list of challenges
    await delay(1000);
    const {word, images} = await frame.evaluate(() => {
        return {
            word: document
            .querySelector(".prompt-text span")
            .innerHTML.split("containing")
            .pop()
            .trim(),
            images: [...document.querySelectorAll(`.image-wrapper .image`)].map((x, i) => {
                return {
                    index: i,
                    url: x.style.background.match(/url\(["']?([^"']*)["']?\)/)[1]
                }
            })
        }
    });

    // send requests to CLIP for each challenge
    let results = await superagent
        .post("http://localhost:5000/images")
        .type("form")
        .field("word", word)
        .field("images", JSON.stringify(images));
    let solutions = results.body;

    // solve challenge
    const nodes = await frame.$$(`.image-wrapper .image`);
    for (let i in solutions) {
        if (solutions[i] >= 0.8) {
            await nodes[i].click();
            await nodes[i].dispose();
            //await delay(1000);
        }
    }
}

export async function solve_hcaptcha(page) {
    // patent link
    // await page.waitForSelector(patentLink);
    // await page.click(patentLink);

    // captcha link
    let iframe = await page.waitForSelector("iframe");
    console.log("iframe found");
    let frame = await iframe.contentFrame();
    await frame.waitForSelector(captchaLink);
    console.log("captcha found");
    await frame.click(captchaLink);

    // wait
    await delay(1000);
    iframe = await page.waitForSelector(captchaIframe);
    frame = await iframe.contentFrame();
    console.log("images found");

    // count challenges
    const challengeCount = await frame.evaluate(() => {
        return Array.from(document.querySelectorAll(".challenge-breadcrumbs .Crumb")).length || 1;
    });
    console.log(challengeCount)

    var progress = 0;

    while (progress < challengeCount) {
        // solve
        await step(frame);

        // submit
        await frame.click(submitButton);
        progress++;

        // wait
        //await delay(1000);
    }
}