const mysql = require('mysql2/promise');
const config = require('config');
const _ = require('lodash');

const user = config.get('db_user');
const password = config.get('db_password');
const database = config.get('db_database');
const host = config.get('db_host');

const connection = mysql.createPool({
  host,
  user,
  password,
  database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const dbIsCaptchaNotEmptyByPlayerId = (playerId) => {
  return connection
    .execute('select `player_id` from `common` where `captcha` = 1 and `player_id` = ?', [playerId])
    .then(([response]) => response);
};

const dbIsCaptchaNotEmptyByChatId = (chatId) => {
  return connection
    .execute(
      'select `player_id` from `common` inner join `user` on `common`.`user_id` = `user`.`id` where `user`.`tg_id` = ? and `common`.`captcha` = 1',
      [chatId]
    )
    .then(([response]) => response);
};

const dbUpdateAnswer = (value, playerId) => {
  return connection.execute("update `common` set `value` = ?, `captcha` = 0, `image` = '' where `player_id` = ?", [
    value,
    playerId,
  ]);
};

const dbUpdateAnswerByChatId = (value, id) => {
  return connection.execute(
    "update `common` inner join `user` on `common`.`user_id` = `user`.`id` set `common`.`value` = ?, `common`.`captcha` = 0, `common`.`image` = '' where `user`.`tg_id` = ?",
    [value, id]
  );
};

const dbGetIdsList = (chatId) => {
  return connection
    .execute(
      'select `player_id` from `common` inner join `user` on `common`.`user_id` = `user`.`id` where `user`.`tg_id` = ? and `common`.`main_id` is NULL',
      [chatId]
    )
    .then(([response]) => response);
};

const dbIsHashAllowed = (playerId) => {
  return connection
    .execute('select `player_id` from `common` where `player_id` = ? limit 1', [playerId])
    .then(([response]) => response);
};

const dbAddChatIdToUser = (chatId, playerId) => {
  return connection.execute(
    'update `common` inner join `user` on `common`.`user_id` = `user`.`id` set `user`.`tg_id` = ? where `common`.`player_id` = ?',
    [chatId, playerId]
  );
};

const dbClearChatId = (chatId) => {
  return connection
    .execute('update `user` set `tg_id` = 0 where `tg_id` = ?', [chatId])
    .then(([response]) => _.get(response, 'affectedRows', 0));
};

module.exports = {
  dbUpdateAnswer,
  dbGetIdsList,
  dbIsHashAllowed,
  dbAddChatIdToUser,
  dbClearChatId,
  dbIsCaptchaNotEmptyByPlayerId,
  dbIsCaptchaNotEmptyByChatId,
  dbUpdateAnswerByChatId,
};
