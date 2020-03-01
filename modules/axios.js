const axios = require("axios");

const headers = {
  "Content-Type": "application/json"
};

const api = axios.create({ headers });

module.exports = api;
