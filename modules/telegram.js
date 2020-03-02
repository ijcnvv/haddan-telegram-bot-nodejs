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

const handleUpdates = async (data, offcet) => {
  if (!_.size(data)) return false;

  let lastUpdateId = offcet;

  for (let i = 0, len = data.length; i < len; i += 1) {
    const item = data[i];
    const updateId = _.get(item, "update_id") || null;
    const chatId = _.get(item, "message.chat.id") || null;
    const text = _.get(item, "message.text") || "";
    const cbQuery = _.get(item, "callback_query") || null;

    if (!updateId || +updateId <= +offcet) continue;

    if (cbQuery) await cbQueryHandler(cbQuery);
    if (/^\/start/i.test(text)) await startHandler(chatId);
    if (/^\/list/i.test(text)) await listHandler(chatId);
    if (/^\/add/i.test(text)) await addHandler(chatId, text);
    if (/^\/remove/i.test(text)) await removeHandler(chatId, text);
    if (/^\/on/i.test(text)) await switchHandler(chatId, true);
    if (/^\/off/i.test(text)) await switchHandler(chatId, false);

    lastUpdateId = updateId;
  }

  return dbSetLastUpdateId(lastUpdateId);
};

const getLastUpdates = async () => {
  const lastUpdateId = await dbGetLastUpdateId();
  const params = { offset: +lastUpdateId + 1 };

  return makeRequest.get("/getUpdates", { params }).then(({ data }) => {
    const { result } = data;
    return handleUpdates(result, lastUpdateId);
  });
};

module.exports = getLastUpdates;
