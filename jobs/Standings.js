const fs = require("fs");
const http = require("../utils/axios").http;

/**
 *  Job: EPLStanding
 */
module.exports = {
    // Job Handler
    async handler(args, job) {
        try {
            const leagues = [
                {
                    season_id: 18378,
                    short_code: "epl",
                    league: "English Premier League",
                    logo: "https://cdn.sportmonks.com/images/soccer/leagues/8/8.png"
                }, {
                    season_id: 18462,
                    short_code: "laliga",
                    league: "Spanish La Liga",
                    logo: "https://cdn.sportmonks.com/images/soccer/leagues/564.png"
                }, {
                    season_id: 18576,
                    short_code: "seriea",
                    league: "Italian Serie A",
                    logo: "https://cdn.sportmonks.com/images//soccer/leagues/0/384.png"
                }, {
                    season_id: 18444,  // todo: update from the leagues.json file
                    short_code: "bundesliga",
                    league: "German Bundesliga",
                    logo: "https://cdn.sportmonks.com/images/soccer/leagues/82.png"
                }, {
                    season_id: 18441,
                    short_code: "ligue1",
                    league: "French Ligue 1",
                    logo: "https://cdn.sportmonks.com/images//soccer/leagues/13/301.png"
                }
            ];

            const standings = {
                epl: [],
                laliga: [],
                seriea: [],
                bundesliga: [],
                ligue1: []
            }

            for (const league of leagues) {
                const fetch  = await http(`${process.env.SPORT_MONKS}/standings/season/${league.season_id}`);
                const result = fetch.data[0].standings.data;

                let data

                data = result.map((el) => ({
                    position: el.position,
                    team: el.team_name,
                    played: el.overall.games_played,
                    gd: el.total.goal_difference,
                    form: el.recent_form,
                    result: el.result,
                    points: el.points,
                    logo: league.logo,
                    league: league.league
                }));


                await fs.writeFile(`../storage/sports/standings/${league.short_code}.json`, JSON.stringify(data), {
                    encoding: "utf8",
                    flag: "w"
                });
            }
        } catch (e) {
            console.log("Error occurred fetching standings", e);
        }
        return job.end();
    }
};
