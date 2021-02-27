import { webkit } from 'playwright';
import enquirer from 'enquirer';
import axios from "axios";
import cheerio from "cheerio";
import * as path from "path";

const homepageUrl = "http://espn.com/";
const headlineSelector = ".col-three .headlineStack li a";
const sportsSelector = "#global-nav ul.espn-en li.sports a";

const getSportsList = (document) => {
  const sports = [...document.querySelectorAll('#global-nav ul.espn-en li.sports a')].map(sport => {
    return {
      name: sport.innerText.trim().split("\n")[0],
      href: sport.href
    };
  }).filter(sport => {
    // Some filter hacks because our query for this isn't great
    const isEspnSite = sport.href?.split(".com/")[0] === "https://www.espn";
    const hasSingleRoute = sport.href?.split(".com/")[1]?.replace(/\/$/, "").split("/").length === 1;
    return isEspnSite && hasSingleRoute;
  }).filter((outterItem, index, originalArray) => {
    return originalArray.findIndex(innerItem => innerItem.href === outterItem.href) === index;
  }).sort((a, b) => a.title.localeCompare(b.title));
  return sports;
};

const fetchEspnData = async () => {
  const response = await axios.get(homepageUrl);
  const html = response.data;
  const $ = cheerio.load(html);

  const headlines = [];
  $(headlineSelector).each(function (i, elem) {
    const postDotComText = $(this).attr('href').replace(/^\//, "");
    const href = path.join(homepageUrl, postDotComText);
    headlines[i] = {
      title: $(this).text(),
      sport: postDotComText.split("/")[0],
      href,
      type: "headline",
    }
  });

  const sports = [];
  $(sportsSelector).each(function (i, elem) {
    const postDotComText = $(this).attr('href').replace(/^\//, "");
    const href = path.join(homepageUrl, postDotComText);
    sports[i] = {
      title: $(this).text().trim().split("\n")[0].toLowerCase(),
      href,
      type: "sport",
    }
  });

  return { headlines, sports };
}

const getInitialEspnData = async () => {
  const browser = await webkit.launch();
  const page = await browser.newPage();
  await page.goto(homepageUrl);
  const { headlines, sports } = await page.evaluate(() => {
    const headlineSelector = ".col-three .headlineStack li a";
    const headlineItems = [...document.querySelectorAll(headlineSelector)];
    const headlines = headlineItems.map(item => {
      const postDotComText = item.href.split(".com/")[1];
      return {
        sport: postDotComText.split("/")[0],
        title: item.innerText,
        href: item.href,
        type: "headline",
      };
    });
    const sportsSelector = "#global-nav ul.espn-en li.sports a";
    const sports = [...document.querySelectorAll(sportsSelector)].map(sport => {
      return {
        title: sport.innerText.trim().split("\n")[0],
        href: sport.href,
        type: "sport",
      };
    }).filter(sport => {
      // Some filter hacks because our query for this isn't great
      const isEspnSite = sport.href?.split(".com/")[0] === "https://www.espn";
      const hasSingleRoute = sport.href?.split(".com/")[1]?.replace(/\/$/, "").split("/").length === 1;
      return isEspnSite && hasSingleRoute;
    }).filter((outterItem, index, originalArray) => {
      return originalArray.findIndex(innerItem => innerItem.href === outterItem.href) === index;
    }).sort((a, b) => a.title.localeCompare(b.title));
    return { headlines, sports }
  });
  await browser.close();
  return { headlines, sports };
};

const rightPad = (string, length) => {
  if(length <= string.length) return string;
  return string + new Array(length - string.length + 1).join(" ");
};

const runCli = async () => {
  console.log("Thanks for consuming sports headlines responsibly!");
  console.log("Getting headlines...");
  const { headlines, sports } = await fetchEspnData();
  const options = [...headlines, ...sports];
  const choices = options.map(option => option.title);
  const prompt = new enquirer.Select({
    name: 'color',
    message: 'Select a headline to get article text or a sport to see headlines for that sport',
    choices
  });
  const selection = await prompt.run();
  const selectedOption = options.find(option => option.title === selection);
  if (selectedOption.type === "headline") {
    console.log("This is where I'd show you the whole article");
    // document.querySelectorAll(".article-body p") --> innerText
  }
  else if (selectedOption.type === "sport") {
    console.log(`This is where I'd show you headlines for ${selectedOption.title}`);
  }
  else {
    console.log("Thanks for using the ESPN cli!");
  }
}

runCli();
