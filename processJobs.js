const scraper = require("./scraper");
const {
  rankJobsByRelevance,
  giveLineByLineFeedback,
  offerResumeSuggestions,
} = require("./chatGPTRequest.js");
const fs = require("fs");

const searchTerm = "junior software engineer jobs in San Francisco";
const siteList = ["https://apply.workable.com/*", "https://hired.com/job/*"];

const filterByLocation = (jobList) => {
  const locationList = [
    "san francisco",
    "san jose",
    "palo alto",
    "mountain view",
    "sacramento",
    "oakland",
    "bay area",
    "california",
    "remote",
  ];

  return jobList.filter((job) => {
    if (job.response === null) return false;

    let location = job.response.job_location;

    if (location === null) return false;

    if (typeof location === "string") {
      location = location.toLowerCase();
      return locationList.some((loc) => location.includes(loc));
    }

    if (Array.isArray(location)) {
      return location.some((loc) => {
        if (typeof loc === "string") {
          return locationList.some((target) =>
            loc.toLowerCase().includes(target)
          );
        }
        return false;
      });
    }

    if (typeof location === "object") {
      return Object.values(location).some((value) => {
        if (typeof value === "string") {
          return locationList.some((target) =>
            value.toLowerCase().includes(target)
          );
        }
        return false;
      });
    }

    return false;
  });
};

const getJobUrls = async (searchTerm, siteList) => {
  let start = 1;
  let totalResults;
  let jobs = [];

  console.log("Initiating scraping...\n");
  for (const site of siteList) {
    console.log(`\nSearching: ${searchTerm} \nSite: ${site}\n`);
    const initialResult = await scraper(searchTerm, site, start);

    totalResults = initialResult.totalResults;

    jobs = [...jobs, ...initialResult.JSONjobs];
  }

  return jobs;
};

const sortJobsByRelevance = async (jobList) => {
  const MAX_RETRIES = 3; // Maximum number of retries per job

  const filteredJobs = filterByLocation(jobList);

  let jobsByRank = await Promise.all(
    filteredJobs.map(async (job) => {
      let rank, parsedRank;
      let retries = 0;

      while (retries < MAX_RETRIES) {
        try {
          rank = await rankJobsByRelevance(
            job.response.job_title,
            job.response.job_description
          );
          parsedRank = JSON.parse(rank);
          break; // If parsing is successful, break out of the loop
        } catch (error) {
          console.error("Received invalid JSON, retrying...", rank);
          retries++;
          if (retries === MAX_RETRIES) {
            console.error("Failed to get valid JSON after maximum retries");
            return;
          }
        }
      }

      return {
        ...job,
        grade: parsedRank.grade,
        reasoning: parsedRank.reasoning,
      };
    })
  );

  // Remove any undefined entries (jobs for which we received invalid JSON)
  jobsByRank = jobsByRank.filter((job) => job !== undefined);

  jobsByRank.sort((a, b) => b.grade - a.grade); // This will sort in descending order
  return jobsByRank;
};

const writeJobListings = async (sortedList) => {
  let jsonString = JSON.stringify(sortedList, null, 2); // convert JSON object to string with pretty print

  fs.writeFile("joblistings.json", jsonString, (err) => {
    if (err) {
      console.log("Error writing file", err);
    } else {
      console.log("Successfully wrote file");
    }
  });
};

getJobUrls(searchTerm, siteList)
  .then((unsortedJobList) =>
    sortJobsByRelevance(unsortedJobList).then((sortedList) =>
      writeJobListings(sortedList)
    )
  )
  .catch((error) => console.error(error));
