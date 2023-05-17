import superagent from "superagent";
import { delay } from "../helpers.js";
import { config } from "../config.js";
import { secrets } from "../secrets.js";


const captchaBackgroundElement = ".verify-img-panel img";
const captchaPatternElement = ".verify-sub-block img";
const usernameInput = "form.el-form input[type='text']";
const passwordInput = "form.el-form input[type='password']";
const loginButton = "form.el-form button";
const moveBlockElement = ".verify-move-block";

async function step(page) {
    
}

export async function solve_captcha_puzzle_slide(page) {
    await page.waitForSelector(usernameInput, {timeout: 0});
   
    // fill in credentials
    await page.click(usernameInput);
    await type_value(page, secrets.cn2_username);
    await page.keyboard.press('Tab');
    await page.click(passwordInput);
    await type_value(page, secrets.cn2_password);
    await page.keyboard.press('Tab');

    await page.click(loginButton);

    await delay(4000);

    await page.waitForSelector(captchaBackgroundElement, {timeout: 0});
	await delay(5000);
    const captchaBackground = (await page.$eval(captchaBackgroundElement, (el) => el.getAttribute('src'))).split(",")[1];

    await page.waitForSelector(captchaPatternElement, {timeout: 0});
    const captchaPattern = (await page.$eval(captchaPatternElement, (el) => el.getAttribute('src'))).split(",")[1];

    let result = await superagent
        .post(config.apiUrl + "/pattern-match")
        .disableTLSCerts()
        .type("form")
        .field("search_image", captchaBackground)
        .field("pattern_image", captchaPattern);

    let pos = result.body * (400 / 310);
    console.log(pos);

    const moveBlock = await page.$(moveBlockElement);
    const rect = await page.evaluate(el => {
        const { top, left, width, height } = el.getBoundingClientRect();
        return { top, left, width, height };
    }, moveBlock);

    console.log(rect);
    
    await page.mouse.move(rect.left + rect.width / 2, rect.top + rect.height / 2);
    await page.mouse.down();
    await page.mouse.move(rect.left + rect.width / 2 + pos, rect.top + rect.height / 2);
    await page.mouse.up();
}

async function type_value(page, value) {
    for (var i = 0; i < value.length; i++) {
        await page.keyboard.press(value[i]);
    }
}