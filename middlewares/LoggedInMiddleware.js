const jwt = require("jsonwebtoken");
// import { Http } from "xpresser/types/http";
const User = require("../models/User");

/**
 * LoggedInMiddleware
 */
module.exports = {
    /**
     * Default Middleware Action
     * @param {Xpresser.Http} http
     */
    async allow(http) {
        const bearerHeader = http.req.headers["authorization"];
        if (bearerHeader) {
            const bearer = bearerHeader.split(" ");
            const bearerToken = bearer[1];

            try {
                const decoded = jwt.verify(bearerToken);
                if (decoded) {
                    if (Date.now() <= decoded.exp + Date.now() + 60 * 60) {
                        http.state.set("id", decoded.id);
                        const findUserByID = await User.findById(decoded.id);

                        if (
                            findUserByID &&
                            findUserByID.get("loginToken") === decoded.token &&
                            findUserByID.get("level") === 1
                        ) {
                            return http.next();
                        }
                        return http.status(400).send({
                            status: "failed",
                            msg: "Invalid token supplied"
                        });
                    } else {
                        return http.status(401).send({
                            status: "failed",
                            msg: "Token expired"
                        });
                    }
                } else {
                    return http.status(403).send({
                        status: "failed",
                        msg: "Invalid token supplied"
                    });
                }
            } catch (e) {
                return http.status(401).send({
                    status: "failed",
                    msg: "Token expired"
                });
            }
        }
        return http.status(403).send({
            status: "failed",
            msg: "Token not found"
        });
    }
};
