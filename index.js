import enquirer from 'enquirer';
import axios from "axios";
import cheerio from "cheerio";
import boxen from "boxen";
import ora from "ora";

const homepageUrl = "https://espn.com/";
const headlineSelector = ".col-three .headlineStack li a";
const sportsSelector = "#global-nav ul li a";

const getPageContents = async (pageUrl) => {
  const response = await axios.get(pageUrl);
  const html = response.data;
  const $cheerioLoader = cheerio.load(html);
  return $cheerioLoader;
}

const getHeadlines = ($page) => {
  const headlines = [];
  $page(headlineSelector).each(function (i, elem) {
    const postDotComText = $page(this).attr('href');
    const url = new URL(postDotComText, homepageUrl);
    headlines[i] = {
      title: $page(this).text(),
      sport: postDotComText.split("/")[0],
      href: url.href,
      type: "headline",
    }
  });
  return headlines.filter(headline => !headline.href.includes("/insider/"));
};

const getSports = ($page) => {
  const sports = [];
  $page(sportsSelector).each(function (i, elem) {
    const postDotComText = $page(this).attr('href');
    const url = new URL(postDotComText, homepageUrl);
    sports[i] = {
      title: $page(this).text().trim().split("\n")[0].toLowerCase(),
      href: url.href,
      type: "sport",
    }
  });
  return sports;
}

const getArticleText = async (articleUrl) => {
  const response = await axios.get(articleUrl);
  const html = response.data;
  const $ = cheerio.load(html);

  const paragraphSelector = ".article-body p";
  const paragraphs = [articleUrl];
  $(paragraphSelector).each(function (i, elem) {
    paragraphs[i] = $(this).text();
  });
  return paragraphs.join("\n\n");
};

// TODO: add option for more sports
// TODO: add initial option to quit

const runCli = async () => {
  console.log("Thanks for consuming sports headlines responsibly!");
  const spinner = ora("Getting headlines...").start();
  const $homepage = await getPageContents(homepageUrl); // TODO: asynchronously get all headlines, sports, sport headlines (and articles?)
  spinner.succeed("ESPN headlines received");
  const homepageHeadlines = getHeadlines($homepage);
  const sports = getSports($homepage);

  const genericOptions = {
    HOMEPAGE_HEADLINES: { title: "see homepage headlines" },
    LIST_SPORTS: { title: "see headlines for specific sports" },
    EXIT: { title: "exit" },
  };
  const selectionTypes = {
    HEADLINE: "headline",
    SPORT: "sport"
  };

  let selection;
  let selectionTitle;
  let articleText;
  let currentPrompt;
  let exit = false;
  while(!exit) {
    if (selection?.title === genericOptions.EXIT.title) {
      exit = true;
      break;
    }
    if (!selection || selection.title === genericOptions.HOMEPAGE_HEADLINES.title) {
      currentPrompt = new enquirer.Select({
        name: 'color',
        message: 'Select a headline to get article text or a sport to see headlines for that sport',
        choices: [...homepageHeadlines.map(item => item.title), ...Object.values(genericOptions).map(choice => choice.title)]
      });
    }
    else if (selection.type === selectionTypes.SPORT) {
      const $sportPage = await getPageContents(selection.href);
      const sportHeadlines = getHeadlines($sportPage);
      const sportChoices = sportHeadlines.map(option => option.title);
      currentPrompt = new enquirer.Select({
        name: 'color',
        message: `Select a ${selection.title} headline to get article text`,
        choices: sportChoices
      });
    }
    else if (selection.type === selectionTypes.HEADLINE) {
      articleText = await getArticleText(selection.href);
      console.log(boxen(selection.href, { borderStyle: 'bold'}));
      console.log(boxen(articleText, { borderStyle: 'singleDouble'}));
      currentPrompt = new enquirer.Select({
        name: 'color',
        message: 'Done reading? What next?',
        choices: Object.values(genericOptions).map(choice => choice.title)
      });
      articleText = "";
    }

    selectionTitle = await currentPrompt.run();
    selection = Object.values(genericOptions).find(item => item.title === selectionTitle) || homepageHeadlines.find(item => item.title === selectionTitle) || sports.find(item => item.title === selectionTitle);
  }
  console.log("Thanks for using the ESPN cli!");
  return;

  // const options = [...homepageHeadlines, ...sports];
  // const choices = options.map(option => option.title);
  // const prompt = new enquirer.Select({
  //   name: 'color',
  //   message: 'Select a headline to get article text or a sport to see headlines for that sport',
  //   choices
  // });
  // const selection = await prompt.run();
  // const selectedOption = options.find(option => option.title === selection);
  // if (selectedOption.type === "headline") {
  //   const article = await getArticleText(selectedOption.href);
  //   console.log(boxen(selectedOption.href, { borderStyle: 'bold'}));
  //   console.log(boxen(article, { borderStyle: 'singleDouble'}));
  // }
  // else if (selectedOption.type === "sport") {
  //   console.log(`This is where I'd show you headlines for ${selectedOption.title}`);
  //   const $sportPage = await getPageContents(selectedOption.href);
  //   const sportHeadlines = getHeadlines($sportPage);
  //   const sportChoices = sportHeadlines.map(option => option.title);
  //   const sportPrompt = new enquirer.Select({
  //     name: 'color',
  //     message: `Select a ${selectedOption.title} headline to get article text`,
  //     choices: sportChoices
  //   });
  //   const sportHeadlineSelection = await sportPrompt.run();
  //   const selectedSportOption = sportHeadlines.find(option => option.title === sportHeadlineSelection);
  //   const sportArticle = await getArticleText(selectedSportOption.href);
  //   console.log(boxen(selectedSportOption.href, { borderStyle: 'bold'}));
  //   console.log(boxen(sportArticle, { borderStyle: 'singleDouble'}));
  // }
}

runCli();
