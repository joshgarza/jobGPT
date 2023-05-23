const axios = require("axios");
const fs = require("fs");
// const resume = fs.readFileSync("./editedResume.txt", "utf8");
const resume = fs.readFileSync("./resume.txt", "utf8");

let backoffTime = 2000; // start with 1 second
const maxBackoffTime = 32000; // Maximum backoff time in milliseconds
const maxAttempts = 5; // Maximum number of attempts

async function makeRequest(data) {
  const apiUrl = "https://api.openai.com/v1/chat/completions";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await axios.post(apiUrl, data, { headers });
      backoffTime = 2000; // reset backoff time if request is successful
      return result.data.choices[0].message.content;
    } catch (error) {
      console.log(
        `\nRequest failed (attempt ${attempt}).\nError log: ${error}\nWaiting ${backoffTime}ms before next attempt.\n`
      );
      await new Promise((resolve) => setTimeout(resolve, backoffTime));
      backoffTime = Math.min(backoffTime * 2, maxBackoffTime); // double backoff time for next attempt, up to a maximum
    }
  }

  throw new Error("Max retry attempts reached. Request failed.");
}

const parseJobInformation = async (scrapedText) => {
  console.log(`Parsing job information...`);
  const data = {
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "Your job is parse job information from job descriptions in JSON format.",
      },
      {
        role: "user",
        content: `Your response should only be valid JSON. Fill in the following values and use the exact property names listed: job_location, job_title, job_description, company_description, and compensation. If you cannot find a piece of information, fill in the value as null. For the job location, only save the value as a string, NOT as an inner object. Here is a job opening: ${scrapedText}`,
      },
    ],
    temperature: 0,
  };

  return await makeRequest(data);
};

const rankJobsByRelevance = async (job_title, job_description) => {
  console.log(`Ranking jobs by relevance...`);
  const data = {
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are a highly critical hiring manager with 20 years of experience in the tech industry. Your reputation is built on setting extremely high standards. When reviewing a candidate's resume, you are known for giving low scores unless the fit with the job description is perfect.",
      },
      {
        role: "user",
        content: `Grade this candidates resume based on the job title and job description. Your response should be an integer between 1 - 100. \n\nJob title: ${job_title}\n\n Job description: ${job_description}\n\n My resume:${resume}`,
      },
      {
        role: "user",
        content:
          'Parse the final response into a JSON object with properties "grade" and "reasoning".',
      },
    ],
    temperature: 0,
  };

  return await makeRequest(data);
};

const offerResumeSuggestions = async (grade, reasoning) => {
  console.log(`Writing resume suggestions...`);
  const data = {
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are a career counselor with 20 years of experience helping job seekers improve their resumes. Your goal is to provide constructive suggestions to help a candidate increase their resume score.",
      },
      {
        role: "user",
        content: `The candidate's resume was given a grade of ${grade} with the following reasoning: ${reasoning}. Based on this information, how can the resume be improved?`,
      },
    ],
    temperature: 0,
  };

  return await makeRequest(data);
};

const giveLineByLineFeedback = async (suggestions, job_description) => {
  console.log(`Creating line by line resume feedback...`);
  const data = {
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are a career counselor with 20 years of experience helping job seekers improve their resumes. Your goal is to provide specific alterations to a candidate's resume based on suggestions you have generated.",
      },
      {
        role: "user",
        content: `You have generated these suggestions: ${suggestions} based on this job description: ${job_description}. Rewrite the candidates resume based on your expert opinion. Do not lie about any projects or experience the candidate does not explicitly state in their resume. Candidates resume: ${resume}.`,
      },
    ],
    temperature: 0,
  };

  return await makeRequest(data);
};

module.exports = {
  offerResumeSuggestions,
  giveLineByLineFeedback,
  parseJobInformation,
  rankJobsByRelevance,
};
