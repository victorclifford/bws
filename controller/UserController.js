const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const mjml2html = require("mjml");
const Handlebars = require("handlebars");
const sendEmail = require("../utils/emails");
const mongoose = require("mongoose");
// const { sendNodeMail } = require("../utils/sendEmails");

function UserController() {
  const register = async (req, res) => {
    try {
      // Get user input
      const { firstName, lastName, email, password, phone } = req.body;

      // Validate user input
      if (!(email && password && firstName && lastName)) {
        res.status(400).send("All input is required");
      }

      // check if user already exist
      // Validate if user exist in our database
      const oldUser = await User.findOne({ email });

      if (oldUser) {
        return res.status(409).send("User Already Exist. Please Login");
      }

      //Encrypt user password
      encryptedPassword = await bcrypt.hash(password, 10);

      // Create user in our database
      const user = await User.create({
        firstName,
        lastName,
        phone,
        email: email.toLowerCase(), // sanitize: convert email to lowercase
        password: encryptedPassword,
        level: 1,
        verified: false,
      });

      // Create loginToken
      const loginToken = jwt.sign(
        { user_id: user._id, email },
        process.env.JWT_SECRET,
        {
          expiresIn: "2h",
        }
      );
      // save user loginToken
      user.loginToken = loginToken;

      // create email verification link
      const secret = jwt.sign({ email }, process.env.JWT_SECRET);
      const verifyUrl = `/email/verify/${new Buffer.from(
        secret,
        "utf8"
      ).toString("base64")}`;
      // const verifyUrl  = `/email/verify/${new Buffer.alloc(32, secret).toString('base64')}`;
      // console.log("Verify URL: ", verifyUrl)
      // console.log("Secret: ", secret)
      const verificationUrl = `${process.env.FRONT_END}${verifyUrl}`;
      // const verificationUrl2 = `http://localhost3001/${verifyUrl}`;

      // construct verification email
      const source = fs.readFileSync(
        "./storage/emails/verifyEmail.mjml",
        "utf8"
      );
      const htmlOutput = mjml2html(source);
      const template = Handlebars.compile(htmlOutput.html);
      const templateData = {
        firstName,
        url: verificationUrl,
      };

      // send verification email
      sendEmail(
        email,
        "",
        "Betweysure",
        "Betweysure <noreply@betweysure.com>",
        "Registration Successful",
        "",
        template(templateData)
      );
      // const message = `
      //             <h3>Account Verification</h3>
      //             <p>Welcome to Bet Wey Sure. Please verify your account</p>
      //             <p>current verification status is: ${user.verified}</p>
      //             <a href=${verificationUrl2}>verify</a>
      //         `;

      // sendNodeMail({
      //   to: user.email,
      //   subject: "Verify Your BWS Account",
      //   text: message,
      // });

      // return new user
      res.status(201).json(user);
    } catch (err) {
      console.log(err);
    }
  };

  const login = async (req, res) => {
    try {
      // Get user input
      const { email, password } = req.body;

      // Validate user input
      if (!(email && password)) {
        res.status(400).send("All input is required");
      }
      // Validate if user exist in our database
      const user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .send(
            "Email not yet registered. Please sign up to create an account"
          );
      }

      if (user && (await bcrypt.compare(password, user.password))) {
        // Create loginToken
        const loginToken = jwt.sign(
          { user_id: user._id, email },
          process.env.JWT_SECRET,
          {
            expiresIn: "2h",
          }
        );

        // save user loginToken
        user.loginToken = loginToken;

        // user
        res.status(200).json(user);
      } else {
        res.status(400).send("Email or password incorrect");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const verifyUser = async (req, res) => {
    let verifyToken = req?.params?.verifyToken;
    console.log("params-token::", verifyToken);
    let decoded = Buffer.from(verifyToken, "base64").toString("utf8");

    try {
      decoded = jwt.verify(decoded, process.env.JWT_SECRET);
    } catch (e) {
      // console.log("errFromDecodingToken::", e);
      return res.status(400).send({
        status: "failed",
        msg: "Invalid Token!",
      });
    }

    try {
      const filter = {
        email: decoded?.email,
      };

      const update = {
        verified: true,
        emailVerifiedAt: new Date(),
      };

      let user = await User.findOneAndUpdate(filter, update);
      let verifiedUser = await User.findOne(filter);

      if (verifiedUser?.verified) {
        console.log("User: ", verifiedUser);
        // return res.redirect("http://localhost:3000/");
        return res.status(200).json({
          success: true,
          message: "verification successfull",
          verifiedUser,
        });
      } else {
        return res.send({
          status: "failed",
          msg: "Email link expired",
        });
      }

      // res.send(decoded?.email)
    } catch (err) {
      console.log("Error: ", err);
      return res.status(400).json({ error: err });
    }
  };

  const resendVerificationLink = async (req, res) => {
    let email = req?.body?.email;
    console.log({ email });
    // console.log({ req });
    let user = await User.findOne({ email: email });

    if (user) {
      console.log("User: ", user);

      let email = user?.email;
      let firstName = user?.firstName;

      console.log({
        email: email,
        firstName: firstName,
      });

      // create email verification link
      const secret = jwt.sign({ email }, process.env.JWT_SECRET);
      const verifyUrl = `/email/verify/${new Buffer.from(
        secret,
        "utf8"
      ).toString("base64")}`;
      const verificationUrl = `${process.env.FRONT_END}${verifyUrl}`;
      // const verificationUrl2 = `http://localhost:3001${verifyUrl}`;

      // construct verification email
      const source = fs.readFileSync(
        "./storage/emails/verifyEmail.mjml",
        "utf8"
      );
      const htmlOutput = mjml2html(source);
      const template = Handlebars.compile(htmlOutput.html);
      const templateData = {
        firstName,
        verifyUrl: verificationUrl,
      };
      // const message = `
      //             <h3>Account Verification</h3>
      //             <p>Welcome to Bet Wey Sure. Please verify your account</p>
      //             <p>current verification status is: ${user.verified}</p>
      //             <a href=${verificationUrl2}>${verificationUrl2}</a>
      //         `;

      // send verification email
      sendEmail(
        email,
        "",
        "Betweysure",
        "Betweysure <noreply@betweysure.com>",
        "Registration Successful",
        "",
        template(templateData)
      );
      // sendNodeMail({
      //   to: user.email,
      //   subject: "Verify Your BWS Account",
      //   text: message,
      // });

      res.status(200).send("Done");
    } else {
      res.send({
        status: "success",
        message: "User not found",
      });
    }
  };

  const forgotPassword = async (req, res) => {
    let email = req?.body?.email;
    console.log("Email: ", email);
    let user = await User.findOne({ email: email });

    if (user) {
      console.log("User: ", user);

      let firstName = user?.firstName;

      console.log({
        email: email,
        firstName: firstName,
      });

      // create email verification link
      const secret = jwt.sign({ email }, process.env.JWT_SECRET);
      const verifyUrl = `/email/reset/${new Buffer.from(
        secret,
        "utf8"
      ).toString("base64")}`;
      const verificationUrl = `${process.env.FRONT_END}${verifyUrl}`;

      // construct verification email
      const source = fs.readFileSync(
        "./storage/emails/resetPassword.mjml",
        "utf8"
      );
      const htmlOutput = mjml2html(source);
      const template = Handlebars.compile(htmlOutput.html);
      const templateData = {
        firstName,
        url: verificationUrl,
      };

      // send verification email
      sendEmail(
        email,
        "",
        "Betweysure",
        "Betweysure <noreply@betweysure.com>",
        "Reset your password",
        "",
        template(templateData)
      );

      res.send("Done");
    } else {
      res.send({
        status: "error",
        message: "Email not registered. Please create account.",
      });
    }
  };

  const resetPassword = async (req, res) => {
    let resetToken = req?.params?.resetToken;
    let decoded = Buffer.from(resetToken, "base64").toString("utf8");
    decoded = jwt.verify(decoded, process.env.JWT_SECRET);

    try {
      const filter = {
        email: decoded?.email,
      };

      const update = {
        password: bcrypt.hashSync(req.body.password, 10),
      };

      console.log("Update: ", update);

      let user = await User.findOneAndUpdate(filter, update);
      let updatedUser = await User.findOne(filter);

      if (updatedUser) {
        console.log("User: ", updatedUser);
        res.send({
          status: "success",
          msg: "Password reset successful.",
        });
      } else {
        res.send({
          status: "failed",
          msg: "Password reset failed. Please try again.",
        });
      }

      // res.send(decoded?.email)
    } catch (err) {
      console.log("Error: ", err);
    }
  };

  return {
    register,
    login,
    verifyUser,
    resendVerificationLink,
    forgotPassword,
    resetPassword,
  };
}

module.exports = UserController;
