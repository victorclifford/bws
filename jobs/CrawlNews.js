const NewsCrawler = require("../utils/newsCrawler");

/**
 *  Job: CrawlNews
 */
module.exports = {
    // Job Handler
    async handler(args, job) {
        const providers = [
            /*"https://www.eyefootball.com",*/ "https://www.sportingnews.com/us/soccer/news"
        ];

        for (const provider of providers) {
            if (provider.includes("eyefootball")) {
                await new NewsCrawler(provider).crawlEyeFootball();
            } else {
                await new NewsCrawler(provider).crawlSportingNews();
            }
        }

        // const baseUrl = "https://www.eyefootball.com";
        // const { data } = await axios.get(`${baseUrl}/archive`);
        // const $ = cheerio.load(data);
        // const content = $("#social");
        // const date = content.find("h3").first().text().replace("Football News on ", ""); // Get date
        // const moment = xjs.modules.moment();
        // const dateIsToday = moment(new Date()).isSame(date, "day"); // Check if date is today
        // const dateIsYesterday = moment(new Date()).subtract(1, "days").isSame(date, "day"); // Check if date is yesterday
        // if (dateIsToday || dateIsYesterday) {
        //     const newsData: Array<{ url?: string; title: string }> = [];
        //     content
        //         .first()
        //         .find("a")
        //         .each((i, link) => {
        //             const url = $(link).attr("href");
        //             const title = $(link).text();
        //             newsData.push({ url, title });
        //         });
        //
        //     for (let i = 0; i < newsData.length; i++) {
        //         let article: cheerio.Cheerio<cheerio.Node> | string;
        //         const fetch = await axios.get(`${baseUrl}${newsData[i]?.url}`);
        //         const cheer = cheerio.load(fetch.data);
        //         article = cheer("*[itemprop = 'articleBody']");
        //         article.find("a").each((i, link) => {
        //             if (cheer(link).attr("href")!.indexOf("/") > -1) {
        //                 cheer(link).replaceWith(cheer(link).text());
        //             }
        //         });
        //         if (article.length > 0) {
        //             article = article!.html()!.replace(/<!--.*?-->/g, "");
        //         }
        //         const image = cheer(".article_image").find("img").first().attr("src");
        //         const title = newsData[i]?.title;
        //
        //         const checkIfPostExists = await Post.findOne({ slug: urlSlug(title) });
        //
        //         if (!checkIfPostExists) {
        //             await new Post()
        //                 .set({
        //                     title,
        //                     category: Postcat.id("619c39db532d21411a3c5452"),
        //                     body:
        //                         xjs.base64.decode(xjs.base64.encode(article)).toString().trim() +
        //                         `<br><br><p class='font-semibold'>Source: <a href='${baseUrl}${newsData[i]?.url}' target='_blank' rel="noreferrer noopener">EyeFootball</a></p>`,
        //                     image,
        //                     slug: urlSlug(title),
        //                     createdAt: new Date()
        //                 })
        //                 .save();
        //         }
        //     }
        // }

        return job.end();
    }
};
