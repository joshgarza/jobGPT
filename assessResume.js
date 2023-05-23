const {
  rankJobsByRelevance,
  giveLineByLineFeedback,
  offerResumeSuggestions,
} = require("./chatGPTRequest.js");
require("dotenv").config();

const job_title = "Senior Front End Engineer";
const job_description = `Join Archive in our mission to change consumer behavior for the better. If you think humans buy too much stuff and throw too much away, then this problem is for you. We’re starting with fashion and expanding from there.

Archive is building an ‘operating system for resale’ that delivers a customized online secondhand marketplace site and the underlying infrastructure and operations to plug into all of the other facets of a brand’s global resale strategy.

About the role
As one of the first front-end engineers, you will be involved in the full product development cycle - speaking with customers, defining new features, breaking down and executing engineering tasks and owning entire pieces of our front-end product offering.
You will work closely with brands to bring their designs to life, contribute scalable components to our generic React template language, and oversee key infrastructure projects to improve an end-user’s experience.
From collaborating with a brand’s creative team to deploying a finished production web application, you’ll play a key role in every step of the launch process.
You'll work closely with the CTO to grow the engineering team and set the tone for the engineering culture.
About you
You’re excited about joining a small, early-stage team to build a successful company, not just a good product.
You have a passion for pixel-perfect user interface development and high quality user experience enabled by well architected software.
You take pride in creating experiences that are a joy to use and are excited to work on a team with a deep background in product design. This includes working with designers, conducting user research, and advocating for an end-user’s experience in engineering & product discussion.
You’re self-directed and comfortable building, shipping and maintaining products with real users, moving fast, and reacting quickly to a changing environment.
You are mission driven and love the fact that the better we do as a company, the less waste we’ll see in the world.
Skills / Experience
Professional experience building and shipping complete production web applications from the back-end to the front-end.
Fluent in Typescript, experience with React, Next.js, and NodeJS
Familiarity with PostgreSQL or other relational databases, and an understanding of database performance
Bonus: Experience with Vercel / Apollo Client / GraphQL
Bonus: Experience in eCommerce, marketplace or multi-tenant platform development
Bonus: Experience setting up and maintaining end-to-end integration and unit tests
Our stack
Frontend: Next.js + React + Redux + Apollo Client (Typescript), Firebase Auth
Backend: NodeJS (Typescript), Hasura GraphQL Engine
Database: Postgres
Infrastructure: Vercel, Render, Google Cloud
Collaboration: Github, Notion, Slack`;

// takes in arbitrary job title and description and outputs an edited resume

rankJobsByRelevance(job_title, job_description).then((result) => {
  const parsedResult = JSON.parse(result);
  console.log("Score:", parsedResult);
  // offerResumeSuggestions(parsedResult.grade, parsedResult.reasoning).then(
  //   (suggestions) => {
  //     console.log("Resume suggestions:", suggestions);
  //     giveLineByLineFeedback(suggestions, job_description).then((feedback) =>
  //       console.log("Line by line feedback:", feedback)
  //     );
  //   }
  // );
});
