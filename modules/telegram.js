const config = require("config");
const _ = require("lodash");
const makeRequest = require("./axios");
const { dbGetLastUpdateId, dbSetLastUpdateId } = require("./db");
const {
  startHandler,
  cbQueryHandler,
  listHandler,
  addHandler,
  removeHandler,
  switchHandler
} = require("./messageHandlers");

const TOKEN = config.get("telegram_token") || "";
const URL = `https://api.telegram.org/${TOKEN}`;

const handleUpdates = (data, offcet) => {
  if (!_.size(data)) return;

  let lastUpdateId = offcet;

  data.forEach(item => {
    const updateId = _.get(item, "update_id") || null;
    const chatId = _.get(item, "message.chat.id") || null;
    const text = _.get(item, "message.text") || "";
    const cbQuery = _.get(item, "callback_query") || null;

    if (!updateId || +updateId <= +offcet) return false;

    lastUpdateId = updateId;

    if (cbQuery) return cbQueryHandler(cbQuery);
    if (/^\/start/i.test(text)) return startHandler(chatId);
    if (/^\/list/i.test(text)) return listHandler(chatId);
    if (/^\/add/i.test(text)) return addHandler(chatId, text);
    if (/^\/remove/i.test(text)) return removeHandler(chatId, text);
    if (/^\/on/i.test(text)) return switchHandler(chatId, true);
    if (/^\/off/i.test(text)) return switchHandler(chatId, false);
  });

  dbSetLastUpdateId(lastUpdateId);
};

const getLastUpdates = async () => {
  const offset = await dbGetLastUpdateId();
  const params = { offset };

  return makeRequest.get(`${URL}/getUpdates`, { params }).then(({ data }) => {
    const { result } = data;
    return handleUpdates(result, offset);
  });
};

module.exports = getLastUpdates;
