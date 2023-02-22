import superagent from "superagent";
import { delay } from "../helpers.js";
import { config } from "../config.js";
import { secrets } from "../secrets.js";

const captchaImage = "#jcaptchaimage";
const captchaContainer = "#imgyzm";
const charactersLabel = "#selectyzm_text";
const usernameInput = "#username1";
const passwordInput = "#password1";
const loginButton = "#publiclogin";

async function step(page) {
    // retrieve characters
    await page.waitForFunction(
      'document.querySelector("#selectyzm_text").innerText.includes("Please click")'
    );
    let label = await page.$(charactersLabel)
    let re = /"(.)"/g;
    let matches = (await page.evaluate(el => el.textContent, label)).matchAll(re);

    // retrieve image
    const captcha = await page.$(captchaImage); 
    const base64 = await captcha.screenshot({ encoding: "base64" });

    // fill in credentials
    await page.$eval(usernameInput, (el, secrets) => el.value = secrets.cn_username, secrets);
    await page.$eval(passwordInput, (el, secrets) => el.value = secrets.cn_password, secrets);

    // send request to api
    let characters = []
    for (let match of matches) {
        characters.push(match[1]);
    }
    let result = await superagent
        .post(config.apiUrl + "/ocr")
        .type("form")
        .field("characters", JSON.stringify(characters))
        .field("image", base64);

    const rect = await page.evaluate((captcha) => {
        const {top, left, bottom, right} = captcha.getBoundingClientRect();
        return {top, left, bottom, right};
    }, captcha);

    let pos = result.body;
    if (pos.length != 3) {
        return false;
    } else {
        for (let i = 0; i < pos.length; i++) {
            console.log("click", pos[i])
            await page.mouse.click(rect.left + (pos[i].x - 10), rect.top + (pos[i].y));
            await delay(100);
        }
        return true;
    }
}

export async function solve_jcaptcha_text_image(page) {
    let success = false;
    while (!success) {
        await make_visible(page);
        success = await step(page);

        await page.waitForFunction(
            '!document.querySelector("#selectyzm_text").innerText.includes("Please click")'
        );
        let label = await page.$(charactersLabel);
        let text = await page.evaluate(el => el.textContent, label);
        if (text != "Successful verification") {
            console.log("unsuccessful captcha");
            success = false;
        }

        console.log("success", success);
        if (success == false) {
            await page.reload();
        }
    };
    
    await page.click(loginButton);
}

const make_visible = async (page) => {
    await page.waitForSelector(captchaImage);
    let element = await page.$(captchaContainer);
    await element.evaluate((el) => el.classList.remove("hidden"));
    await page.waitForSelector(captchaImage, {visible: true});
    console.log("image found");
}