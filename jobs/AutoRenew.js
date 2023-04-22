const Transaction = require("../models/Transaction");
const User = require("../models/User");

const user = {
    email: 'mudiinvents@gmail.com',
    password: '123456'
}

/**
 *  Job: AutoRenew
 */
module.exports = {
    // Job Handler
    async handler(args, job) {
        console.log("me");
        const paidUsers = [
            "njuefekt@gmail.com",
            "olatt36@gmail.com",
            "emmyjflex@gmail.com",
            "cyedechime@gmail.com",
            "cyedechime@gmail.com",
            "ibiduro@gmail.com"
        ];

        for (const user of paidUsers) {
            console.log(user);
            const getUserInfo = await User.findOne({ email: user });
            if (getUserInfo) {
                console.info(`User: ${getUserInfo.get("email")}`);

                console.log(getUserInfo.get("_id"));

                const getSubscription = await Transaction.findOne({
                    user: getUserInfo.get("_id").toString()
                });

                if(getSubscription) {
                    await getSubscription.set({
                        status: "success"
                    })
                }
                console.log("subscription", getSubscription?.data);
            } else {
                console.error(`User: ${user} not found`);
            }
        }
        // Your Job Here
        // const subscriptions = await Subscription.find({ status: "active" });`

        // Fluterwave token (3388643)

        //Paystack token - randstring

        // End current job process.
        return job.end();
    }
};
