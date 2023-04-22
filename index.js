const http = require("http");
const app = require("./app");
const path = require("path");
const moment = require("moment");
const fs = require("fs");
const { randomString } = require("./utils/numbers");
// const UsersController = require("./controllers/UsersController");
const { request, response } = require("express");
const server = http.createServer(app);

const { API_PORT } = process.env;
const port = process.env.PORT || API_PORT;

const yesterday = moment().subtract(1, "day").format("YYYY/MM/DD");
const today = moment().format("YYYY/MM/DD");

// const yesterdayRawFixtures = JSON.parse(
//     fs.readFileSync(`storage/sports/${yesterday}/fixtures.json`).toString()
// );
//
// const todayRawFixtures = JSON.parse(
//     fs.readFileSync(path.resolve(`storage/sports/${today}/fixtures.json`)).toString()
// );

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(randomString(20));
  // console.log("Prototype: ", UsersController.prototype.me(response))
});
