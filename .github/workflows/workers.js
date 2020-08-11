log.info(__dirname);
module.exports = {
  tasks: {
    "send-email": (job, complete) => {
      log.info(JSON.stringify(job, null, 2));
      complete.success();
    },
  },
};
