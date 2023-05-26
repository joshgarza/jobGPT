// * Build a queue class and keep adding urls we haven't applied to, processing them, and sending them off to OpenAI before outputting/reoutputting the list sorted by grade. can still batch 10 at a time. Somehow make it asynchronous so that once there is something in the queue, urls can continue to be added while processing the ones that were already in there.
const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

const joblistings = require("./joblistings.json");
const retrieveGoogleURLS = require("./googleSearch");
const { processUrls } = require("./scraper");
const filterJobs = require("./filterURLs");
const gradeJobsByRelevance = require("./gradeJobs");

class urlQueue {
  constructor() {
    this.queue = [];
    this.filteredJobs = [];
    this.gradedJobs = [];
    this.processed = 0;
    this.processing = false;
    this.grading = false;
    this.complete = 0;
  }

  logStatus() {
    console.log(
      `\nURLs in queue: ${this.queue.length}\nProcessed URLs: ${this.processed}\nFiltered URLs: ${this.filteredJobs.length}\nGraded Jobs: ${this.gradedJobs.length}\nCompleted: ${this.complete}`
    );
  }

  addURL(url) {
    this.queue.push(url);
  }

  addFilteredJobs(job) {
    this.filteredJobs.push(job);
  }

  addGradedJobs(job) {
    this.gradedJobs.push(job);
  }

  async getUrls(searchTerm, site) {
    const urls = await retrieveGoogleURLS(searchTerm, site);
    for (const url of urls) {
      this.addURL(url);
    }
    this.logStatus();

    if (!this.processing) {
      this.processing = true;
      console.log("Processing...");
      this.processUrls().then(() => {
        this.processing = false;
        this.logStatus();
      });
    }
  }

  async processUrls() {
    while (this.queue.length > 0) {
      const urls = this.queue.splice(0, 5); // remove the first 5 items from the queue
      const jobs = await processUrls(urls); // process these URLs
      const filteredJobs = filterJobs(jobs);
      console.log(`\nFiltered jobs remaining: ${filteredJobs.length}`);
      for (const job of filteredJobs) {
        this.addFilteredJobs(job);
      }

      // Start grading after processing and filtering each batch of URLs
      if (!this.grading) {
        this.grading = true;
        console.log("Grading...");
        this.gradeJobs().then(() => {
          this.grading = false;
          this.logStatus();
        });
      }
    }
    // Check if the queue and filteredJobs array are both empty
    if (this.queue.length === 0 && this.filteredJobs.length === 0) {
      await this.writeJobListings();
    }
  }

  async gradeJobs() {
    while (this.filteredJobs.length > 0) {
      const jobs = this.filteredJobs.splice(0, 5); // remove the first 5 items from the filteredJobs list
      const gradedJobs = await gradeJobsByRelevance(jobs); // grade these jobs
      for (const job of gradedJobs) {
        this.addGradedJobs(job);
      }
      this.gradedJobs.sort((a, b) => {
        return b.grade - a.grade;
      });
      console.log(this.gradedJobs);
      this.complete += jobs.length;
      this.logStatus();
    }
    // Check if the queue and filteredJobs array are both empty
    if (this.queue.length === 0 && this.filteredJobs.length === 0) {
      await this.writeJobListings();
    }
  }

  async writeJobListings() {
    let jsonString = JSON.stringify(sortedList, null, 2); // convert JSON object to string with pretty print

    fs.writeFile("joblistings.json", jsonString, (err) => {
      if (err) {
        console.log("Error writing file", err);
      } else {
        console.log("Successfully wrote file");
      }
    });
  }
}

module.exports = urlQueue;

// steps
// gather urls
// process urls 10 at a time (create job object for each url)
// filter out poor urls (bad matches)
// grade filtered urls
// sort by grade
// add chatgpt prompts to each url
