const axios = require("axios").default;
const cheerio = require("cheerio");
const urlSlug = require("url-slug");
// import { $ } from "../../xpresser";
const Post = require("../models/Post");
const Postcat = require("../models/Postcat");
const moment =  require('moment');


class NewsCrawler {
    baseUrl;

    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async getNewsID() {
        const category = await Postcat.findOne({ slug: "news" });
        if (category) {
            return category.id().toString();
        } else {
            return null;
        }
    }

    async crawlEyeFootball() {
        const { data } = await axios(`${this.baseUrl}/archive`);
        const c = cheerio.load(data);
        const content = c("#social");
        const date = content.find("h3").first().text().replace("Football News on ", ""); // Get date
        // const moment = $.modules.moment();
        const dateIsToday = moment(new Date()).isSame(date, "day"); // Check if date is today
        const dateIsYesterday = moment(new Date()).subtract(1, "days").isSame(date, "day"); // Check if date is yesterday
        if (dateIsToday || dateIsYesterday) {
            const newsData = [];
            content
                .first()
                .find("a")
                .each((i, link) => {
                    console.log("techie");
                    const url = c(link).attr("href");
                    const title = c(link).text();
                    newsData.push({ url, title });
                });

            for (let i = 0; i < newsData.length; i++) {
                let article;
                const fetch = await axios.get(`${this.baseUrl}${newsData[i]?.url}`);
                const cheer = cheerio.load(fetch.data);
                article = cheer("*[itemprop = 'articleBody']");
                article.find("a").each((i, link) => {
                    if (cheer(link).attr("href").indexOf("/") > -1) {
                        cheer(link).replaceWith(cheer(link).text());
                    }
                });
                if (article.length > 0) {
                    article = article.html().replace(/<!--.*?-->/g, "");
                }
                const image = cheer(".article_image").find("img").first().attr("src");
                const title = newsData[i]?.title;

                const checkIfPostExists = await Post.findOne({ slug: urlSlug(title) });

                if (!checkIfPostExists) {
                    const category = this.getNewsID();

                    // await new Post()
                    //     .set({
                    //         title,
                    //         category: Postcat.id(category),
                    //         body:
                    //             $.base64.decode($.base64.encode(article)).trim() +
                    //             `<br><br><p class='font-semibold'>Source: <a href='${this.baseUrl}${newsData[i]?.url}' target='_blank' rel="noreferrer noopener">EyeFootball</a></p>`,
                    //         image,
                    //         slug: urlSlug(title),
                    //         createdAt: new Date()
                    //     })
                    //     .save();
                }
            }
        }
    }

    async crawlSportingNews() {
        const { data } = await axios(`${this.baseUrl}`);
        const c = cheerio.load(data, {
            decodeEntities: true
        });
        const articles = c("*[role = 'article']");

        const articlesData = [];

        let title;
        let url;
        let image;

        articles.each((i, article) => {
            title = c(article).find(".list-item__title").find("a").text();
            url = c(article).find(".list-item__title").find("a").first().attr("href");
            image = c(article).find("img").first().attr("src");

            articlesData.push({ title, url: url, image: image });
        });

        for (let i = 0; i < articlesData.length; i++) {
            const post = articlesData[i];
            const checkIfPostExists = await Post.findOne({ slug: urlSlug(post.title) });

            if (!checkIfPostExists) {
                const removeBaseFromUrl = post.url.substring(1).split("/").slice(3, 5).join("/");
                console.log(`${this.baseUrl}/${removeBaseFromUrl}`);
                const fetch = await axios.get(`${this.baseUrl}/${removeBaseFromUrl}`);
                const cheer = cheerio.load(fetch.data);
                let mainArticle =
                    cheer(".article-body");
                mainArticle.find("a").each((i, link) => {
                    if (cheer(link).attr("href").indexOf("/") > -1) {
                        cheer(link).replaceWith(cheer(link).text());
                    }
                });
                if (mainArticle.length > 0) {
                    mainArticle = mainArticle
                        .html()
                        .replace(/<!--.*?-->/g, "")
                        .toString();
                }

                const category = this.getNewsID();

                // await new Post()
                //     .set({
                //         title: post.title,
                //         category: Postcat.id(category),
                //         body:
                //             (mainArticle as string) +
                //             `<br><br><p class='font-semibold'>Source: <a href='${this.baseUrl}/${removeBaseFromUrl}' target='_blank' rel="noreferrer noopener">Sporting News</a></p>`,
                //         image,
                //         slug: urlSlug(post.title),
                //         createdAt: new Date()
                //     })
                //     .save();
            }
        }
    }
}

module.exports = NewsCrawler;
