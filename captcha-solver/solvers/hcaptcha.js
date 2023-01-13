import superagent from "superagent";
import { delay } from "../helpers.js";

const patentLink = "img[src='app/assets/images/patentSearch.png']";
const captchaLink = "#checkbox";
const captchaIframe = "iframe[title='Main content of the hCaptcha challenge']";
const submitButton = ".button-submit";
const breadcrumbSelector = ".challenge-breadcrumbs .Crumb";
const promptSelector = ".prompt-text span";
const imageSelector = ".image-wrapper .image";
const errorSelector = ".display-error";

async function step(frame, solverDelay = 1000) {
    // retrieve searched word and list of challenges
    await delay(solverDelay);
    const {word, images} = await frame.evaluate((promptSelector, imageSelector) => {
        return {
            word: document
            .querySelector(promptSelector)
            .innerHTML.split("containing")
            .pop()
            .trim(),
            images: [...document.querySelectorAll(imageSelector)].map((x, i) => {
                return {
                    index: i,
                    url: x.style.background.match(/url\(["']?([^"']*)["']?\)/)[1]
                }
            })
        }
    }, promptSelector, imageSelector);

    // send requests to CLIP for each challenge
    let results = await superagent
        .post("http://localhost:5000/images")
        .type("form")
        .field("word", word)
        .field("images", JSON.stringify(images));
    let solutions = results.body;

    // solve challenge
    const nodes = await frame.$$(imageSelector);
    for (let i in solutions) {
        if (solutions[i] >= 0.8) {
            await nodes[i].click();
            await nodes[i].dispose();
        }
    }
}

export async function solve_hcaptcha(page, initialDelay = 1000, solverDelay = 1000) {
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
    await delay(initialDelay);
    iframe = await page.waitForSelector(captchaIframe);
    frame = await iframe.contentFrame();
    console.log("images found");

    // count challenges
    let challengeCount = await frame.evaluate((breadcrumbSelector) => {
        return Array.from(document.querySelectorAll(breadcrumbSelector)).length || 1;
    }, breadcrumbSelector);

    var progress = 0;

    while (progress < challengeCount) {
        // solve
        await step(frame, solverDelay);

        // submit
        await frame.click(submitButton);
        progress++;
        console.log(`${progress} / ${challengeCount}`)

        // fail check
        await delay(500);
        const error = await frame.evaluate((errorSelector) => 
          document.querySelector(errorSelector).getAttribute("aria-hidden")
        , errorSelector) == "false";
        
        if (error) {
            console.log("reset")
            progress = 0;
            challengeCount = await frame.evaluate((breadcrumbSelector) => {
                return Array.from(document.querySelectorAll(breadcrumbSelector)).length || 1;
            }, breadcrumbSelector);
        }
    }
}