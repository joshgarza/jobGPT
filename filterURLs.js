const filterByResponse = (jobList) => {
  return jobList.filter((job) => {
    try {
      if (!job.hasOwnProperty("response") || job.response === null) {
        return false;
      }

      const response = job.response;

      // Check that response has all necessary properties
      const requiredProps = ["job_location", "job_title", "job_description"];
      for (const prop of requiredProps) {
        if (!response.hasOwnProperty(prop)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error(`Error processing job response: ${error}`);
      return false; // return false if you want to discard the job in case of an error
    }
  });
};

const filterByTitle = (jobList) => {
  const titleList = ["senior", "staff", "principal", "project manager"];

  return jobList.filter((job) => {
    try {
      if (job.response === null) return false;

      let title = job.response.job_title;

      if (title === null) return false;

      if (typeof title === "string") {
        title = title.toLowerCase();
        return !titleList.some((loc) => title.includes(loc));
      }

      if (Array.isArray(title)) {
        return !title.some((loc) => {
          if (typeof loc === "string") {
            return titleList.some((target) =>
              loc.toLowerCase().includes(target)
            );
          }
          return false;
        });
      }

      if (typeof title === "object") {
        return !Object.values(title).some((value) => {
          if (typeof value === "string") {
            return titleList.some((target) =>
              value.toLowerCase().includes(target)
            );
          }
          return false;
        });
      }

      return true;
    } catch (error) {
      console.error(`Error processing job title: ${error}`);
      return false; // return false if you want to discard the job in case of an error
    }
  });
};

const filterByLocation = (jobList) => {
  const locationList = [
    "san francisco",
    "san jose",
    "palo alto",
    "mountain view",
    "sacramento",
    "berkeley",
    "oakland",
    "bay area",
    "california",
    "san ramon",
    "remote",
  ];

  return jobList.filter((job) => {
    try {
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
    } catch (error) {
      console.error(`Error processing job location: ${error}`);
      return false; // return false if you want to discard the job in case of an error
    }
  });
};

const filterJobs = (jobList) => {
  let filteredJobs = filterByResponse(jobList);
  filteredJobs = filterByTitle(filteredJobs);
  filteredJobs = filterByLocation(filteredJobs);
  return filteredJobs;
};

module.exports = filterJobs;
