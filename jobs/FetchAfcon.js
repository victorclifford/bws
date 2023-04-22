const {http} = require('../utils/axios')
const moment = require("moment");

const fs = require('fs');


/**
 *  Job: FetchAfcon
 */
module.exports = {
    // Job Handler
    async handler(args, job) {
        // Your Job Here
        const today = moment().format("YYYY/MM/DD");

        let result = [];

        if (!fs.existsSync($.path.storage(`/sports/${today}/afcon.json`))) {
            const fixtures = await $http(
                `${process.env.SPORT_MONKS}/fixtures/date/${today.replace(
                    new RegExp("/", "g"),
                    "-"
                )}/?include=localTeam,visitorTeam&leagues=1117`
            );

            if (fixtures.data.length > 0) {
                for (const fixture of fixtures.data) {
                    const { id, time, localTeam, visitorTeam } = fixture;

                    const data = {
                        id,
                        time,
                        localTeam,
                        visitorTeam
                    };

                    result.push(data);
                }
            }

            await fs.writeFile(
                `../storage/sports/${today}/afcon.json`,
                JSON.stringify(result)
            );
        }

        // End current job process.
        return job.end();
    }
};
