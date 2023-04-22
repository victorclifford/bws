import { EventsController } from "@xpresser/events-server/js/src/Types";
import Notification from "../../backend/models/Notification";
import User from "../../backend/models/User";

/**
 * NotificationsController
 */

type NotificationData = {
    title: string;
    message: string;
};

export = <EventsController>{
    /**
     * Example Action
     * @param ctx - contains the context
     * @param $data - should contain the notification data to send
     */
    async sendNotifications(ctx: any, $data: NotificationData) {
        const fetchUsers = await User.find({});

        const users = User.fromArray(fetchUsers);

        for (const user of users) {
            await new Notification()
                .set({
                    user: user.id().toString(),
                    title: $data.title,
                    message: $data.message
                })
                .save();
        }
    }
};
