const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const mjml2html = require("mjml");
const Handlebars = require("handlebars");
const sendEmail = require("../utils/emails");
const mongoose = require("mongoose");
const BundleCategory = require("../models/BundleCategory");
const Joi = require("joi");
const Bundle = require("../models/Bundle");
const Subscription = require("../models/Subscription");
const _ = require("lodash");
const {sendPushNotificationViaOneSignal} = require("../utils/pushNotification");
const Transaction = require("../models/Transaction");
const moment = require("moment");
const path = require("path");
const UserTip = require("../models/UserTip");
const NewsAPI = require('newsapi');
const newsapi = new NewsAPI('288dab4caa624cf79daa72343e130de4');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const axios = require("axios");
const {json} = require("express");


/***
 *
 *
 * @returns {{crawlNews: ((function(*, *): Promise<void>)|*), getNews: getNews, getNewsSources: getNewsSources}}
 * @constructor
 *
 * TO DO:
 * convert crawlNews and getNewsSources to helper functions
 */




function BlogController(){
    const crawlNews = async (req, res) => {

        fs.readFile('./storage/news/news-sources.json', (err, data) => {
            if (err) throw err;
            // parse news sources from json data
            let news_sources = JSON.parse(data);
            news_sources = news_sources?.sources
            // console.log(news_sources);

            // extract the names of sources and domains of sources
            let names_of_sources = news_sources.map(value => value.name.replaceAll(" ","-").toLowerCase());
            let domains_of_sources = news_sources.map(value => value.url);

            // format the names and domains into the string pattern for the request
            names_of_sources = names_of_sources.join(", ")
            domains_of_sources = domains_of_sources.join(", ")

            console.log('Names: ', names_of_sources)
            console.log('Domains: ', domains_of_sources)

            // set search parameters
            let query = 'soccer'
            const today = new Date()
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)
            const language = 'en'
            const sortby = 'relevancy'

            newsapi.v2.everything({
                q: query,
                sources: names_of_sources,
                domains: domains_of_sources,
                from: yesterday,
                to: today,
                language: language,
                sortBy: sortby,
            }).then(response => {

                // get articles from the responses
                let articles = response?.articles

                // get the urls for all the articles
                const urls = articles.map(value => value.url)

                for (let i = 0; i < urls.length; i++){
                    axios.get(urls[i]).then(function(r2) {

                        // We now have the article HTML, but before we can use Readability to locate the article content we need jsdom to convert it into a DOM object
                        let dom = new JSDOM(r2.data, {
                            url: urls[i]
                        });

                        // now pass the DOM document into readability to parse
                        let article = new Readability(dom.window.document).parse();

                        // Done! The article content is in the textContent property
                        articles[i].fullContent = article.textContent
                        console.log(article.textContent);

                        // for the last one, send the articles
                        if (i === urls.length-1){
                            fs.writeFile('./storage/news/full-news-scraped.json', JSON.stringify(articles), (err) => {
                                if (err) {
                                    // throw err;
                                    res.send({
                                        status: 'error',
                                        message: err.toString()
                                    })
                                }
                                console.log("Appended to file")
                                res.send({
                                    status: "success",
                                    message: articles
                                })
                            });


                            // res.send({
                            //     status: 'success',
                            //     msg: articles
                            // })
                        }
                    })
                        .catch(err => {
                            console.log("Error: ", err)
                        })


                }

                // fs.writeFile('./storage/news/full-news.json', JSON.stringify(articles), (err) => {
                //     if (err) {
                //         // throw err;
                //         res.send({
                //             status: 'error',
                //             message: err.toString()
                //         })
                //     }
                //     res.send({
                //         status: "success",
                //         message: response
                //     })
                // });

                //
                // res.send({
                //     status: 'success',
                //     message: articles
                // })
            })
                .catch(err => {
                    res.send({
                        status: "error",
                        msg: err.toString()
                    })
                })

            // res.send({
            //     status: 'success',
            //     data: news_sources
            // })
        });
        // newsapi.v2.everything({
        //     q: 'bitcoin',
        //     sources: 'bbc-news,the-verge',
        //     domains: 'bbc.co.uk, techcrunch.com',
        //     from: '2017-12-01',
        //     to: '2017-12-12',
        //     language: 'en',
        //     sortBy: 'relevancy',
        //     page: 2
        // }).then(response => {
        //     res.send({
        //         status: 'success',
        //         msg: response
        //     })
        // })
        //     .catch(err => {
        //         res.send({
        //             status: "error",
        //             msg: err.toString()
        //         })
        //     })
    }

    const readCrawledNews = async (req, res) => {
        fs.readFile('./storage/news/full-news-scraped.json', (err, data) => {
            if (err) throw err;
            // parse news sources from json data
            let articles = JSON.parse(data);

            res.send({
                status: 'success',
                message: articles
            })
        })
    }

    const getNewsSources = (req, res) => {
        newsapi.v2.sources({
            category: 'sports',
            language: 'en',
        }).then(response => {
            console.log(response);
            let data = JSON.stringify(response, null, 2)
            fs.writeFile('./storage/news/news-sources.json', data, (err) => {
                if (err) {
                    // throw err;
                    res.send({
                        status: 'error',
                        message: err.toString()
                    })
                }
                res.send({
                    status: "success",
                    message: response
                })
            });
            /*
              {
                status: "ok",
                sources: [...]
              }
            */
        })
            .catch(err => {
                res.send({
                    status: "error",
                    message: err.toString()
                })
            })
    }

    const getNews = (req, res) => {
        fs.readFile('./storage/news/full-news.json', (err, data) => {
            if (err) res.send({
                status: 'error',
                message: err.toString()
            });

            let news = JSON.parse(data)

            res.send({
                status: 'success',
                data: news
            })
        })
    }

    return { crawlNews, getNewsSources, getNews, readCrawledNews }
}

module.exports = BlogController;
