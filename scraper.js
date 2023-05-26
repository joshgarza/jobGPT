const axios = require("axios");
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

const { parseJobInformation } = require("./chatGPTRequest.js");

require("dotenv").config();

const getHTML = async (url) => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });
  const html = await page.content(); // serialized HTML of page DOM.
  await browser.close();
  return html;
};

const stripHtmlTags = (html) => {
  const $ = cheerio.load(html);
  return $.text();
};

const retrieveGoogleURLSforSearchTerm = async (searchTerm) => {
  console.log("Searching...\n");
  if (!searchTerm) {
    throw new Error("Search term and site must be provided");
  }

  let start = 1;
  let totalResults;
  let urls = [];
  let resultsRemaining = true;

  while (resultsRemaining) {
    try {
      const response = await axios.get(
        "https://www.googleapis.com/customsearch/v1",
        {
          params: {
            key: process.env.GOOGLE_API_KEY,
            cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
            q: searchTerm,
            start: start,
            dateRestrict: "d[1]",
          },
        }
      );

      totalResults = urls.length;
      const searchResults = response.data.items;

      if (searchResults) {
        console.log("Results found!");
        urls = [...urls, ...searchResults.map((result) => result.link)];
      } else {
        resultsRemaining = false;
        console.error("No search results returned from Google API\n");
      }

      start += 10;
      // Add delay between requests (500 ms in this case)
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error making request", error.message);
      // If there is an error, break out of the loop.
      break;
    }
  }

  return { urls, totalResults };
};

const JSONjobs = [];

const processUrl = async (url, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const html = await getHTML(url);
      const $ = cheerio.load(html);
      $("script").remove();
      const bodyText = stripHtmlTags($("body").text());
      const parsedJobInfo = await parseJobInformation(bodyText);
      let jobObject;

      try {
        jobObject = {
          url: url,
          response: JSON.parse(parsedJobInfo),
        };
        console.log(`Processed URL: ${url}`);
        JSONjobs.push(jobObject);
        return jobObject;
      } catch (error) {
        console.error(`\nInvalid JSON string: ${parsedJobInfo}\n`);
        jobObject = { url: url, response: null };
        // if (i === retries - 1) throw error; // If it's the last retry, throw the error.
      }
    } catch (error) {
      console.error(error);
      // if (i === retries - 1) throw error; // If it's the last retry, throw the error.
    }
  }
};

const processUrls = async (urls) => {
  const jobs = [];

  // Process URLs in batches of 10
  for (let i = 0; i < urls.length; i += 10) {
    console.log(
      `\nBatching requests ${i + 1} through ${i + 10} to OpenAI...\n`
    );
    const batch = urls.slice(i, i + 10); // get a batch of 10 URLs
    const batchJobs = await Promise.all(batch.map((url) => processUrl(url)));
    jobs.push(...batchJobs); // add the batch jobs to the total jobs
  }

  return jobs;
};

module.exports = { processUrls };

// module.exports = async (searchTerm, site, start) => {
//   const { urls, totalResults } = await retrieveGoogleURLSforSearchTerm(
//     `${searchTerm} site:${site}`,
//     start
//   );
//   console.log(`Total Results: ${totalResults}\n`);
//   console.log(`Results from search:\n`);
//   console.log(urls);

//   const jobs = await processUrls(urls);

//   return { JSONjobs: jobs, totalResults };
// };
