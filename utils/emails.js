const Mailjet = require('node-mailjet');
const fs = require("fs");
const Handlebars = require("handlebars");
const path = require("path");
const mjml2html = require("mjml");

require('dotenv').config()


const mailjet = Mailjet.apiConnect(
    process.env.MAILJET_API,
    process.env.MAILJET_SECRET,
);

const source = fs.readFileSync(path.resolve("./storage/emails/contactus.mjml"), "utf8");
const htmlOutput = mjml2html(source);
const template = Handlebars.compile(htmlOutput.html);
const templateData = {
    fullName: "Mudiaga Obriki",
    email: "mudiinvents@gmail.com",
    message: "Hello Mudi"
};

function sendEmail(toEmail, toName, fromName, fromEmail, subject, textPart, HTMLPart){
    const request = mailjet
        .post('send', { version: 'v3.1' })
        .request({
            Messages: [
                {
                    From: {
                        Email: `${fromEmail}`,
                        Name: `${fromName}`
                    },
                    To: [
                        {
                            Email: `${toEmail}`,
                            Name: `${toName}`
                        }
                    ],
                    Subject: `${subject}`,
                    TextPart: `${textPart}`,
                    HTMLPart: `${HTMLPart}`
                }
            ]
        })

    request
        .then((result) => {
            console.log(result.body)
            console.log("Message sent successfully!")
        })
        .catch((err) => {
            console.log(err.statusCode)
        })

}

module.exports = sendEmail;

// sendEmail("mudiinvents@gmail.com","Mudiaga Obriki","Betweysure","Betweysure <noreply@betweysure.com>",
//     "Welcome to Betweysure", "Welcome Mudi", template(templateData))
