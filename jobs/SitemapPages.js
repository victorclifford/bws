const moment = require("moment");
const xml = require("xml");
const writeFile = require("fs").writeFile;
const promisify = require("util").promisify;
const Post =  require("../models/Post");
const path = require("path");

const writeFileAsync = promisify(writeFile);
const fs = require(fs)

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
            const pages = [
                {
                    title: "About us",
                    created: "Jan 18 2022",
                    slug: "/about"
                },
                {
                    title: "Contact us",
                    created: "Dec 18 2021",
                    slug: "/contact"
                },
                {
                    title: "Frequently Asked Questions",
                    created: "Dec 2 2021",
                    slug: "/faqs"
                },
                {
                    title: "Free Tips",
                    created: "Apr 4 2021",
                    slug: "/free-tips",
                    lastModified: "Apr 18 2022"
                },
                {
                    title: "Results",
                    created: "Dec 18 2021",
                    lastModified: "Apr 18 2022",
                    slug: "/results"
                },
                {
                    title: "Pricing",
                    created: "Apr 12 2022",
                    slug: "/pricing"
                },
                {
                    title: "AFCON 2021",
                    created: "Jan 7 2022",
                    slug: "/afcon/predict-and-win-afcon-2021"
                },
                {
                    title: "UCL Predict and Win",
                    created: "Feb 20 2022",
                    lastModified: "Apr 18 2022",
                    slug: "/uefa-champions-league/predict-and-win"
                }
            ];

            const predictions = () => {
                const options = ["gg", "over_2_5", "over_2_5", "under_3_5"];

                const urls = [];

                for (let i = 0; i < options.length; i++) {
                    const option = options[i];

                    urls.push({
                        url: `/predictions/${option}`,
                        changefreq: "daily",
                        priority: "0.8",
                        lastModified: new Date()
                            .toISOString()
                            .split("T")[0]
                    });
                }

                return urls.reduce(function(
                    items,
                    item
                ) {
                    // build page items
                    items.push({
                        url: [
                            {
                                loc: `${process.env.FRONT_END}${item.url}`
                            },
                            {
                                lastmod: new Date(item.lastModified)
                                    .toISOString()
                                    .split("T")[0]
                            },
                            { changefreq: "daily" },
                            { priority: "0.8" }
                        ]
                    });
                    return items;
                }, []);
            };

            const indexItem = {
                //build index item
                url: [
                    {
                        loc: $.env("FRONT_END")
                    },
                    {
                        lastmod: new Date(
                            Math.max.apply(
                                null,
                                pages.map((page) => {
                                    return new Date(
                                        page.lastModified ?? page.created
                                    );
                                })
                            )
                        )
                            .toISOString()
                            .split("T")[0]
                    },
                    { changefreq: "daily" },
                    { priority: "1.0" }
                ]
            };

            const sitemapItems = pages.reduce(function(
                items,
                item
            ) {
                // build page items
                items.push({
                    url: [
                        {
                            loc: `${process.env.FRONT_END}${item.slug}`
                        },
                        {
                            lastmod: new Date(item.lastModified ?? item.created)
                                .toISOString()
                                .split("T")[0]
                        }
                    ]
                });
                return items;
            }, []);

            const sitemapObject = {
                urlset: [
                    {
                        _attr: {
                            xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9"
                        }
                    },
                    indexItem,
                    ...sitemapItems,
                    ...predictions()
                ]
            };

            const sitemap = `<?xml version="1.0" encoding="UTF-8"?>${xml(sitemapObject)}`;

            const saveTo = process.env.NODE_ENV === "production"
                ? path.join(__dirname, "/../../../frontend/public/sitemap-pages.xml")
                : path.join(__dirname, "/../../../../WebstormProjects/Betweysure/public/sitemap-pages.xml");

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
