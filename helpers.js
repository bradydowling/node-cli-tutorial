import axios from "axios";
import cheerio from "cheerio";

const homepageUrl = "https://espn.com/";
const headlineSelector = ".col-three .headlineStack li a";
const sportsSelector = "#global-nav ul li a";

export const getPageContents = async (pageUrl) => {
  const response = await axios.get(pageUrl);
  const html = response.data;
  const $cheerioLoader = cheerio.load(html);
  return $cheerioLoader;
}

export const getHeadlines = ($page) => {
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

export const getSports = ($page) => {
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
  return sports.filter(sport => {
    const pathname = new URL(sport.href).pathname;
    const hasSingleRoute = pathname.replace(/^\//, "").replace(/\/$/, "").split("/").length === 1;
    const isEspn = new URL(sport.href).hostname === "espn.com";
    return isEspn && hasSingleRoute && pathname.length > 1;
  });
}

export const getArticleText = async (articleUrl) => {
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
