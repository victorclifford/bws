import { $ } from "../../xpresser";

const Route = $.router;
Route.path("/api", () => {
    require("./auth.routes");
    require("./userRoute");
    require("./adminRoutes");
});
