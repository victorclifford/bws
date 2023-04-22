const env = require("../../env");
const leagues = require("../../storage/sports/leagues.json");
// import { http as $http } from "../utils/axios";
const {http} = require('../utils/axios')
// import { computeLabel, getPreviousVoting } from "../utils/func";


var crypto = require("crypto");
const Prediction = require("../utils/predictions");
const { checkIfUserIsLoggedIn, checkUserSubscription, getFixtureContents } = require("../utils/func");


var _ = require('lodash');
const url_slug = require('url-slug');
const uuidv4 = require('uuid').v4;
const axios = require('axios').default;
const GoogleSpreadsheet = require("google-spreadsheet").GoogleSpreadsheet;
const Handlebars = require("handlebars");
const joi = require("joi");
const mjml2html = require("mjml");
const moment = require("moment");
const momentT = require("moment-timezone");
// const http = require('http');
const Bundle = require("../models/Bundle");
const BundleCategory = require("../models/BundleCategory");
const Subscription = require("../models/Subscription");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const UserTip = require("../models/UserTip");
import { sendPushNotificationViaOneSignal } from "../utils/pushNotification";

const fs = require('fs')
const sendEmail = require("../utils/emails")
const {randomString} = require("../utils/numbers");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
var passport = require('passport');

const fs = $.file.fs();
const fse = $.file.fsExtra();
/**
 *  Job: FetchFixture
 */
