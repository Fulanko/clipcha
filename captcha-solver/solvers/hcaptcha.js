import superagent from "superagent";
import { delay } from "../helpers.js";
import { config } from "../config.js";

const captchaLink = "#checkbox";
const captchaIframe = "iframe[title='Main content of the hCaptcha challenge']";
const submitButton = ".button-submit";
const breadcrumbSelector = ".challenge-breadcrumbs .Crumb";
const promptSelector = ".prompt-text span";
const imageSelector = ".image-wrapper .image";
const checkSelector = ".check";

async function step(frame) {
    // retrieve searched word and list of challenges
    await delay(config.solverDelay);
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
        .post(config.apiUrl)
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

async function get_challenge_count(frame, selector) {
    await delay(config.selectorDelay);
    return await frame.evaluate((selector) => {
        return Array.from(document.querySelectorAll(selector)).length || 1;
    }, selector);
}

export async function solve_hcaptcha(page) {
    // captcha link
    let iframe = await page.waitForSelector("iframe");
    console.log("iframe found");
    let captchaCheckbox = await iframe.contentFrame();
    await captchaCheckbox.waitForSelector(captchaLink);
    console.log("captcha found");
    await captchaCheckbox.click(captchaLink);

    // wait
    await delay(config.selectorDelay);
    iframe = await page.waitForSelector(captchaIframe);
    let frame = await iframe.contentFrame();
    console.log("images found");

    // count challenges
    let challengeCount = await get_challenge_count(frame, breadcrumbSelector);

    var progress = 0;

    while (progress < challengeCount) {
        // solve
        await step(frame);

        // submit
        await frame.click(submitButton);
        progress++;
        console.log(`${progress} / ${challengeCount}`)

        // fail check
        await delay(config.selectorDelay);
        const solved = await captchaCheckbox.evaluate((checkSelector) => {
            return document.querySelector(checkSelector).style.display
        }, checkSelector) == "block";

        if (progress == challengeCount && !solved) {
            progress = 0;
            challengeCount = await get_challenge_count(frame, breadcrumbSelector);
            console.log("reset", challengeCount)
        }
    }
}