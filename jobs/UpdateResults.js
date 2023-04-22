import moment from "moment";
import JobHelper from "xpresser/src/Console/JobHelper";
import env from "../../env";
import { $ } from "../../xpresser";
import { FixtureType } from "../types/main";
import { http as $http } from "../utils/axios";

const fs = $.file.fs();
const fse = $.file.fsExtra();

/**
 *  Job: UpdateFixtures
 */
export = {
    // Job Handler
    async handler(args: string[], job: JobHelper): Promise<any> {
        let page = 1;
        const today = moment().format("YYYY/MM/DD");

        const checkIfTodayExist = fs.existsSync($.path.storage(`/sports/${today}/fixtures.json`));

        let fixtures: FixtureType[] | any;
        let fixtureFile: FixtureType[] | any;

        if (checkIfTodayExist) {
            fixtureFile = fs.readFileSync($.path.storage(`/sports/${today}/fixtures.json`));

            fixtureFile = JSON.parse(fixtureFile);

            while (page) {
                const { data, meta } = await $http(
                    `${env.SPORT_MONKS}/fixtures/updates?include=localTeam,visitorTeam&page=${page}`
                );

                fixtures = meta;

                if (data.length > 0) {
                    for (const fixture of data) {
                        const { id, scores, time, league_id } = fixture;

                        const findIndex: number = fixtureFile.findIndex(
                            (el: FixtureType) => el.id === id && el.league.id === league_id
                        );

                        if (Math.sign(findIndex) === 1 || Math.sign(findIndex) === 0) {
                            fixtureFile[findIndex].scores.home = scores.localteam_score;
                            fixtureFile[findIndex].scores.away = scores.visitorteam_score;
                            fixtureFile[findIndex].time.status = time.status;
                            fixtureFile[findIndex].time.date = time.starting_at.date_time;
                            fixtureFile[findIndex].time.status = time.status;
                        }
                    }
                }
                let totalPages = fixtures.pagination.total_pages;
                page = page + 1;

                if (page > totalPages) {
                    page = 0;
                    break;
                }
            }

            await fse.outputFile(
                $.path.storage(`/sports/${today}/fixtures.json`),
                JSON.stringify(fixtureFile)
            );
        }
        // End current job process
        return job.end();
    }
};
