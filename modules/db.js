const mysql = require("mysql2/promise");
const config = require("config");
const _ = require("lodash");

const user = config.get("db_user");
const password = config.get("db_password");
const database = config.get("db_database");
const host = config.get("db_host");

const connection = mysql.createPool({
  host,
  user,
  password,
  database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const dbIsCaptchaNotEmpty = (chatId) => {
  return connection
    .execute(
      "select `hash` from `common` where `chatid` = ? and `captcha` = 1",
      [chatId]
    )
    .then(([response]) => response);
};

const dbUpdateAnswer = (value, hash) => {
  return connection.execute(
    "update `common` set `value` = ?, `captcha` = 0, `image` = '' where `hash` = ?",
    [value, hash]
  );
};

const dbUpdateAnswerByChatId = (value, id) => {
  return connection.execute(
    "update `common` set `value` = ?, `captcha` = 0, `image` = '' where `chatid` = ?",
    [value, id]
  );
};

const dbGetIdsList = (chatId) => {
  return connection
    .execute("select `hash` from `common` where `chatid` = ?", [chatId])
    .then(([response]) => response);
};

const dbIsHashAllowed = (hash) => {
  return connection
    .execute("select `hash`, `chatid` from `common` where `hash` = ? limit 1", [
      hash,
    ])
    .then(([response]) => response);
};

const dbAddChatIdToUser = (chatId, hash) => {
  return connection.execute(
    "update `common` set `chatid` = ? where `hash` = ?",
    [chatId, hash]
  );
};

const dbClearChatId = (chatId, hash) => {
  return connection
    .execute(
      "update `common` set `chatid` = 0 where `chatid` = ? and `hash` = ?",
      [chatId, hash]
    )
    .then(([response]) => _.get(response, "affectedRows", 0));
};

const dbSwitchNotification = (chatId, value) => {
  return connection
    .execute("update `common` set `tm_on` = ? where `chatid` = ?", [
      value,
      chatId,
    ])
    .then(([response]) => _.get(response, "affectedRows", 0));
};

module.exports = {
  dbUpdateAnswer,
  dbGetIdsList,
  dbIsHashAllowed,
  dbAddChatIdToUser,
  dbClearChatId,
  dbSwitchNotification,
  dbIsCaptchaNotEmpty,
  dbUpdateAnswerByChatId,
};