module.exports = {
    // Job Handler
    async handler(args, job) {
        try {
            const today = moment(args[0]).format("YYYY/MM/DD");
            const yesterday = moment(today.replace(new RegExp("/", "g"), "-"))
                .subtract(1, "d")
                .format("YYYY/MM/DD");
            const tomorrow = moment(today.replace(new RegExp("/", "g"), "-"))
                .add(1, "d")
                .format("YYYY/MM/DD");

            const yesterdayFixtures =
                fs.existsSync($.path.storage(`/sports/${yesterday}/fixtures.json`)) &&
                JSON.parse(
                    fs.readFileSync($.path.storage(`/sports/${yesterday}/fixtures.json`)).toString()
                );

            let result = [];
            let page = 1;

            if (!fs.existsSync($.path.storage(`/sports/${today}/fixtures.json`))) {
                while (page) {
                    const fixtures = await http(
                        `${process.env.SPORT_MONKS}/fixtures/between/${yesterday.replace(
                            new RegExp("/", "g"),
                            "-"
                        )}/${tomorrow.replace(
                            new RegExp("/", "g"),
                            "-"
                        )}?include=localTeam,visitorTeam,league&page=${page}`
                    );

                    if (fixtures.data.length > 0) {
                        for (const fixture of fixtures.data) {
                            const { id, scores, time, localTeam, visitorTeam, league, group_id } =
                                fixture;

                            const probability = await http(
                                `${env.SPORT_MONKS}/predictions/probabilities/fixture/${id}`
                            );

                            if (probability.data instanceof Array) continue;

                            let head2head = [];

                            const h2h = await $http(
                                `${process.env.SPORT_MONKS}/head2head/${localTeam.data.id}/${visitorTeam.data.id}?include=localTeam,visitorTeam`
                            );

                            if (h2h.data && h2h.data.length) {
                                for (const head of h2h.data) {
                                    if (head2head.length === 5) break;
                                    const score = {
                                        homeTeam: head.localTeam,
                                        awayTeam: head.visitorTeam,
                                        date: head.time.starting_at.date_time,
                                        home: head.scores.localteam_score,
                                        away: head.scores.visitorteam_score
                                    };

                                    head2head.push(score);
                                }
                            }

                            const filterLeague = leagues.find(function (el) {
                                return el.id === league.data.id;
                            });

                            const fetchSeason = await $http(
                                `${process.env.SPORT_MONKS}/standings/season/${filterLeague?.season.id}`
                            );

                            let homeTeam;
                            let awayTeam;

                            if (fetchSeason.data && fetchSeason.data.length > 0) {
                                if (
                                    filterLeague?.league_type === "domestic" ||
                                    filterLeague?.league_type === "domestic_cup"
                                ) {
                                    const findLeague = fetchSeason.data.find(
                                        (el) => el.league_id === league.data.id
                                    );

                                    homeTeam = findLeague.standings.data.find(function (el) {
                                        return el.team_id === localTeam.data.id;
                                    });

                                    awayTeam = findLeague.standings.data.find(function (el) {
                                        return el.team_id === visitorTeam.data.id;
                                    });
                                } else if (filterLeague?.league_type === "cup_international") {
                                    const findGroup = fetchSeason.data.find((el) => {
                                        return (
                                            el.id === group_id || el.season_id === fixture.season_id
                                        );
                                    });

                                    // console.dir(findGroup, { depth: null });

                                    homeTeam = findGroup.standings.data.find(function (el) {
                                        return el.team_id === localTeam.data.id;
                                    });

                                    awayTeam = findGroup.standings.data.find(function (el) {
                                        return el.team_id === visitorTeam.data.id;
                                    });
                                }
                            }

                            const homeStats = await http(
                                `${process.env.SPORT_MONKS}/teams/${
                                    localTeam.data.id
                                }?include=stats&seasons=${filterLeague?.season.id}`
                            );
                            const awayStats = await http(
                                `${process.env.SPORT_MONKS}/teams/${
                                    visitorTeam.data.id
                                }?include=stats&seasons=${filterLeague?.season.id}`
                            );

                            const fixtureData = {
                                id,
                                scores: {
                                    home: scores.localteam_score,
                                    away: scores.visitorteam_score
                                },
                                time: {
                                    status: time.status,
                                    date: time.starting_at.date_time
                                },
                                homeTeam: {
                                    id: localTeam.data.id,
                                    name: localTeam.data.name,
                                    short_code: localTeam.data.short_code,
                                    logo: localTeam.data.logo_path,
                                    stats: homeStats.data ? homeStats.data.stats.data[0] : null
                                },
                                awayTeam: {
                                    id: visitorTeam.data.id,
                                    name: visitorTeam.data.name,
                                    short_code: visitorTeam.data.short_code,
                                    logo: visitorTeam.data.logo_path,
                                    stats: awayStats.data ? awayStats.data.stats.data[0] : null
                                },
                                league: {
                                    id: league.data.id,
                                    name: league.data.name,
                                    logo: league.data.logo_path
                                },
                                predictions: {
                                    home: probability.data.predictions.home,
                                    away: probability.data.predictions.away,
                                    draw: probability.data.predictions.draw,
                                    btts: probability.data.predictions.btts,
                                    over_2_5: probability.data.predictions.over_2_5,
                                    under_2_5: probability.data.predictions.under_2_5,
                                    over_3_5: probability.data.predictions.over_3_5
                                },
                                h2h: head2head,
                                form: {
                                    home: homeTeam?.recent_form ?? null,
                                    away: awayTeam?.recent_form ?? null,
                                    group_id: group_id ?? null,
                                    seasonID: filterLeague?.season.id
                                },
                                label: computeLabel({
                                    home: probability.data.predictions.home,
                                    away: probability.data.predictions.away,
                                    draw: probability.data.predictions.draw,
                                    btts: probability.data.predictions.btts,
                                    over_2_5: probability.data.predictions.over_2_5,
                                    under_2_5: probability.data.predictions.under_2_5,
                                    over_3_5: probability.data.predictions.over_3_5
                                    // under_3_5: probability.data.predictions.under_3_5
                                }),
                                odds: {
                                    ...probability.data.predictions
                                },
                                slug: urlSlug(`${localTeam.data.name}-vs-${visitorTeam.data.name}`),
                                vote: {
                                    up:
                                        getPreviousVoting(
                                            id,
                                            yesterdayFixtures instanceof Array
                                                ? yesterdayFixtures
                                                : [],
                                            "up"
                                        ) || 0,
                                    down:
                                        getPreviousVoting(
                                            id,
                                            yesterdayFixtures instanceof Array
                                                ? yesterdayFixtures
                                                : [],
                                            "down"
                                        ) || 0
                                }
                            };

                            result.push(fixtureData);
                        }
                    }
                    let totalPages = fixtures.meta.pagination.total_pages;
                    page = page + 1;

                    if (page > totalPages) {
                        page = 0;
                        break;
                    }
                }

                // await fs.writeFileSync($.path.storage(`/sports/${today}/fixtures.json`), JSON.stringify(result), {
                //     encoding: "utf8",
                //     flag: "w"
                // });

                await fse.outputFile(
                    $.path.storage(`/sports/${today}/fixtures.json`),
                    JSON.stringify(result), {
                        encoding: "utf8",
                        flag: "w"
                    }
                );
            }
        } catch (e) {
            console.log(e);
        }

        return job.end();
    }
};
