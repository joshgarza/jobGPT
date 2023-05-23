const axios = require("axios");
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

const {
  eliminateBadMatches,
  parseJobInformation,
} = require("./chatGPTRequest.js");

require("dotenv").config();

async function getHTML(url) {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });
  const html = await page.content(); // serialized HTML of page DOM.
  await browser.close();
  return html;
}

const retrieveGoogleURLSforSearchTerm = async (searchTerm, start) => {
  if (!searchTerm) {
    throw new Error("Search term and site must be provided");
  }

  const response = await axios.get(
    "https://www.googleapis.com/customsearch/v1",
    {
      params: {
        key: process.env.GOOGLE_API_KEY,
        cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
        q: searchTerm,
        start: start,
      },
    }
  );

  const totalResults = response.data.searchInformation.totalResults;
  const searchResults = response.data.items;
  let urls = [];

  if (searchResults) {
    urls = searchResults.map((result) => result.link);
  } else {
    console.error("No search results returned from Google API");
  }

  return { urls, totalResults };
};

const stripHtmlTags = (html) => {
  const $ = cheerio.load(html);
  return $.text();
};

const JSONjobs = [];

module.exports = async (searchTerm, site, start) => {
  const { urls, totalResults } = await retrieveGoogleURLSforSearchTerm(
    `${searchTerm} site:${site}`,
    start
  );
  console.log(urls);

  let promises = [];

  for (const url of urls) {
    await new Promise((resolve) => setTimeout(resolve, 20));

    promises.push(
      new Promise(async (resolve, reject) => {
        try {
          const html = await getHTML(url);
          const $ = cheerio.load(html);
          $("script").remove();
          const bodyText = stripHtmlTags($("body").text());
          const parsedJobInfo = await parseJobInformation(bodyText);

          // Verify if parsedJobInfo is a valid JSON string
          let jobObject;

          try {
            jobObject = {
              url: url,
              response: JSON.parse(parsedJobInfo),
            };

            console.log("pushing a new job");
            JSONjobs.push(jobObject);
          } catch (error) {
            console.error("Invalid JSON string:", parsedJobInfo);
            // Do not reject the promise here as you still want to process other URLs
            jobObject = { url: url, response: null };
          }

          resolve(jobObject);
        } catch (error) {
          console.error(error);
          reject(error);
        }
      })
    );
  }

  return Promise.all(promises).then(() => {
    return { JSONjobs, totalResults };
  });
};
