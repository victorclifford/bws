const moment = require("moment");
const Subscription = require("../models/Subscription");

/**
 *  Job: Subscription
 */
module.exports = {
    // Job Handler
    async handler(args, job) {
        // Your Job Here

        const subscriptions = await Subscription.find({ status: "active" });

        const subscribers = Subscription.fromArray(subscriptions);

        if (subscriptions) {
            for (const sub of subscribers) {
                const checkSubscription = moment(new Date()).isAfter(
                    moment(sub.data.createdAt).add(sub.data.duration, "d")
                );

                if (checkSubscription) {
                    await sub
                        .set({
                            status: "expired"
                        })
                        .save();
                }
            }
        }
        // End current job process.
        return job.end();
    }
};
