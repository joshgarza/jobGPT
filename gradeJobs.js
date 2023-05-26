const { rankJobsByRelevance } = require("./chatGPTRequest.js");
const fs = require("fs");
const joblistings = require("./joblistings.json");

const gradeJobsByRelevance = async (filteredJobs) => {
  const MAX_RETRIES = 3; // Maximum number of retries per job
  const BATCH_SIZE = 10; // Size of each batch of jobs to process

  // Split filteredJobs into batches of BATCH_SIZE
  let batches = [];
  for (let i = 0; i < filteredJobs.length; i += BATCH_SIZE) {
    batches.push(filteredJobs.slice(i, i + BATCH_SIZE));
  }

  let jobsByRank = [];
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(
      `Grading jobs ${i * BATCH_SIZE + 1} through ${
        (i + 1) * BATCH_SIZE
      } based on relevance with OpenAI`
    );

    const batchResults = await Promise.all(
      batch.map(async (job) => {
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

    // Add the processed batch to jobsByRank
    jobsByRank = [...jobsByRank, ...batchResults];
  }

  return jobsByRank;
};

module.exports = gradeJobsByRelevance;
