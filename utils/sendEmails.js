const nodemailer = require("nodemailer");

exports.sendNodeMail = (options) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "ae298871a05b81",
      pass: "0a40352f8c0064",
    },
  });
  const mailOptions = {
    from: "<noreply@betweysure.com>",
    to: options.to,
    subject: options.subject,
    html: options.text,
  };

  transporter.sendNodeMail(mailOptions);
};
