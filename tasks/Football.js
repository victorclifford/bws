const axios = require("axios");
const fs = require("fs");
const util = require("util");

/** Turning a callback kind of function to a promise */
const writeFile = util.promisify(fs.writeFile);

/** Method to save data as json to a file */
const writeFileAsJSON = async (data, path, fileType) => {
  let jsonContent = JSON.stringify(data);
  // console.log({ jsonContent });
  const err = await writeFile(path, jsonContent, "UTF-8");
  if (err) {
    console.error({
      err: err.toString(),
      location: {
        path,
        fileType,
      },
    });
    await writeFile(path, JSON.stringify(err), "utf8");
    return {
      status: "error",
      message: err.toString(),
    };
  }
  console.log(fileType + " " + "written..");
  return true;
};

function FootballTasks() {
  const getAllLeagues = () => {
    const options = {
      method: "GET",
      // url: `${process.env.API_FOOTBALL_URL}/leagues`,
      url: `${process.env.API_FOOTBALL_URL2}/leagues`,
      headers: {
        "X-RapidAPI-Key": `${process.env.API_FOOTBALL_KEY}`,
        "X-RapidAPI-Host": process.env.API_FOOTBALL_HOST,
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
              return {
                status: "error",
                message: err.toString(),
              };
            }
            console.log("Appended to file");
            return {
              status: "success",
              message: leagues,
            };
          }
        );
      })
      .catch(function (error) {
        console.error(error);
      });
  };

  const yesterdayFixtures = async () => {
    let today = new Date();
    let yesterday = new Date(today);
    let tomorrow = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let year = today.getFullYear();
    tomorrow = tomorrow
      .toISOString()
      .substring(0, tomorrow.toISOString().indexOf("T"));
    yesterday = yesterday
      .toISOString()
      .substring(0, yesterday.toISOString().indexOf("T"));

    const options = {
      method: "GET",
      // url: "https://api-football-v1.p.rapidapi.com/v3/fixtures",
      url: `${process.env.API_FOOTBALL_URL2}/fixtures`,
      // params: {date: '2021-04-07'},
      params: { date: yesterday, timezone: "Africa/Lagos" },
      headers: {
        "X-RapidAPI-Key": process.env.API_FOOTBALL_KEY,
        "X-RapidAPI-Host": process.env.API_FOOTBALL_HOST,
      },
    };

    axios
      .request(options)
      .then(function (response) {
        // console.log(response.data);
        console.log("fetching yesterdays fixtures...");

        /*
        removing fixtures without odds and prediction before writing file for tomorrow fixtures..same as done for today fixtures
        */
        let dataToSave = response.data;

        // Read odd and find fixtures that have odds. Those are the only fixtures we will fetch
        let fixturesInOdds = [];

        fs.readFile("./storage/fixtures/yesterday-odds.json", (err, data) => {
          if (err)
            res.send({
              status: "error",
              message: err.toString(),
            });

          let odds = JSON.parse(data);
          // console.log(Object.keys(odds));
          // let idsInOdds = odds?.response?.fixture.map(a => a.id);
          if (odds) {
            let idsInOdds = odds?.response.map((a) => a.fixture?.id);
            fixturesInOdds = idsInOdds;

            // Read fixtures that have odds
            dataToSave.response = dataToSave?.response.filter((el) =>
              fixturesInOdds.includes(el.fixture?.id)
            );
            dataToSave.results = dataToSave.response.length;
            console.log({ dataToSaveForYesterdayFixtures: dataToSave });

            //  fs.writeFile(
            //    "./storage/fixtures/yesterday-fixtures.json",
            //    JSON.stringify(dataToSave),
            //    (err) => {
            //      if (err) {
            //        // throw err;
            //        return {
            //          status: "error",
            //          message: err.toString(),
            //        };
            //      }
            //      console.log("Yesterday-fixtures Appended to file");
            //      return {
            //        status: "success",
            //        message: response.data,
            //      };
            //    }
            //  );
            let fileType = "yesterday-fixtures";
            let writePath = `./storage/fixtures/${fileType}.json`;
            writeFileAsJSON(dataToSave, writePath, fileType).then(() => {
              return {
                status: "success",
                message: response.data,
              };
            });
          }

          //  console.log({ fixturesInOdds });
        });

        // fs.writeFile(
        //   "./storage/fixtures/yesterday-fixtures.json",
        //   JSON.stringify(response.data),
        //   (err) => {
        //     if (err) {
        //       // throw err;
        //       return {
        //         status: "error",
        //         message: err.toString(),
        //       };
        //     }
        //     console.log("Appended to file");
        //     return {
        //       status: "success",
        //       message: response.data,
        //     };
        //   }
        // );
      })
      .catch(function (error) {
        console.error(error);
      });
  };

  const todayFixtures = async () => {
    let today = new Date();
    let yesterday = new Date(today);
    let tomorrow = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let year = today.getFullYear();
    tomorrow = tomorrow
      .toISOString()
      .substring(0, tomorrow.toISOString().indexOf("T"));
    today = today.toISOString().substring(0, today.toISOString().indexOf("T"));
    yesterday = yesterday
      .toISOString()
      .substring(0, yesterday.toISOString().indexOf("T"));

    const options = {
      method: "GET",
      url: `${process.env.API_FOOTBALL_URL2}/fixtures`,
      // params: {date: '2021-04-07'},
      params: { date: today, timezone: "Africa/Lagos" },
      headers: {
        "X-RapidAPI-Key": process.env.API_FOOTBALL_KEY,
        "X-RapidAPI-Host": process.env.API_FOOTBALL_HOST,
      },
    };
    console.log({ options });
    console.log("fetching today fixtures...");
    axios
      .request(options)
      .then(function (response) {
        // console.log(Object.keys(response.data));
        // console.log("fix-res::", response.data);
        let dataToSave = response.data;
        // dataToSave.response.length=50 // change to vary number of fixtures fetched
        // dataToSave.results=50

        // Read odd and find fixtures that have odds. Those are the only fixtures we will fetch
        let fixturesInOdds = [];

        fs.readFile("./storage/fixtures/today-odds.json", (err, data) => {
          if (err)
            res.send({
              status: "error",
              message: err.toString(),
            });

          let odds = JSON.parse(data);
          // console.log(Object.keys(odds));
          // let idsInOdds = odds?.response?.fixture.map(a => a.id);
          let idsInOdds = odds?.response.map((a) => a.fixture?.id);
          fixturesInOdds = idsInOdds;

          // Read fixtures that have odds
          dataToSave.response = dataToSave?.response.filter((el) =>
            fixturesInOdds.includes(el.fixture?.id)
          );
          dataToSave.results = dataToSave.response.length;
          console.log({ dataToSave });
          // fs.writeFile(
          //   "./storage/fixtures/today-fixtures.json",
          //   JSON.stringify(dataToSave),
          //   (err) => {
          //     if (err) {
          //       // throw err;
          //       return {
          //         status: "error",
          //         message: err.toString(),
          //       };
          //     }
          //     console.log("Todays fixtures Appended to file");
          //     return {
          //       status: "success",
          //       message: response.data,
          //     };
          //   }
          // );
          let fileType = "today-fixtures";
          let writePath = `./storage/fixtures/${fileType}.json`;
          writeFileAsJSON(dataToSave, writePath, fileType).then(() => {
            return {
              status: "success",
              message: response.data,
            };
          });

          console.log({ fixturesInOdds });
        });

        // console.log({ fixturesInOdds })

        // fs.writeFile('./storage/fixtures/today-fixtures.json', JSON.stringify(dataToSave), (err) => {
        //     if (err) {
        //         // throw err;
        //         return({
        //             status: 'error',
        //             message: err.toString()
        //         })
        //     }
        //     console.log("Appended to file")
        //     return({
        //         status: "success",
        //         message: response.data
        //     })
        // });
      })
      .catch(function (error) {
        console.error(error);
      });
  };

  const tomorrowFixtures = async () => {
    let today = new Date();
    let yesterday = new Date(today);
    let tomorrow = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let year = today.getFullYear();
    tomorrow = tomorrow
      .toISOString()
      .substring(0, tomorrow.toISOString().indexOf("T"));
    today = today.toISOString().substring(0, today.toISOString().indexOf("T"));
    yesterday = yesterday
      .toISOString()
      .substring(0, yesterday.toISOString().indexOf("T"));

    const options = {
      method: "GET",
      // url: "https://api-football-v1.p.rapidapi.com/v3/fixtures",
      url: `${process.env.API_FOOTBALL_URL2}/fixtures`,
      // params: {date: '2021-04-07'},
      params: { date: tomorrow, timezone: "Africa/Lagos" },
      headers: {
        "X-RapidAPI-Key": process.env.API_FOOTBALL_KEY,
        "X-RapidAPI-Host": process.env.API_FOOTBALL_HOST,
      },
    };

    axios
      .request(options)
      .then(function (response) {
        // console.log(response.data);
        console.log("fetching tomorrows fixtures...");

        /*
        removing fixtures without odds and prediction before writing file for tomorrow fixtures..same as done for today fixtures
        */
        let dataToSave = response.data;
        // dataToSave.response.length=50 // change to vary number of fixtures fetched
        // dataToSave.results=50

        // Read odd and find fixtures that have odds. Those are the only fixtures we will fetch
        let fixturesInOdds = [];

        fs.readFile("./storage/fixtures/tomorrow-odds.json", (err, data) => {
          if (err)
            res.send({
              status: "error",
              message: err.toString(),
            });

          let odds = JSON.parse(data);
          // console.log(Object.keys(odds));
          // let idsInOdds = odds?.response?.fixture.map(a => a.id);
          let idsInOdds = odds?.response.map((a) => a.fixture?.id);
          fixturesInOdds = idsInOdds;

          // Read fixtures that have odds
          dataToSave.response = dataToSave?.response.filter((el) =>
            fixturesInOdds.includes(el.fixture?.id)
          );
          dataToSave.results = dataToSave.response.length;
          // console.log({ dataToSaveForTomorrowFixtures: dataToSave });
          // fs.writeFile(
          //   "./storage/fixtures/tomorrow-fixtures.json",
          //   JSON.stringify(dataToSave),
          //   (err) => {
          //     if (err) {
          //       // throw err;
          //       return {
          //         status: "error",
          //         message: err.toString(),
          //       };
          //     }
          //     console.log("Tomorrow-fixtures Appended to file");
          //     //fetch predictions for fixtures at once
          //     //  fetchPredictions();
          //     return {
          //       status: "success",
          //       message: response.data,
          //     };
          //   }
          // );
          let fileType = "tomorrow-fixtures";
          let writePath = `./storage/fixtures/${fileType}.json`;
          writeFileAsJSON(dataToSave, writePath, fileType).then(() => {
            return {
              status: "success",
              message: response.data,
            };
          });

          //  console.log({ fixturesInOdds });
        });

        // fs.writeFile(
        //   "./storage/fixtures/tomorrow-fixtures.json",
        //   JSON.stringify(response.data),
        //   (err) => {
        //     if (err) {
        //       // throw err;
        //       return {
        //         status: "error",
        //         message: err.toString(),
        //       };
        //     }
        //     console.log("Appended to file");
        //     return {
        //       status: "success",
        //       message: response.data,
        //     };
        //   }
        // );
      })
      .catch(function (error) {
        console.error(error);
      });
  };

  const timezones = () => {
    const options = {
      method: "GET",
      // url: "https://api-football-v1.p.rapidapi.com/v3/timezone",
      url: `${process.env.API_FOOTBALL_URL2}/timezone`,
      headers: {
        "X-RapidAPI-Key": process.env.API_FOOTBALL_KEY,
        "X-RapidAPI-Host": process.env.API_FOOTBALL_HOST,
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
              return {
                status: "error",
                message: err.toString(),
              };
            }
            console.log("Appended to file");
            return {
              status: "success",
              message: response.data,
            };
          }
        );
      })
      .catch(function (error) {
        console.error(error);
      });
  };

  const fetchTodayOdds = async () => {
    let today = new Date();
    let yesterday = new Date(today);
    let tomorrow = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let year = today.getFullYear();
    tomorrow = tomorrow
      .toISOString()
      .substring(0, tomorrow.toISOString().indexOf("T"));
    today = today.toISOString().substring(0, today.toISOString().indexOf("T"));
    yesterday = yesterday
      .toISOString()
      .substring(0, yesterday.toISOString().indexOf("T"));

    const options = {
      method: "GET",
      // url: "https://v3.football.api-sports.io/odds",
      url: `${process.env.API_FOOTBALL_URL2}/odds`,
      params: { date: today, bookmaker: 11, timezone: "Africa/Lagos" },
      headers: {
        "X-RapidAPI-Key": process.env.API_FOOTBALL_KEY,
        "X-RapidAPI-Host": process.env.API_FOOTBALL_HOST,
      },
    };
    axios
      .request(options)
      .then(function (response) {
        // console.log(response.data);
        console.log("fetching todays odds....");
        // fs.writeFile(
        //   "./storage/fixtures/today-odds.json",
        //   JSON.stringify(response.data),
        //   (err) => {
        //     if (err) {
        //       // throw err;
        //       return {
        //         status: "error",
        //         message: err.toString(),
        //       };
        //     }
        //     todayFixtures().then(() => {
        //       console.log("Tday-fixtures Appended to file");
        //       return {
        //         status: "success",
        //         message: response.data,
        //       };
        //     });
        //   }
        // );
        if (response?.data) {
          console.log("res-nowww::", response?.data);
          let fileType = "today-odds";
          writeFileAsJSON(
            response?.data,
            `./storage/fixtures/${fileType}.json`,
            fileType
          ).then(async () => {
            await todayFixtures();
            return {
              status: "success",
              message: response.data,
            };
          });
        }
        // else {
        //   let dataErr = "No data in today-odds response";
        //   writeFileAsJSON(dataErr, `./storage/fixtures/dataErr.txt`, "dataErr");
        // }
      })
      .catch(function (error) {
        console.error("todayy-fixtures-err::", error);
      });
  };

  const fetchTomorrowOdds = async () => {
    let today = new Date();
    let yesterday = new Date(today);
    let tomorrow = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let year = today.getFullYear();
    tomorrow = tomorrow
      .toISOString()
      .substring(0, tomorrow.toISOString().indexOf("T"));
    today = today.toISOString().substring(0, today.toISOString().indexOf("T"));
    yesterday = yesterday
      .toISOString()
      .substring(0, yesterday.toISOString().indexOf("T"));

    const options = {
      method: "GET",
      // url: "https://api-football-v1.p.rapidapi.com/v3/odds",
      url: `${process.env.API_FOOTBALL_URL2}/odds`,
      params: { date: tomorrow, bookmaker: 11, timezone: "Africa/Lagos" },
      headers: {
        "X-RapidAPI-Key": process.env.API_FOOTBALL_KEY,
        "X-RapidAPI-Host": process.env.API_FOOTBALL_HOST,
      },
    };

    axios
      .request(options)
      .then(function (response) {
        console.log(response.data);
        // fs.writeFile(
        //   "./storage/fixtures/tomorrow-odds.json",
        //   JSON.stringify(response.data),
        //   (err) => {
        //     if (err) {
        //       // throw err;
        //       return {
        //         status: "error",
        //         message: err.toString(),
        //       };
        //     }
        //     console.log("Tomorrow-odds Appended to file");
        //     //fetch tomorrow fixtures at once
        //     tomorrowFixtures();
        //     return {
        //       status: "success",
        //       message: response.data,
        //     };
        //   }
        // );
        if (response?.data) {
          let fileType = "tomorrow-odds";
          writeFileAsJSON(
            response?.data,
            `./storage/fixtures/${fileType}.json`,
            fileType
          ).then(async () => {
            await tomorrowFixtures();
            return {
              status: "success",
              message: response.data,
            };
          });
        }
        //  else {
        //   let dataErr = "No data in tomorrow-odds response";
        //   writeFileAsJSON(dataErr, `./storage/fixtures/dataErr.txt`, "dataErr");
        // }
      })
      .catch(function (error) {
        console.error(error);
      });
  };

  //fetching yesterdays odds to be used to filter yesterdays fixtures
  const fetchYesterdayOdds = async () => {
    let today = new Date();
    let yesterday = new Date(today);
    let tomorrow = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let year = today.getFullYear();
    tomorrow = tomorrow
      .toISOString()
      .substring(0, tomorrow.toISOString().indexOf("T"));
    today = today.toISOString().substring(0, today.toISOString().indexOf("T"));
    yesterday = yesterday
      .toISOString()
      .substring(0, yesterday.toISOString().indexOf("T"));

    const options = {
      method: "GET",
      // url: "https://api-football-v1.p.rapidapi.com/v3/odds",
      url: `${process.env.API_FOOTBALL_URL2}/odds`,
      params: { date: yesterday, bookmaker: 11, timezone: "Africa/Lagos" },
      headers: {
        "X-RapidAPI-Key": process.env.API_FOOTBALL_KEY,
        "X-RapidAPI-Host": process.env.API_FOOTBALL_HOST,
      },
    };

    axios
      .request(options)
      .then(function (response) {
        // console.log(response.data);
        // fs.writeFile(
        //   "./storage/fixtures/yesterday-odds.json",
        //   JSON.stringify(response.data),
        //   (err) => {
        //     if (err) {
        //       // throw err;
        //       return {
        //         status: "error",
        //         message: err.toString(),
        //       };
        //     }
        //     console.log("Yesterday-odds Appended to file");
        //     //fetch yesterday fixtures at once
        //     yesterdayFixtures();
        //     return {
        //       status: "success",
        //       message: response.data,
        //     };
        //   }
        // );
        if (response?.data) {
          let fileType = "yesterday-odds";
          writeFileAsJSON(
            response?.data,
            `./storage/fixtures/${fileType}.json`,
            fileType
          ).then(async () => {
            await yesterdayFixtures();
            // console.log("Tday-fixtures Appended to file");
            return {
              status: "success",
              message: response.data,
            };
          });
        }
        // else {
        //   let dataErr = "No data in yesterday-odds response";
        //   writeFileAsJSON(dataErr, `./storage/fixtures/dataErr.txt`, "dataErr");
        // }
      })
      .catch(function (error) {
        console.error(error);
      });
  };

  const fetchBookmakers = () => {
    const options = {
      method: "GET",
      // url: "https://api-football-v1.p.rapidapi.com/v3/odds/bookmakers",
      url: `${process.env.API_FOOTBALL_URL2}/odds/bookmakers`,
      headers: {
        "X-RapidAPI-Key": process.env.API_FOOTBALL_KEY,
        "X-RapidAPI-Host": process.env.API_FOOTBALL_HOST,
      },
    };

    axios
      .request(options)
      .then(function (response) {
        console.log(response.data);
        fs.writeFile(
          "./storage/fixtures/bookmakers.json",
          JSON.stringify(response.data),
          (err) => {
            if (err) {
              // throw err;
              return {
                status: "error",
                message: err.toString(),
              };
            }
            console.log("Appended to file");
            return {
              status: "success",
              message: response.data,
            };
          }
        );
      })
      .catch(function (error) {
        console.error(error);
      });
  };

  const fetchPredictions = () => {
    const options = {
      method: "GET",
      // url: "https://api-football-v1.p.rapidapi.com/v3/predictions",
      url: `${process.env.API_FOOTBALL_URL2}/predictions`,
      params: { fixture: "" },
      headers: {
        "X-RapidAPI-Key": process.env.API_FOOTBALL_KEY,
        "X-RapidAPI-Host": process.env.API_FOOTBALL_HOST,
      },
    };

    let fixtureIds = [];

    /*
    reading all fixtures files and extract the fixture ids, to gwt predictions for them
    */

    //getting from yesterday-fixtures
    fs.readFile(
      "./storage/fixtures/yesterday-fixtures.json",
      async (err, data) => {
        if (err)
          res.send({
            status: "error",
            message: err.toString(),
          });

        let fixtures = JSON.parse(data);
        // console.log(
        //   "yesterday-fixtures-data-for-prediction::",
        //   Object.keys(fixtures)
        // );

        fixtureIds = fixtures?.response.map((a) => a.fixture?.id);
      }
    );

    //getting from tomorrow-fixtures
    fs.readFile(
      "./storage/fixtures/tomorrow-fixtures.json",
      async (err, data) => {
        if (err)
          res.send({
            status: "error",
            message: err.toString(),
          });

        let fixtures = JSON.parse(data);
        // console.log(
        //   "tomorrow-fixtures-data-for-prediction::",
        //   Object.keys(fixtures)
        // );

        //extracting the fixture ids for tomorrow
        let fixtureIdsFromTomorrow = fixtures?.response.map(
          (a) => a.fixture?.id
        );

        //adding the extracted ids to the existing ones
        fixtureIds = [...fixtureIds, ...fixtureIdsFromTomorrow];
        console.log("tomorrow-&-yesterday-fixtureIds::", fixtureIds);
      }
    );

    //getting from today-fixtures
    fs.readFile("./storage/fixtures/today-fixtures.json", async (err, data) => {
      if (err)
        res.send({
          status: "error",
          message: err.toString(),
        });

      let fixtures = JSON.parse(data);
      // console.log(
      //   "today-fixtures-data-for-prediction::",
      //   Object.keys(fixtures)
      // );

      // let idsInOdds = odds?.response?.fixture.map(a => a.id);
      // fixtureIds = fixtures?.response.map((a) => a.fixture?.id);

      //extracting the fixture ids for today
      let fixtureIdsFromToday = fixtures?.response.map((a) => a.fixture?.id);

      //adding the extracted ids to the existing ones
      fixtureIds = [...fixtureIdsFromToday, ...fixtureIds];
      console.log("tomorrow-&-yesterday-&-today-fixtureIds::", fixtureIds);

      let predictionsData = [];

      // Fetch predictions for fixtures of all extracted ids
      console.log("fetching predictions...");

      let pred = null;
      //func to make prediction request request for a fixture by ID
      const eachReq = async (arg) => {
        pred = await axios.request(arg);
      };

      /*
        writing a func to execute the func that makes the prediction request, to be executed every 10secs so as to meet up with the api request limit per minute, instead of making the request for each fixture id directly in the for loop.
      */
      function makeApiRequestEveryFiveSecs(i, arg) {
        return new Promise((resolve) => {
          setTimeout(() => {
            // Make API request here
            eachReq(arg).then(() => {
              let response = pred?.data?.response[0];
              // console.log({ response });
              // console.log("predFromEachReq::", pred);

              predictionsData.push({
                fixtureId: fixtureIds[i],
                response: response,
              });
              console.log(
                `API prediction request for fixture no ${
                  i + 1
                } made at ${new Date()}`
              );
            });

            resolve();
          }, 5000);
        });
      }

      for (let i = 0; i < fixtureIds.length; i++) {
        options.params.fixture = `${fixtureIds[i]}`;

        await makeApiRequestEveryFiveSecs(i, options);

        // let pred = await axios.request(options);
        // let response = pred?.data?.response[0];
        // // console.log({response})

        // predictionsData.push({
        //   fixtureId: fixtureIds[i],
        //   response: response,
        // });
      }

      console.log({ predictionsData });
      console.log("writing prediction data to file...");
      setTimeout(() => {
        // fs.writeFile(
        //   "./storage/fixtures/today-predictions.json",
        //   JSON.stringify(predictionsData),
        //   (err) => {
        //     if (err) {
        //       // throw err;
        //       return {
        //         status: "error",
        //         message: err.toString(),
        //       };
        //     }
        //     console.log("Predictions Appended to file");
        //     return {
        //       status: "success",
        //       message: predictionsData,
        //     };
        //   }
        // );
        let fileType = "today-predictions";
        let writePath = `./storage/fixtures/${fileType}.json`;
        writeFileAsJSON(predictionsData, writePath, fileType).then(() => {
          return {
            status: "success",
            message: predictionsData,
          };
        });
      }, 6000);
    });
  };

  return {
    getAllLeagues,
    yesterdayFixtures,
    todayFixtures,
    tomorrowFixtures,
    timezones,
    fetchTodayOdds,
    fetchTomorrowOdds,
    fetchBookmakers,
    fetchPredictions,
    fetchYesterdayOdds,
  };
}

module.exports = FootballTasks;
