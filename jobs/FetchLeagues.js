const axios = require('axios').default;
const env = require("../../env");

const fs = require('fs');
/**
 *  Job: FetchLeagues
 */


module.exports = {
    // Job Handler
    async handler(args, job) {
        // Your Job Here
        try {
            const { data } = await axios(`${process.env.SPORT_MONKS}/leagues?include=country,season`, {
                params: {
                    api_token: process.env.DATA_TOKEN
                }
            });
            // const { data } = await http(`${env.SPORT_MONKS}/leagues?include=country,season`);
            const result = data.data.map(
                ({ id, logo_path, name, country, season, type }) => ({
                    id,
                    logo_path,
                    name,
                    country: country.data.name,
                    season: season.data,
                    league_type: type
                })
            );

            // fs.writeFile($.path.storage(`/sports/leagues.json`), JSON.stringify(result), () => {
            //     console.log("written");
            // });
            await fs.writeFile(`../storage/sports/leagues.json`, JSON.stringify(result));
        } catch (e) {
            console.log(e);
        }

        // End current job process.
        return job.end();
    }
};
