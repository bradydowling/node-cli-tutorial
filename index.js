import ora from "ora";
import enquirer from 'enquirer';
import {
  getArticleText,
  getHeadlines,
  getPageContents,
  getSports,
} from "@rwxdev/espn";

const homepageUrl = "https://espn.com/";

const runCli = async () => {
  console.log("Thanks for consuming sports headlines responsibly!");
  const spinner = ora("Getting headlines...").start();
  const $homepage = await getPageContents(homepageUrl);
  spinner.succeed("ESPN headlines received");
  const sports = getSports($homepage);
  const headlinesBySport = {};
  for (let sport of sports) {
    getPageContents(sport.href).then(($sportPage) => {
      const headlines = getHeadlines($sportPage);
      headlinesBySport[sport.title] = headlines;
    }).catch((e) => {
      console.log("there was an issue getting headlines for a certain sport", e);
    });
  }

  const selectionTypes = {
    HEADLINE: "headline",
    SPORT: "sport",
    MORE: "more"
  };
  const genericOptions = {
    HOMEPAGE_HEADLINES: { title: "see homepage headlines" },
    LIST_SPORTS: { title: "see headlines for specific sports", type: selectionTypes.MORE },
    OTHER_SPORTS: { title: "see headlines for other sports", type: selectionTypes.MORE },
    EXIT: { title: "exit" },
  };

  let selection;
  let selectionTitle;
  let articleText;
  let currentPrompt;
  let exit = false;
  while(!exit) {
    if (!selection || selection.title === genericOptions.HOMEPAGE_HEADLINES.title) {
      currentPrompt = new enquirer.Select({
        name: "homepage",
        message: "What story shall we read?",
        choices: [...homepageHeadlines.map(item => item.title), genericOptions.LIST_SPORTS.title, genericOptions.EXIT.title]
      });
    }
    else if (selection.type === selectionTypes.MORE) {
      currentPrompt = new enquirer.Select({
        name: "sports",
        message: "Which sport would you like headlines for?",
        choices: sports.map(choice => choice.title)
      });
    }
    else {
      exit = true;
      break;
    }
    selectionTitle = await currentPrompt.run();
    const combinedSportHeadlines = Object.values(headlinesBySport).reduce((accumulator, item) => {
      return [...accumulator, ...item];
    }, [])
    const allOptions = [...Object.values(genericOptions), ...homepageHeadlines, ...sports, ...combinedSportHeadlines];
    selection = allOptions.find(item => item.title === selectionTitle);
  }
  console.log("Thanks for using the ESPN cli!");
  return;
}

runCli();
