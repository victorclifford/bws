const jwt = require('jsonwebtoken')
const verifyJwt = jwt.verify
const moment = require("moment");
// const env = require("../../env");
const BundleCategory = require("../models/BundleCategory");
const Subscription = require("../models/Subscription");
const User = require("../models/User");
const http = require("./axios").http;

const fs = require('fs');
const fsExtra = require('fs-extra');
// const fse = $.file.fsExtra();

require('dotenv').config()

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

function replacePredictionText(str, replace3Way) {
    let result;
    switch (str) {
        case "home":
            result = "1";
            break;
        case "away":
            result = "2";
            break;
        case "1":
            result = "1";
            break;
        case "X":
            result = "X";
            break;
        case "2":
            result = "2";
            break;
        case "over_2_5":
            result = "Ov. 2.5";
            break;
        case "under_2_5":
            result = "Un. 2.5";
            break;
        case "over_3_5":
            result = "Ov. 3.5";
            break;
        default:
            result = "GG";
    }

    return result;
}

function computeLabel(
    prediction,
    no = 10
) {
    // Home, Away and Draw
    const away = prediction.away;
    const home = prediction.home;
    const draw = prediction.draw;
    const awayMin = away - no;
    const awayMax = away + no;

    const homeMin = home - no;
    const homeMax = home + no;

    let homeAwayDraw;

    if (home > away) {
        if (homeMin <= draw && draw <= homeMax) {
            homeAwayDraw = "1X";
        } else {
            homeAwayDraw = "1";
        }
    } else {
        if (awayMin <= draw && draw <= awayMax) {
            homeAwayDraw = "2X";
        } else {
            homeAwayDraw = "2";
        }
    }

    // Btts, Over and Under
    const clonePrediction = (({ home, draw, away, ...newPrediction }) => newPrediction)(
        prediction
    );
    const sortable = Object.fromEntries(
        Object.entries(clonePrediction).sort(([, a], [, b]) => b - a)
    );

    return {
        winOrDraw: homeAwayDraw,
        otherOption: replacePredictionText(Object.keys(sortable)[0])
    };
}

function getFixtureContents() {
    const today = moment().format("YYYY-MM-DD");
    const yesterday = moment().subtract(1, "day").format("YYYY-MM-DD");

    let fixtureFile;
    if (!fs.existsSync($.path.storage(`/sports/fixtures_${today}.json`))) {
        fixtureFile = fs.readFileSync($.path.storage(`/sports/fixtures_${yesterday}.json`));
    } else {
        fixtureFile = fs.readFileSync($.path.storage(`/sports/fixtures_${today}.json`));
    }

    return JSON.parse(fixtureFile);
}

function getPreviousVoting(id, yesterday, type) {
    if (yesterday.length) {
        const findIndex = yesterday.findIndex((el) => el.id === id);

        if (findIndex !== -1) {
            return type === "up" ? yesterday[findIndex].vote?.up : yesterday[findIndex].vote?.down;
        }

        return 0;
    }

    return 0;
}

// TODO: Onesignal push notification setup
// export async function sendPushNotificationViaOneSignal() {
//     try {
//         const { data } = await axios.post("https://onesignal.com/api/v1/notifications", {}, {
//             headers: {
//                 Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`
//             }
//         });
//     } catch (e) {
//
//     }
// }

async function checkUserSubscription(userID) {
    const findUserSubscription = await Subscription.findOne({
        user: User.id(userID.toString()),
        status: "active"
    });

    if (findUserSubscription) {
        const findBundle = await BundleCategory.findById(
            findUserSubscription.data.bundleCat.toString()
        );
        if (findBundle) {
            return findBundle.data.games;
        }
    }

    return 0;
}

async function checkIfUserIsLoggedIn(http) {
    const bearerHeader = http.req.headers["authorization"];
    if (bearerHeader) {
        const bearer = bearerHeader.split(" ");
        const bearerToken = bearer[1];

        try {
            const decoded = verifyJwt(bearerToken);
            if (decoded) {
                const findUserByID = await User.findById(decoded.id);

                if (findUserByID) {
                    return findUserByID.id().toString();
                }

                return false;
            }

            return false;
        } catch (e) {
            return false;
        }
    }
}

async function fetchFixturesByDateFromSportMonks(dateX) {
    // replace - with / using regex
    const date = dateX.replace(/-/g, "/");

    let result = [];
    let page = 1;

    // check if fixtures exist in storage
    if (!fs.existsSync(`../storage/sports/${date}/fixtures.json`)) {
        while (page) {
            const fixtures = await http(
                `${process.env.SPORT_MONKS}/fixtures/date/${date}?include=localTeam,visitorTeam,league,probability&page=${page}`
            );

            if (fixtures.data.length > 0) {
                for (const fixture of fixtures.data) {
                    const {
                        id,
                        scores,
                        time,
                        localTeam,
                        visitorTeam,
                        league,
                        group_id,
                        probability
                    } = fixture;

                    // const probability = await $http(
                    //     `${env.SPORT_MONKS}/predictions/probabilities/fixture/${id}`
                    // );

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

                    const filterLeague = (
                        fsExtra.readJson("../storage/sports/leagues.json")
                    ).find(function (el) {
                        return el.id === league.data.id;
                    });

                    const fetchSeason = await $http(
                        `${process.env.SPORT_MONKS}/standings/season/${filterLeague.season.id}`
                    );

                    let homeTeam;
                    let awayTeam;

                    if (fetchSeason.data && fetchSeason.data.length > 0) {
                        if (
                            filterLeague.league_type === "domestic" ||
                            filterLeague.league_type === "domestic_cup"
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
                        } else if (filterLeague.league_type === "cup_international") {
                            const findGroup = fetchSeason.data.find((el) => {
                                return el.id === group_id || el.season_id === fixture.season_id;
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

                    const homeStats = await $http(
                        `${process.env.SPORT_MONKS}/teams/${localTeam.data.id}?include=stats&seasons=${
                            filterLeague.season.id
                        }`
                    );
                    const awayStats = await $http(
                        `${process.env.SPORT_MONKS}/teams/${visitorTeam.data.id}?include=stats&seasons=${
                            filterLeague.season.id
                        }`
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
                            logo: league.data.logo_path,
                            country:
                                leagues.find((el) => el.id === league.data.id)?.country || null
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
                            seasonID: filterLeague.season.id
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
                            up: 0,
                            down: 0
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

        await fsExtra.outputFile(
            `../storage/sports/${date}/fixtures.json`,
            JSON.stringify(result)
        );
    }
}

module.exports = {
    capitalize, checkIfUserIsLoggedIn,checkUserSubscription,computeLabel,
    fetchFixturesByDateFromSportMonks, getFixtureContents, getPreviousVoting, replacePredictionText,
}
