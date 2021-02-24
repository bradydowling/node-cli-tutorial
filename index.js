import { webkit } from 'playwright';
import enquirer from 'enquirer';

const getEspnHeadlines = async () => {
  const browser = await webkit.launch();
  const page = await browser.newPage();
  await page.goto('http://espn.com/');
  const headlines = await page.evaluate(() => {
    const headlineItems = [...document.querySelectorAll('.col-three .headlineStack li a')];
    return headlineItems.map(item => {
      const postDotComText = item.href.split(".com/")[1];
      return {
        text: item.innerText,
        href: item.href,
        sport: postDotComText.split("/")[0]
      }
    });
  });
  await browser.close();
  return headlines;
};

const prompt = new enquirer.Select({
  name: 'color',
  message: 'Which sport would you like news about?',
  choices: ['dev', 'qat', 'stg']
});

const runCli = async () => {
  console.log("Thanks for consuming sports headlines responsibly!");
  console.log("Getting headlines...");
  const headlines = await getEspnHeadlines();
  headlines.forEach((headline, i) => {
    console.log(`${i}) [${headline.sport}] ${headline.text} --> ${headline.href}`);
  });
  const sport = await prompt.run();
  console.log(`Getting headlines for ${sport}...jk`);
}

runCli();
