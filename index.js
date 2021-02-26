import { webkit } from 'playwright';
import enquirer from 'enquirer';

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

const getInitialEspnData = async () => {
  const browser = await webkit.launch();
  const page = await browser.newPage();
  await page.goto('http://espn.com/');
  const { headlines, sports } = await page.evaluate(() => {
    const headlineItems = [...document.querySelectorAll('.col-three .headlineStack li a')];
    const headlines = headlineItems.map(item => {
      const postDotComText = item.href.split(".com/")[1];
      return {
        sport: postDotComText.split("/")[0],
        title: item.innerText,
        href: item.href,
        type: "headline",
      };
    });
    const sports = [...document.querySelectorAll('#global-nav ul.espn-en li.sports a')].map(sport => {
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

// const rightPad = (string, length) => {
//   const newString = string.slice();
//   while (newString.length < length) {
//     newString.push(" ");
//   }
//   return newString;
// }

const rightPad = (string, length) => {
  if(length <= string.length) return string;
  return string + new Array(length - string.length + 1).join(" ");
};

const logHeadlines = (headlines) => {
  const maxHeadlineLength = Math.max(...headlines.map(item => item.title.length + item.sport.length));
  // console.table(headlines);
  headlines.forEach((headline, i) => {
    console.log(`${i + 1}) [${headline.sport}] ${rightPad(headline.title, maxHeadlineLength)} --> ${headline.href}`);
  });
};

const runCli = async () => {
  console.log("Thanks for consuming sports headlines responsibly!");
  console.log("Getting headlines...");
  const { headlines, sports } = await getInitialEspnData();
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
