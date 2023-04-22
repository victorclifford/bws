import JobHelper from "xpresser/src/Console/JobHelper";
import { http } from "../utils/axios";
import { $ } from "../../xpresser";
import env from "../../env";

/**
 *  Job: Odds
 */
export = {
    // Job Handler
    async handler(args: string[], job: JobHelper): Promise<any> {
        // Your Job Here
        const fetch = await http(`${env.SPORT_MONKS}/fixtures/18509784?include=odds`);

        if (Object.keys(fetch.data).length) {
            const odds = fetch.data.odds.data;

            let finalData = [];

            for (const match_odds of odds) {
                const find1xbet = match_odds.bookmaker.data as any[];
                for (let i = 0; i < find1xbet.length; i++) {
                    if (find1xbet[i].name == "1xbet") {

                        // console.log(find1xbet[i].odds.data);

                        console.dir(match_odds.name);

                        // console.info(`${JSON.stringify(find1xbet[i].odds.data.map((el: any) => ({
                        //     name: find1xbet[i].name,
                        //     odds: {
                        //         label: el.label,
                        //         odd: el.value,
                        //         probability: el.probability
                        //     }
                        // })))}`);
                        const data = {
                            name: match_odds.name,
                            data: match_odds.bookmaker.data[i]
                        };

                        // await $.file.fsExtra().appendFileSync($.path.storage("odds.txt"), match_odds.name + "\n\n", "utf8")

                        // finalData.push(data);
                    }
                }
            }
            // await $.file.fsExtra().outputFile($.path.storage("odds.json"), JSON.stringify(finalData), {
            //     encoding: "utf8",
            //     flag: "w"
            // })
        }


        // End current job process.
        return job.end();
    }
};
