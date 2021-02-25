import { webkit } from 'playwright';
import enquirer from 'enquirer';

const getSportsList = (document) => {
  const sports = [...document.querySelectorAll('#global-nav ul.espn-en li.sports a')].map(sport => {
    return {
      name: sport.innerText.trim().split("\n")[0],
      href: sport.href
    };
  }).filter(sport => {
    // Some filter hacks because the initial query for sports isn't great
    const isEspnSite = sport.href?.split(".com/")[0] === "https://www.espn";
    const hasSingleRoute = sport.href?.split(".com/")[1]?.replace(/\/$/, "").split("/").length === 1;
    return isEspnSite && hasSingleRoute;
  }).filter((outterItem, index, originalArray) => {
    return originalArray.findIndex(innerItem => innerItem.href === outterItem.href) === index;
  }).sort((a, b) => a.name.localeCompare(b.name));
  return sports;
};

const getHomepageHeadlines = () => {
  const headlineItems = [...document.querySelectorAll('.col-three .headlineStack li a')];
  return headlineItems.map(item => {
    const postDotComText = item.href.split(".com/")[1];
    return {
      sport: postDotComText.split("/")[0],
      text: item.innerText,
      href: item.href,
    };
  });
}

const getInitialEspnData = async () => {
  const browser = await webkit.launch();
  const page = await browser.newPage();
  await page.goto('http://espn.com/');
  const { headlines, sports } = await page.evaluate(() => {
    const headlines = getHomepageHeadlines(document);
    const sports = getSportsList(document);
    return { headlines, sports }
  });
  await browser.close();
  return { headlines, sports };
};

const rightPad = (string, length) => {
  const newString = string.slice();
  while (newString.length < length) {
    newString.push(" ");
  }
  return newString;
}

const logHeadlines = (headlines) => {
  const maxHeadlineLength = Math.max(headlines.map(item => item.text.length));
  // console.table(headlines);
  headlines.forEach((headline, i) => {
    console.log(`${i + 1}) [${headline.sport}] ${rightPad(headline.text, maxHeadlineLength)} --> ${headline.href}`);
  });
};

const runCli = async () => {
  console.log("Thanks for consuming sports headlines responsibly!");
  console.log("Getting headlines...");
  const { headlines, sports } = await getInitialEspnData();
  logHeadlines(headlines);
  console.table(sports);
  // const prompt = new enquirer.Select({
  //   name: 'color',
  //   message: 'Which sport would you like news about?',
  //   choices: sports.map(sport => sport.name)
  // });
  // const selectedSport = await prompt.run();
  // console.log(`Getting headlines for ${selectedSport}...jk`);
}

runCli();
