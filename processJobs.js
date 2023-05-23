const scraper = require("./scraper");
const { rankJobsByRelevance } = require("./chatGPTRequest.js");

const searchTerm = "junior software engineer jobs in San Francisco";
const site = "https://apply.workable.com/*";

const filterByLocation = (jobList) => {
  const locationList = [
    "san francisco",
    "san jose",
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

async function getJobs(searchTerm, site) {
  let start = 1;
  let totalResults;
  let jobs = [];
  console.log("Initiating scraping...");
  const initialResult = await scraper(searchTerm, site, start);
  totalResults = initialResult.totalResults;
  console.log(
    `Parsed results ${start} through ${start + 9} out of ${totalResults}`
  );
  jobs = [...jobs, ...initialResult.JSONjobs];

  start += 10;

  while (start <= totalResults) {
    const result = await scraper(searchTerm, site, start);
    jobs = [...jobs, ...result.JSONjobs];
    console.log(
      `Parsed results ${start} through ${start + 9} out of ${totalResults}`
    );
    start += 10;
  }

  return jobs;
}
// filteredJobs = [
//   {
//     url: "https://apply.workable.com/regatta-solutions-group-inc/j/6F38AD7F39",
//     response: {
//       job_title: "Senior SailPoint Solutions Architect/Team Lead",
//       job_location: "remoteSan Francisco, California, United States",
//       job_description:
//         "We have an immediate opening for an experienced Senior SailPoint Solutions Architect/Team Lead who will both develop and lead development activities, enhancements, fixes or new technologies to support Identity and Access Management (IAM) platforms that meet business requirements, policies, and standards. This role requires extensive background and experience in software development as well as an ability to lead a technical team and ensure appropriate visibility, communication, and governance across key business partners and stakeholders...",
//       company_description: null,
//       compensation: null,
//     },
//   },
//   {
//     url: "https://apply.workable.com/coursestorm/j/C606DECFC3/",
//     response: {
//       job_location: "remoteMaine, United States",
//       job_title: "Senior Software Engineer",
//       job_description:
//         "CourseStorm streamlines access to education by providing powerful class registration, enrollment management, and marketing tools that are simple for learners and educators to use. We’ve already connected over 1,000,000 students with education – and we’re growing fast. We’re seeking a motivated, curious, and skilled software engineer to help us build the future of our platform and amplify the impact we can have...",
//       company_description:
//         "We believe that everyone is needed to build a better world through education and we are actively working to hire a diverse staff. The unique experiences, perspectives, and talents of our team members aren’t accessories – they are instrumental to our success and the impact we make...",
//       compensation: null,
//     },
//   },
//   {
//     url: "https://apply.workable.com/huggingface/",
//     response: {
//       job_location: "Remote",
//       job_title: "Machine Learning Engineer, Multimodal Generation",
//       job_description:
//         "We are looking for a Machine Learning Engineer to help us with Multimodal Generation. As a Machine Learning Engineer, you will be responsible for designing and implementing machine learning models for multimodal generation purposes.",
//       company_description:
//         "Our mission is to democratize good machine learning. At Hugging Face, we build open-source resources to empower you to easily integrate AI into your products and workflows. We value diversity, equity, and inclusivity. We are actively working to build a workplace where people feel respected and supported regardless of their background. We provide our employees with reimbursement for relevant conferences, training, and education. We offer flexible working hours and remote options as well as unlimited PTO; health, dental, and vision benefits for employees and their dependents; and 20 weeks of parental leave. We have an equal opportunity employment policy. ",
//       compensation: null,
//     },
//   },
// ];

async function filterAndSortJobs(filteredJobs) {
  const MAX_RETRIES = 3; // Maximum number of retries per job

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
}

// const sortedJobs = filterAndSortJobs(filteredJobs);
// sortedJobs.then((sorted) => console.log(sorted));

getJobs(searchTerm, site)
  .then((jobs) => {
    // console.log("All jobs:", jobs);
    const filteredJobs = filterByLocation(jobs);
    console.log("Filtered jobs:", filteredJobs);
    const sortedJobs = filterAndSortJobs(filteredJobs);
    sortedJobs.then((sorted) => {
      console.log("Sorted jobs:", sortedJobs);
    });
  })
  .catch((error) => console.error(error));
