const urlQueue = require("./urlQueue");

async function main() {
  const queue = new urlQueue();

  const searchTerm = "junior software engineer";
  const siteList = [
    "https://apply.workable.com/*",
    "https://hired.com/job/*",
    "https://startup.jobs/*",
  ];

  const startTime = Date.now();

  const promises = siteList.map((site) => queue.getUrls(searchTerm, site));
  await Promise.all(promises);

  const endTime = Date.now();
  const totalTime = (endTime - startTime) / 60000; // convert from milliseconds to minutes

  console.log(`Total time: ${totalTime.toFixed(2)} minutes`);
}

main();

// todo: have a list of options we can tweak here in main.js
// i.e. params for google search, location list for filter, title list to exclude for filter, etc.
// have any tunable options here at the forefront and passed down to appropriate invocations
