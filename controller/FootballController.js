const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const mjml2html = require("mjml");
const Handlebars = require("handlebars");
const sendEmail = require("../utils/emails");
const mongoose = require("mongoose");
const BundleCategory = require("../models/BundleCategory");
const Joi = require("joi");
const Bundle = require("../models/Bundle");
const Subscription = require("../models/Subscription");
const _ = require("lodash");
const {
  sendPushNotificationViaOneSignal,
} = require("../utils/pushNotification");
const Transaction = require("../models/Transaction");
const moment = require("moment");
const path = require("path");
const UserTip = require("../models/UserTip");
const NewsAPI = require("newsapi");
const newsapi = new NewsAPI("288dab4caa624cf79daa72343e130de4");
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");
const axios = require("axios");
const { json } = require("express");

/***
 *
 *
 * @returns {{getAllLeagues: getAllLeagues}}
 * @constructor
 *
 * TO DO:
 * convert getLeagues and getNewsSources to helper functions
 */

function FootballController() {
  const getAllLeagues = (req, res) => {
    const options = {
      method: "GET",
      url: `${process.env.API_FOOTBALL_URL}/leagues`,
      headers: {
        "X-RapidAPI-Key": `${process.env.API_FOOTBALL_KEY}`,
        "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
      },
    };

    axios
      .request(options)
      .then(function (response) {
        let leagues = response.data;
        console.log(response.data);
        fs.writeFile(
          "./storage/leagues/all-leagues.json",
          JSON.stringify(leagues),
          (err) => {
            if (err) {
              // throw err;
              res.send({
                status: "error",
                message: err.toString(),
              });
            }
            console.log("Appended to file");
            res.send({
              status: "success",
              message: leagues,
            });
          }
        );
      })
      .catch(function (error) {
        console.error(error);
      });
  };

  const getLeaguesById = (req, res) => {
    const { id } = req.params;

    const options = {
      method: "GET",
      url: "https://api-football-v1.p.rapidapi.com/v3/leagues",
      params: { id: id },
      headers: {
        "X-RapidAPI-Key": "33f9653174mshefc4be967757e8ap144d7ejsn5a2eea54acd1",
        "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
      },
    };

    axios
      .request(options)
      .then(function (response) {
        console.log(response.data);
        res.send({
          status: "success",
          message: response.data,
        });
      })
      .catch(function (error) {
        res.send({
          status: "error",
          message: error.toString(),
        });
      });
  };

  const leagueByTeamId = (req, res) => {
    const { id } = req.params;

    const options = {
      method: "GET",
      url: "https://api-football-v1.p.rapidapi.com/v3/leagues",
      params: { team: id },
      headers: {
        "X-RapidAPI-Key": "33f9653174mshefc4be967757e8ap144d7ejsn5a2eea54acd1",
        "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
      },
    };

    axios
      .request(options)
      .then(function (response) {
        console.log(response.data);
        res.send({
          status: "success",
          data: response.data,
        });
      })
      .catch(function (error) {
        console.error(error);
      });
  };

  const leagueBySeason = (req, res) => {
    const { season } = req.params;

    const options = {
      method: "GET",
      url: "https://api-football-v1.p.rapidapi.com/v3/leagues",
      params: { season: season },
      headers: {
        "X-RapidAPI-Key": "33f9653174mshefc4be967757e8ap144d7ejsn5a2eea54acd1",
        "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
      },
    };

    axios
      .request(options)
      .then(function (response) {
        console.log(response.data);
        res.send({
          status: "success",
          data: response.data,
        });
      })
      .catch(function (error) {
        console.error(error);
      });
  };

  const getAllFixtures = (req, res) => {
    const options = {
      method: "GET",
      url: "https://api-football-v1.p.rapidapi.com/v3/fixtures",
      params: { date: "2021-01-29" },
      headers: {
        "X-RapidAPI-Key": "33f9653174mshefc4be967757e8ap144d7ejsn5a2eea54acd1",
        "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
      },
    };

    axios
      .request(options)
      .then(function (response) {
        console.log(response.data);
        res.send({
          status: "success",
          data: response.data,
        });
      })
      .catch(function (error) {
        console.error(error);
      });
  };

  const getCurrentRound = (req, res) => {
    const { league } = req.params;

    const d = new Date();
    let year = d.getFullYear();

    const options = {
      method: "GET",
      url: "https://api-football-v1.p.rapidapi.com/v3/fixtures/rounds",
      params: { league: `${league}`, season: `${year}`, current: "true" },
      headers: {
        "X-RapidAPI-Key": "33f9653174mshefc4be967757e8ap144d7ejsn5a2eea54acd1",
        "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
      },
    };

    axios
      .request(options)
      .then(function (response) {
        console.log(response.data);
        fs.writeFile(
          "./storage/fixtures/current-round.json",
          JSON.stringify(response.data),
          (err) => {
            if (err) {
              // throw err;
              res.send({
                status: "error",
                message: err.toString(),
              });
            }
            console.log("Appended to file");
            res.send({
              status: "success",
              message: response.data,
            });
          }
        );
      })
      .catch(function (error) {
        console.error(error);
      });
  };

  const currentFixtures = (req, res) => {
    const { league } = Number(req.params);

    let today = new Date();
    let yesterday = new Date(today);
    let tomorrow = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let year = today.getFullYear();

    console.log("Year: ", year);

    // yesterday = yesterday.toString().substring(0, 5);
    // today = today.toDateString();
    // tomorrow = tomorrow.toDateString();

    // res.send({
    //     yesterday: yesterday,
    //     today: today,
    //     tomorrow: tomorrow
    // })
    tomorrow = tomorrow
      .toISOString()
      .substring(0, tomorrow.toISOString().indexOf("T"));
    yesterday = yesterday
      .toISOString()
      .substring(0, yesterday.toISOString().indexOf("T"));

    const options = {
      method: "GET",
      url: "https://api-football-v1.p.rapidapi.com/v3/fixtures",
      // params: {league: league, season: `${year}`, from: yesterday, to: tomorrow},
      params: { season: "2022", from: "2022-11-13", to: "2022-11-15" },
      headers: {
        "X-RapidAPI-Key": "33f9653174mshefc4be967757e8ap144d7ejsn5a2eea54acd1",
        "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
      },
    };

    axios
      .request(options)
      .then(function (response) {
        console.log(response.data);
        fs.writeFile(
          "./storage/fixtures/current-fixtures.json",
          JSON.stringify(response.data),
          (err) => {
            if (err) {
              // throw err;
              res.send({
                status: "error",
                message: err.toString(),
              });
            }
            console.log("Appended to file");
            res.send({
              status: "success",
              message: response.data,
            });
          }
        );
      })
      .catch(function (error) {
        console.error(error);
      });
  };

  const nextFixtures = (req, res) => {
    const count = req.params?.count;

    const options = {
      method: "GET",
      url: "https://api-football-v1.p.rapidapi.com/v3/fixtures",
      params: { next: count },
      headers: {
        "X-RapidAPI-Key": "33f9653174mshefc4be967757e8ap144d7ejsn5a2eea54acd1",
        "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
      },
    };

    axios
      .request(options)
      .then(function (response) {
        console.log(response.data);
        fs.writeFile(
          "./storage/fixtures/next-50-fixtures.json",
          JSON.stringify(response.data),
          (err) => {
            if (err) {
              // throw err;
              res.send({
                status: "error",
                message: err.toString(),
              });
            }
            console.log("Appended to file");
            res.send({
              status: "success",
              message: response.data,
            });
          }
        );
      })
      .catch(function (error) {
        console.error(error);
      });
  };

  const yesterdayFixtures = (req, res) => {
    fs.readFile("./storage/fixtures/yesterday-fixtures.json", (err, data) => {
      if (err)
        res.send({
          status: "error",
          message: err.toString(),
        });

      let news = JSON.parse(data);

      res.send({
        status: "success",
        data: news,
      });
    });
  };

  const todayFixtures = (req, res) => {
    console.log("today fixtures requested!");
    fs.readFile("./storage/fixtures/today-fixtures.json", (err, data) => {
      if (err)
        res.send({
          status: "error",
          message: err.toString(),
        });

      let news = JSON.parse(data);
      console.log(news?.response?.length);

      res.send({
        status: "success",
        data: news,
      });
    });
  };

  const tomorrowFixtures = (req, res) => {
    fs.readFile("./storage/fixtures/tomorrow-fixtures.json", (err, data) => {
      if (err)
        res.send({
          status: "error",
          message: err.toString(),
        });

      let news = JSON.parse(data);

      res.send({
        status: "success",
        data: news,
      });
    });
  };

  const currentRoundFixtures = (req, res) => {
    const options = {
      method: "GET",
      url: "https://api-football-v1.p.rapidapi.com/v3/fixtures",
      params: { league: "39", season: "2020", round: "Regular Season - 10" },
      headers: {
        "X-RapidAPI-Key": "33f9653174mshefc4be967757e8ap144d7ejsn5a2eea54acd1",
        "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
      },
    };

    axios
      .request(options)
      .then(function (response) {
        console.log(response.data);
        fs.writeFile(
          "./storage/fixtures/current-round-fixtures.json",
          JSON.stringify(response.data),
          (err) => {
            if (err) {
              // throw err;
              res.send({
                status: "error",
                message: err.toString(),
              });
            }
            console.log("Appended to file");
            res.send({
              status: "success",
              message: response.data,
            });
          }
        );
      })
      .catch(function (error) {
        console.error(error);
      });
  };

  const timezones = (req, res) => {
    const options = {
      method: "GET",
      url: "https://api-football-v1.p.rapidapi.com/v3/timezone",
      headers: {
        "X-RapidAPI-Key": "33f9653174mshefc4be967757e8ap144d7ejsn5a2eea54acd1",
        "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
      },
    };

    axios
      .request(options)
      .then(function (response) {
        console.log(response.data);
        fs.writeFile(
          "./storage/fixtures/timezones.json",
          JSON.stringify(response.data),
          (err) => {
            if (err) {
              // throw err;
              res.send({
                status: "error",
                message: err.toString(),
              });
            }
            console.log("Appended to file");
            res.send({
              status: "success",
              message: response.data,
            });
          }
        );
      })
      .catch(function (error) {
        console.error(error);
      });
  };

  const todayOdds = (req, res) => {
    fs.readFile("./storage/fixtures/today-odds.json", (err, data) => {
      if (err)
        res.send({
          status: "error",
          message: err.toString(),
        });

      let news = JSON.parse(data);

      res.send({
        status: "success",
        data: news,
      });
    });
  };

  const tomorrowOdds = (req, res) => {
    fs.readFile("./storage/fixtures/tomorrow-odds.json", (err, data) => {
      if (err)
        res.send({
          status: "error",
          message: err.toString(),
        });

      let news = JSON.parse(data);

      res.send({
        status: "success",
        data: news,
      });
    });
  };

  const oddsById = (req, res) => {
    const { id } = req.params;

    fs.readFile("./storage/fixtures/today-odds.json", (err, data) => {
      if (err)
        res.send({
          status: "error",
          message: err.toString(),
        });

      let odds = JSON.parse(data);
      console.log({ odds });
      let odd = odds?.response?.find(
        (el) => Number(el.fixture?.id) === Number(id)
      );

      res.send({
        status: "success",
        data: odd,
      });
    });
  };

  const bookmakers = (req, res) => {
    fs.readFile("./storage/fixtures/bookmakers.json", (err, data) => {
      if (err)
        res.send({
          status: "error",
          message: err.toString(),
        });

      let news = JSON.parse(data);

      res.send({
        status: "success",
        data: news,
      });
    });
  };

  const predictions = (req, res) => {
    fs.readFile("./storage/fixtures/today-predictions.json", (err, data) => {
      if (err)
        res.send({
          status: "error",
          message: err.toString(),
        });

      let predictions = JSON.parse(data);
      // console.log(predictions?.response?.length)

      res.send({
        status: "success",
        data: predictions,
      });
    });
  };

  const predictionById = (req, res) => {
    const { fixtureId } = req?.params;

    fs.readFile("./storage/fixtures/today-predictions.json", (err, data) => {
      if (err)
        res.send({
          status: "error",
          message: err.toString(),
        });

      let prediction = JSON.parse(data);
      console.log({ prediction });
      prediction = prediction.find(
        (el) => Number(el.fixtureId) === Number(fixtureId)
      );
      console.log({ prediction });

      res.send({
        status: "success",
        data: prediction,
      });
    });
  };

  return {
    getAllLeagues,
    getLeaguesById,
    leagueByTeamId,
    leagueBySeason,
    getAllFixtures,
    getCurrentRound,
    currentFixtures,
    nextFixtures,
    yesterdayFixtures,
    todayFixtures,
    tomorrowFixtures,
    timezones,
    todayOdds,
    tomorrowOdds,
    bookmakers,
    predictions,
    predictionById,
    oddsById,
  };
}

module.exports = FootballController;
