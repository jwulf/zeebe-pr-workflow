const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT;
const user = process.env.SMTP_USERNAME;
const pass = process.env.SMTP_PASSWORD;
const secure = process.env.SMTP_TLS == "true";
const from = process.env.SMTP_FROM;
const to = process.env.SMTP_TO;

const subjects = {
  pr_opened: (event) =>
    `Pull Request ${event.number} opened in ${event.pull_request.base.repo.full_name} by ${event.pull_request.head.user.login}`,
};

module.exports = {
  tasks: {
    "send-email": (job, complete) => {
      const template = job.customHeaders.template;
      const { pr } = job.variables;
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      });

      transporter.use("compile", hbs({ viewPath: "templates" }));

      const message = {
        from,
        to,
        subject: subjects[template](pr),
        template,
        context: {
          event: pr,
        },
      };

      const success = (complete) => {
        log.info("Email sent");
        complete.success();
      };

      const failure = (complete, err) => {
        log.info(err);
        complete.failure(err);
      };

      transporter.sendMail(message, (err) =>
        err ? failure(complete, err) : success(complete)
      );
    },
  },
};
