const nodemailer = require("nodemailer");
const { render } = require("micromustache");
const relativeTime = require("dayjs/plugin/relativeTime");
const dayjs = require("dayjs");
dayjs.extend(relativeTime);

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT;
const user = process.env.SMTP_USERNAME;
const pass = process.env.SMTP_PASSWORD;
const secure = process.env.SMTP_TLS == "true";
const from = process.env.SMTP_FROM;
const to = process.env.SMTP_TO;

const { mainTemplate } = require("./templates/main");
const { pr_opened } = require("./templates/pr_opened");
const { one_day } = require("./templates/one_day");
const { two_daily } = require("./templates/two_daily");
const { closed } = require("./templates/closed");

const subjects = {
  closed: (pr) =>
    `Pull Request #${pr.number} ${pr.pull_request.base.repo.full_name} by ${pr.pull_request.head.user.login} closed after ${pr.daysOpen}`,
  one_day: (pr) =>
    `Pull Request #${pr.number} ${pr.pull_request.base.repo.full_name} by ${pr.pull_request.head.user.login} opened 24 hours ago`,
  two_day: (pr) =>
    `Pull Request #${pr.number} ${pr.pull_request.base.repo.full_name} by ${pr.pull_request.head.user.login} open for ${pr.daysOpen}`,
  pr_opened: (pr) =>
    `Pull Request #${pr.number} opened in ${pr.pull_request.base.repo.full_name} by ${pr.pull_request.head.user.login}`,
};

const bodyTemplates = {
  closed,
  one_day,
  two_daily,
  pr_opened,
};

module.exports = {
  tasks: {
    "ignore-internal": (job, complete) => {
      const { pr } = job.variables;

      const isInternalContribution =
        pr.pull_request.base.repo.url === pr.pull_request.head.repo.url;

      const prCorrelationId = pr.pull_request._links.html.href;

      return isInternalContribution
        ? zbc.publishMessage({
            name: "pr_closed",
            correlationKey: prCorrelationId,
            variables: {},
            ttl: 10,
          })
        : complete.success();
    },
    "publish-correlated-message": (job, complete) => {
      const { message } = job.variables;
      const correlationKey = message.pr.pull_request._links.html.href;

      zbc
        .publishMessage({
          name: message.messageName,
          correlationKey,
          variables: {
            pr: message.pr,
          },
          ttl: 10,
        })
        .then(() => complete.success())
        .catch(() => complete.failure());
    },
    "send-email": (job, complete) => {
      const template = job.customHeaders.template;
      const { pr } = job.variables;

      pr.daysOpen = dayjs().from(dayjs(pr.pull_request.created_at), true);

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
