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

const dbUpdateAnswer = (value, playerId) => {
  return connection.execute(
    "update `common` set `value` = ?, `captcha` = 0, `image` = '' where `player_id` = ?",
    [value, playerId]
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
    .execute("select `player_id` from `common` where `chatid` = ?", [chatId])
    .then(([response]) => response);
};

const dbIsHashAllowed = (playerId) => {
  return connection
    .execute(
      "select `player_id`, `chatid` from `common` where `player_id` = ? limit 1",
      [playerId]
    )
    .then(([response]) => response);
};

const dbAddChatIdToUser = (chatId, playerId) => {
  return connection.execute(
    "update `common` set `chatid` = ? where `player_id` = ?",
    [chatId, playerId]
  );
};

const dbClearChatId = (chatId, playerId) => {
  return connection
    .execute(
      "update `common` set `chatid` = 0 where `chatid` = ? and `player_id` = ?",
      [chatId, playerId]
    )
    .then(([response]) => _.get(response, "affectedRows", 0));
};

module.exports = {
  dbUpdateAnswer,
  dbGetIdsList,
  dbIsHashAllowed,
  dbAddChatIdToUser,
  dbClearChatId,
  dbIsCaptchaNotEmpty,
  dbUpdateAnswerByChatId,
};
