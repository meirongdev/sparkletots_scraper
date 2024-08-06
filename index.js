require("dotenv").config();
const puppeteer = require("puppeteer"); // v22.0.0 or later
const fs = require("fs");
const path = require("path");
const axios = require("axios");

(async () => {
  const browser = await puppeteer.launch({
    // headless: false,
    defaultViewport: null,
  });
  const page = await browser.newPage();
  const timeout = 5000;
  page.setDefaultTimeout(timeout);
  {
    const targetPage = page;
    await targetPage.setViewport({
      width: 1663,
      height: 1287,
    });
  }
  // login page
  {
    const targetPage = page;
    const promises = [];
    const startWaitingForEvents = () => {
      promises.push(targetPage.waitForNavigation());
    };
    startWaitingForEvents();
    await targetPage.goto(
      "https://pcfsparkletots.qoqolo.com/cos/o.x?c=/ca4q_pep/user&func=login"
    );
    await Promise.all(promises);
  }
  {
    const targetPage = page;
    await puppeteer.Locator.race([
      targetPage.locator("::-p-aria(Login-ID)"),
      targetPage.locator("#inputName"),
      targetPage.locator('::-p-xpath(//*[@id=\\"inputName\\"])'),
      targetPage.locator(":scope >>> #inputName"),
    ])
      .setTimeout(timeout)
      .fill(process.env.username, { delay: 500 });
  }
  {
    const targetPage = page;
    await puppeteer.Locator.race([
      targetPage.locator("::-p-aria(Password)"),
      targetPage.locator("#inputPassword"),
      targetPage.locator('::-p-xpath(//*[@id=\\"inputPassword\\"])'),
      targetPage.locator(":scope >>> #inputPassword"),
    ])
      .setTimeout(timeout)
      .fill(process.env.password, { delay: 500 });
  }
  {
    const targetPage = page;
    await targetPage.click("#submitButton");
    await Promise.all(promises);
  }
  // Click Sidebar Menu
  {
    const targetPage = page;
    const promises = [];
    const startWaitingForEvents = () => {
        promises.push(targetPage.waitForNavigation());
    }
    await puppeteer.Locator.race([
        targetPage.locator('li:nth-of-type(7) span'),
        targetPage.locator('::-p-xpath(//*[@id=\\"lo_main\\"]/div/div[2]/div[1]/div[2]/div/ul/li[7]/a/span)'),
        targetPage.locator(':scope >>> li:nth-of-type(7) span')
    ])
        .setTimeout(timeout)
        .on('action', () => startWaitingForEvents())
        .click();
    await Promise.all(promises);
  }
  // Sign-in/out Page
  {
    let curMonth = process.env.start_month;
    let currMonthStr = getCalendarMonth(curMonth);
    let nextMonthStr = "";
    do {
      if (nextMonthStr != "") {
        currMonthStr = nextMonthStr;
      }
      {
        const targetPage = page;
        // choose the calendar
        await targetPage
          .locator("#calendar")
          .setTimeout(timeout)
          .fill(currMonthStr, { delay: 500 });
        // click other place to trigger the page refresh
        const [signInText] = await targetPage.$$(
          "xpath/.//h2[text()='Sign-in']"
        );
        await signInText.click();
      }
      {
        // Get all the rows
        await sleep(500);
        const targetPage = page;
        // get all tr with the attribute valign='top'
        const detailsBtns = await targetPage.$$(
          "button[class='btn btn-info btn-sm view-checkin']"
        );
        console.log(detailsBtns.length);
        // for (let i=0; i < detailsBtns.length; i++) {

        const dir = path.resolve(process.env.save_dir);
        console.log("save_dir", dir);
        for (const btn of detailsBtns) {
          await sleep(500);
          page.on("response", async (response) => {
            // if a response is an image whose url has `data:image`
            if (
              response.request().resourceType() === "image" &&
              response.url().includes("check_in")
            ) {
              console.log(response.headers());
              const dateStr = response.headers()["last-modified"];
              console.log(dateStr);
              // 将字符串解析为 Date 对象
              const date = new Date(dateStr);
              const formattedDate = formatLastModified(date);
              console.log(formattedDate);
              const data = await response.buffer();
              // save the raw data to a local file
              const imgSavePath = `${dir}/${formattedDate}.jpg`;
              await fs.promises.writeFile(imgSavePath, data);
              await fs.promises.utimes(imgSavePath, date, date);
            }
          });
          await btn.click();
          await sleep(1000);

          const [closeBtn] = await targetPage.$$(
            "xpath/.//html/body/div[3]/div/div/div[1]/button"
          );
          await closeBtn.click();
        }
      }
      nextMonthStr = getNextMonth(
        getYyyyMM(currMonthStr),
        process.env.end_month
      );
    } while (nextMonthStr != "");
  }

  await sleep(3000);
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

function formatLastModified(date) {
  // 获取各个部分并进行格式化
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  // 组合成 yyyyMMddhhmmss 格式
  const formattedDate = `${year}${month}${day}${hours}${minutes}${seconds}`;
  return formattedDate;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getCalendarMonth(dateStr) {
  // change the format 202401 to 01-2024
  const year = dateStr.slice(0, 4); // "2024"
  const month = dateStr.slice(4, 6); // "01"
  return month + "-" + year;
}

function getYyyyMM(dateStr) {
  const arr = dateStr.split("-");
  return arr[1] + arr[0];
}

function getNextMonth(curMonth, endMonth) {
  // all the format are 'yyyyMM'
  if (curMonth > endMonth) {
    return "";
  } else {
    let year = curMonth.slice(0, 4); // "2024"
    let month = curMonth.slice(4, 6); // "01"
    let monthNum = parseInt(month, 10);
    let yearNum = parseInt(year, 10);
    if (monthNum >= 12) {
      yearNum += 1;
      monthNum = 1;
    } else {
      monthNum += 1;
    }
    month = String(monthNum).padStart(2, "0");
    year = String(yearNum).padStart(4, "0");
    return month + "-" + year;
  }
}
