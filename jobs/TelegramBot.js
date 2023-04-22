const momentT = require("moment-timezone");
const { Telegraf } = require('telegraf');

/**
 *  Job: TelegramBot
 */
module.exports = {
    // Job Handler
    async handler(args, job) {
        // Your Job Here
        const ctx = new Telegraf(process.env.TELEGRAM_TOKEN);

        const currentTime = momentT().tz("Africa/Lagos").format();
        console.log(currentTime);

        await ctx.telegram.sendMessage(
            process.env.CHAT_ID,
            "STAY CONNECTED FOR TIPS OF THE DAY \n\r \n Coming soon..."
        );

        // End current job process.
        return job.end();
    }
};
