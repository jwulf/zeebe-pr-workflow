const nodemailer = require("nodemailer");
const { render } = require("micromustache");

const { mainTemplate } = require("./templates/main");
const { pr_opened } = require("./templates/pr_opened");

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

const bodyTemplates = {
  pr_opened,
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

      const body = render(bodyTemplates[template], { event: pr });
      const html = render(mainTemplate, { body });

      const message = {
        from,
        to,
        subject: subjects[template](pr),
        html,
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
