const joblistings = require("./joblistings.json");
const fs = require("fs");

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

const craftPrompts = () => {
  const copyJobListings = [...joblistings];
  let my_title = "Full Stack Software Engineer";
  let industry = "tech";
  let job_description;
  let job_title;

  copyJobListings.map((job) => {
    job_description =
      job.response.job_description === "null" ||
      job.response.job_description === null
        ? "[[INSERT JOB DESCRIPTION]]"
        : job.response.job_description;
    job_title = job.response.job_title;
    job.resume_prompts = {};
    job.cover_letter_prompts = {};

    const resumePrompts = [
      `You are an expert resume writer with over 20 years of experience working with job seekers trying to land a role in the ${industry} industry. Highlight the 3 most important responsibilities in this job description: ${job_description}`,
      `Based on these 3 most important responsibilities from the job description, please tailor my resume for this ${job_title} position at [[INSERT COMPANY NAME]]. Do not make information up. Here's my resume: [[INSERT RESUME]]`,
      `List out the differences between my original resume and your suggested draft in table format with 2 columns: Original and Updated. Be specific and list out exactly what was changed, down to the exact wording.`,
    ];

    const coverLetterPrompts = [
      `Based on this job description, what is the biggest challenge someone in this position would face day-to-day? Give me the root cause of this issue. ${job_description}`,
      `You are currently working as a ${my_title} in the ${industry} industry and you're applying for this ${job_title} position at [[INSERT COMPANY NAME]]. Write an attention-grabbing hook for your cover letter that highlights your experience and qualifications in a way that shows you empathize and can successfully take on the challenges of the ${job_title} role. Consider incorporating specific examples of how you've tackled these challenges in your past work, and explore creative ways to express your enthusiasm for the opportunity. Keep your hook within 100 words`,
      `You are writing a cover letter applying for the ${job_title} role at [[INSERT COMPANY NAME]]. Here's what you have so far: [[INSERT HOOK RESPONSE]] - Finish writing the cover letter based on your resume and keep it within 250 words. Here’s your resume: [[INSERT RESUME]]`,
    ];

    resumePrompts.forEach((prompt, idx) => {
      job.resume_prompts = { ...job.resume_prompts, [idx]: prompt };
    });

    coverLetterPrompts.forEach((prompt, idx) => {
      job.cover_letter_prompts = { ...job.cover_letter_prompts, [idx]: prompt };
    });
  });

  writeJobListings(copyJobListings);
};

craftPrompts();
