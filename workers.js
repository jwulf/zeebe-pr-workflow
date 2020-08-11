log.info(__dirname);
module.exports = {
  tasks: {
    email: (job, complete) => {
      complete.success();
    },
  },
};
