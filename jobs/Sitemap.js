const xml = require("xml");
const path = require("path");
const fs = require('fs')
const writeFile = fs.writeFileSync;
const promisify = require("util").promisify;

// const writeFileAsync = promisify(writeFile);
const writeFileAsync = fs.writeFile;

// const fse = $.file.fsExtra();

// const jsb = new JsonBank({
//     keys: {
//         prv: $.env("JSON_BANK_PRIVATE_KEY"),
//         pub: $.env("JSON_BANK_PUBLIC_KEY")
//     }
// });

/**
 *  Job: Sitemap
 */
module.exports = {
    // Job Handler
    async handler(args, job) {
        try {
            // const today = moment().format("YYYY/MM/DD");
            // await jsb.createDocument({
            //     name: "fixtures.json",
            //     content: [],
            //     project: "betweysure",
            //     folder: today,
            // })
            const sitemaps = [
                {
                    loc: $.env("FRONT_END") + "/sitemap-pages.xml"
                },
                {
                    loc: $.env("FRONT_END") + "/sitemap-blog.xml"
                }
            ];

            const sitemapIndex = sitemaps.reduce(function(
                items,
                item
            ) {
                // build page items
                items.push({
                    sitemap: [
                        {
                            loc: item.loc
                        }
                    ]
                });
                return items;
            }, []);


            const sitemapObject = {
                sitemapindex: [
                    {
                        _attr: {
                            xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9"
                        }
                    },
                    ...sitemapIndex
                ]
            };

            const sitemap = `<?xml version="1.0" encoding="UTF-8"?>${xml(sitemapObject)}`;

            const saveTo = process.env.NODE_ENV === "production"
                ? path.join(__dirname, "/../../../frontend/public/sitemap.xml")
                : path.join(__dirname, "/../../../../WebstormProjects/Betweysure/public/sitemap.xml");

            await fs.writeFile(saveTo, sitemap, {
                encoding: "utf8",
                flag: "w"
            });
        } catch (e) {
            console.log(e);
        }
        return job.end();
    }
};
