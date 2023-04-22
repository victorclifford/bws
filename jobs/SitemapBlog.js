const moment = require("moment");
const xml = require("xml");
const writeFile = require("fs").writeFile;
const promisify = require("util").promisify;
const Post =  require("../models/Post");
const path = require("path");

const writeFileAsync = promisify(writeFile);
const fs = require(fs)

/**
 *  Job: Sitemap
 */
module.exports = {
    // Job Handler
    async handler(args, job) {
        try {
            const blogPosts = await Post.find({});

            const siteMapData = [];

            if (blogPosts.length) {
                for (const post of blogPosts) {
                    siteMapData.push({
                        url: `${process.env.FRONT_END}/blog/${post.slug}`,
                        lastmod: new Date(typeof post.updatedAt !== "undefined" ? post.updatedAt : post.createdAt)
                            .toISOString()
                            .split("T")[0]
                    });
                }
            }


            const indexItem = {
                //build index item
                url: [
                    {
                        loc: $.env("FRONT_END") + "/blog"
                    },
                    {
                        lastmod: new Date(
                            Math.max.apply(
                                null,
                                blogPosts.map((page) => {
                                    return new Date(
                                        page.updatedAt ?? page.createdAt
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

            const sitemapItems = siteMapData.reduce(function(
                items,
                item
            ) {
                // build page items
                items.push({
                    url: [
                        {
                            loc: item.url
                        },
                        {
                            lastmod: new Date(item.lastmod)
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
                    ...sitemapItems
                ]
            };

            const sitemap = `<?xml version="1.0" encoding="UTF-8"?>${xml(sitemapObject)}`;

            const saveTo = process.env.NODE_ENV === "production"
                ? path.join(__dirname, "/../../../frontend/public/sitemap-blog.xml")
                : path.join(__dirname, "/../../../../WebstormProjects/Betweysure/public/sitemap-blog.xml");

            await fs.writeFile(saveTo, sitemap, {
                encoding: "utf8",
                flag: "w"
            });
            // await writeFileAsync("./sitemap_blog.xml", sitemap, {
            //     encoding: "utf8",
            //     flag: "w"
            // });
        } catch (e) {
            console.log(e);
        }
        return job.end();
    }
};
