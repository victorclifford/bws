const axios = require("axios").default;
// const env = require("../../env");

require('dotenv').config()
const http = async (url) => {
    try {
        const { data } = await axios(url, {
            params: {
                api_token: process.env.DATA_TOKEN
            }
        });
        return data;
    } catch (e) {
        console.dir(e);
    }
};

module.exports = http;
