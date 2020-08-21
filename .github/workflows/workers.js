console.log("Working directory:", process.cwd());
const workerNodeModules = `${process.cwd()}/.github/workflows/node_modules`;
const { createRequireFromPath } = require("module");
require = createRequireFromPath(workerNodeModules);
process.env.NODE_PATH = workerNodeModules;
// const resolvePaths = require.resolve.paths;
// require.resolve.paths = (request) =>
//   resolvePaths(request) ? [workerNodeModules, ...resolvePaths(request)] : null;

console.log("NODE_PATH", process.env.NODE_PATH);
console.log("Paths:", require.resolve.paths("nodemailer"));
console.log("Installed modules", require("fs").readdirSync(workerNodeModules));

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
      const template = job.headers.template;
      const { event } = job.variables;
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
        subject: subjects[template](event),
        template,
        context: {
          event,
        },
        // text: "Plaintext version of the message",
        // html: "<p>HTML version of the message</p>",
      };

      transporter.sendMail(message, (err) =>
        err ? complete.failure(err) : complete.success()
      );
    },
  },
};
