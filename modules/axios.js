const axios = require("axios");
const config = require("config");

const TOKEN = config.get("telegram_token");
const baseURL = `https://api.telegram.org/${TOKEN}`;
const headers = { "Content-Type": "application/json" };
const timeout = 5000;

const api = axios.create({ baseURL, timeout, headers });

module.exports = api;
