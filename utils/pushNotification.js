const OneSignal = require("onesignal-node");
require('dotenv').config()

async function sendPushNotificationViaOneSignal(content) {
    const client = new OneSignal.Client(process.env.ONESIGNAL_APP_ID, process.env.ONESIGNAL_API_KEY);

    const notification = {
        contents: {
            en: content.message
        },
        headings: {
            en: content.heading || "Betweysure"
        },
        url: content.url,
        included_segments: ["Subscribed Users"],
        // included_segments: ["Test Users"],
        chrome_web_badge:
            "https://firebasestorage.googleapis.com/v0/b/betweysure-511a4.appspot.com/o/images%2Fbws_bell_icon_.png?alt=media&token=9cc69d40-e7f7-4ec9-b2ff-4ea5015275d0" // 72 x 72
    };

    // using async/await
    try {
        const response = await client.createNotification(notification);
        // console.log(response.body.id);
        return true;
    } catch (e) {
        if (e instanceof OneSignal.HTTPError) {
            // When status code of HTTP response is not 2xx, HTTPError is thrown.
            console.log(e.statusCode);
            console.log(e.body);
            return false;
        } else {
            return false;
        }
    }
}

module.exports =  { sendPushNotificationViaOneSignal };
