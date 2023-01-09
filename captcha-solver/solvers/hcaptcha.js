import superagent from "superagent";
import { delay } from "../helpers.js";

const patentLink = "img[src='app/assets/images/patentSearch.png']";
const captchaLink = "#checkbox";
const captchaIframe = "iframe[title='Main content of the hCaptcha challenge']";
const submitButton = ".button-submit";

async function step(frame) {
    // retrieve searched word and list of challenges
    const nodes = await frame.$$(`.image-wrapper .image`);
    let images = [];
    for (let i = 0; i < nodes.length; i++) {
        let content = await nodes[i].screenshot({ encoding: "base64" });
        images[i] = {
            index: i,
            content: content,
            //url: images[i].style.background.match(/url\(["']?([^"']*)["']?\)/)[1]
        };
        console.log(content.length)
    }

    const word = await frame.evaluate(() => {
        return document
            .querySelector(".prompt-text span")
            .innerHTML.split("containing")
            .pop()
            .trim();
    });

    // send requests to CLIP for each challenge
    let results = [];
    for (var image of images) {
        let result = await superagent
            .post("http://localhost:5000/images")
            .type("form")
            .field("word", word)
            .field("index", image.index)
            .field("image", image.content);
        results.push(result.body);
    }

    // solve challenge
    for (let i in results) {
        if (results[i] >= 0.8) {
            await nodes[i].click();
            await nodes[i].dispose();
        }
    }
}

export async function solve_hcaptcha(page) {
    // patent link
    //await page.waitForSelector(patentLink);
    //await page.click(patentLink);

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
        await delay(1000);
    }
}