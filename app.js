const express = require("express");
const config = require("config");
const { CronJob } = require("cron");
const fetchTelegramUpdates = require("./modules/telegram");

const app = express();
const PORT = config.get("port") || 3000;
const telegramJob = new CronJob("*/5 * * * * *", fetchTelegramUpdates);

telegramJob.start();

app.listen(PORT, () => console.log("app has been started"));
