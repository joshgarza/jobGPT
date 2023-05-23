const axios = require("axios");
const fs = require("fs");
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
      console.log("Making request to OpenAI");
      const result = await axios.post(apiUrl, data, { headers });
      backoffTime = 2000; // reset backoff time if request is successful
      return result.data.choices[0].message.content;
    } catch (error) {
      console.log(
        `Request failed (attempt ${attempt}). Waiting ${backoffTime}ms before next attempt.`
      );
      await new Promise((resolve) => setTimeout(resolve, backoffTime));
      backoffTime = Math.min(backoffTime * 2, maxBackoffTime); // double backoff time for next attempt, up to a maximum
    }
  }

  throw new Error("Max retry attempts reached. Request failed.");
}

const parseJobInformation = async (scrapedText) => {
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
  };

  return await makeRequest(data);
};

const rankJobsByRelevance = async (job_title, job_description) => {
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
  };

  return await makeRequest(data);
};

module.exports = {
  parseJobInformation,
  rankJobsByRelevance,
};
