const fetch = require("node-fetch");
// import axios from "axios";
const axios = require("axios");
// import util from "util";
const util = require("util");
// import fs from "fs";
const fs = require("fs");

/** Turning a callback kind of function to a promise */
const writeFile = util.promisify(fs.writeFile);

/** Method to save data as json to a file */
const writeFileAsJSON = async (data, path) => {
  let jsonContent = JSON.stringify(data);
  const err = await writeFile(path, jsonContent, "utf8");
  if (err) {
    console.log("errWritingTodFixtures::", err);
    return false;
  }
  console.log("todays fixtures written..");
  return true;
};

const option = {
  method: "GET",
  headers: {
    "X-RapidAPI-Key": "33f9653174mshefc4be967757e8ap144d7ejsn5a2eea54acd1",
    "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
  },
};

fetch(
  "https://api-football-v1.p.rapidapi.com/v3/fixtures?date=2023-01-31&timezone=Africa/Lagos",
  option
)
  .then((response) => response.json())
  .then(async (response) => {
    // console.log(response);
    await writeFileAsJSON(response, `2023-02-01-node-fetch.json`);
  })
  .catch((err) => console.error(err));

/** Axiso Version */
const options = {
  method: "GET",
  url: "https://api-football-v1.p.rapidapi.com/v3/fixtures",
  params: { date: "2023-01-31" },
  headers: {
    "X-RapidAPI-Key": "33f9653174mshefc4be967757e8ap144d7ejsn5a2eea54acd1",
    "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
  },
};

axios
  .request(options)
  .then(async function (response) {
    // console.log(response.data);
    await writeFileAsJSON(response.data, `${options.params.date}.json`);
  })
  .catch(function (error) {
    console.error(error);
  });
