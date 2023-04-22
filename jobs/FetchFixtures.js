const { fetchFixturesByDateFromSportMonks } = require("../utils/func");

const moment = require('moment');
/**
 *  Job: FetchFixture
 */
module.exports = {
    // Job Handler
    async handler(args, job) {
        // Your Job Here
        try {
            await fetchFixturesByDateFromSportMonks(moment().subtract(1, "d").format("YYYY-MM-DD"));
            console.log("Yesterday's fixtures fetched successfully");

            await fetchFixturesByDateFromSportMonks(moment().format("YYYY-MM-DD"));
            console.log("Today's fixtures fetched successfully");

            await fetchFixturesByDateFromSportMonks(moment().add(1, "d").format("YYYY-MM-DD"));
            console.log("Tomorrow's fixtures fetched successfully");

        } catch (e) {
            console.log(e);
        }

        return job.end();
    }
};
