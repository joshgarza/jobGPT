const axios = require("axios");
require("dotenv").config();

const retrieveGoogleURLS = async (
  searchTerm,
  // exactTerm,
  // excludeTerm,
  // orTerms,
  site
) => {
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
            cr: "countryUS",
            q: searchTerm,
            start: start,
            dateRestrict: "d[1]",
            siteSearch: site,
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

  return urls;
};

module.exports = retrieveGoogleURLS;

// const exactTerm = "software engineer";
// const excludeTerm = "senior principal staff";
// const orTerms = "junior";
// const query = "california";
// // const siteList = ["https://simplify.jobs/*"];
// const siteList = [
//   "https://apply.workable.com/*",
//   "https://hired.com/job/*",
//   "https://startup.jobs/*",
//   "https://simplify.jobs/*",
// ];

// retrieveGoogleURLSforSearchTerm(
//   query,
//   exactTerm,
//   excludeTerm,
//   orTerms,
//   siteList[2]
// );
