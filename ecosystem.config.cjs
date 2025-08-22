module.exports = {
  apps: [
    {
      name: "inspect-service",
      script: "yarn",
      args: "start",
      exec_mode: "cluster",
      instances: 1,
      interpreter: "/usr/bin/node",
    },
  ],
};
