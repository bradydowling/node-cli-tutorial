import { webkit } from 'playwright';
import enquirer from 'enquirer';

const getEspnHeadlines = async () => {
  const browser = await webkit.launch();
  const page = await browser.newPage();
  await page.goto('http://espn.com/');
  const headlines = await page.evaluate(() => {
    const headlineItems = [...document.querySelectorAll('.headlineStack li a')];
    return headlineItems.map(item => item.innerText);
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
  console.log(headlines.join("\n"));
  const sport = await prompt.run();
  console.log(`Getting headlines for ${sport}...jk`);
}

runCli();
