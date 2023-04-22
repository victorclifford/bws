import { $ } from "../../xpresser";

const Route = $.router;

Route.path("auth/", () => {
    Route.post("@register");
    Route.post("@login");
    Route.get("@logout");
    Route.path("email/verify", () => {
        Route.get("=verifyEmail");
        Route.post("resend", "resendVerificationLink");
    });
    Route.post("forgot-password", "forgotPassword");
    Route.post("reset-password", "resetPassword");
}).controller("AuthController");
