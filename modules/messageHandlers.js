const config = require("config");
const _ = require("lodash");
const makeRequest = require("./axios");
const connection = require("./db");

const TOKEN = config.get("telegram_token") || "";
const URL = `https://api.telegram.org/${TOKEN}`;

const updateAnswer = (value, hash) => {
  return connection.execute(
    "update `common` set `value` = ?, `captcha` = 0, `image` = '' where `hash` = ?",
    [value, hash]
  );
};

const sendMessage = ({ chat_id, text, disable_notification = false }) => {
  const params = {
    chat_id,
    text,
    disable_notification,
    parse_mode: "HTML"
  };
  return makeRequest.get(`${URL}/sendMessage`, { params });
};

const startHandler = chat_id => {
  const text = `Добро пожаловать! Ниже представлен список команд для управления оповещениями от 
                капч в игре Haddan.\n\n/add <b>xxxxx</b> - привязка персонажа к телеграму, 
                где <b>ххххх</b> уникальный идентификатор, сгенерированный ботом, посмотреть 
                его можно в настройках, во вкладке капча. Привязать можно несколько персонажей, 
                достаточно несколько раз воспользоваться этой командой\n/remove <b>xxxxx</b> - 
                отвязать id от телеграм бота, чтобы при включении оповещений, от этого персонажа 
                ничего не приходило\n\nУникальный идентификатор указывайте <b>через пробел</b>
                \n\n/list - список привязанных <b>id</b>\n/on - включить оповещения\n/off - отключить оповещения.`;
  return sendMessage({ chat_id, text });
};

const cbQueryHandler = query => {
  const data = _.get(query, "data") || "";
  const chat_id = _.get(query, "message.chat.id");
  const reg = /^\/answer\s+(.+?)\s+(.+?)$/i;
  const res = reg.exec(data);

  if (!res) return false;

  const [, answer, userId] = res;
  const text = `Принят ответ ${answer}`;

  updateAnswer(answer, userId);
  return sendMessage({ chat_id, text });
};

const listHandler = chat_id => {
  return connection
    .execute("select `hash` from `common` where `chatid` = ?", [chat_id])
    .then(rows => {
      let text = "Вы не привязали ни одного <b>id</b>";

      if (!_.size(rows)) return sendMessage({ chat_id, text });

      text = rows[0].reduce((acc, row) => {
        return `${acc}<b>${row.hash}</b>\n`;
      }, "Список привязанных id:\n");
      return sendMessage({ chat_id, text });
    });
};

const addHandler = async (chat_id, data) => {
  const reg = /^\/add\s+([A-z\d]+)$/i;
  const res = reg.exec(data);

  if (!res) return false;

  const [, hash] = res;

  const [
    rows
  ] = await connection.execute(
    "select hash, chatid from common where hash = ? limit 1",
    [hash]
  );
  let text = `id <b>${hash}</b> успешно привязан к вашему профилю, теперь капчи из игры будут отправляться сюда`;

  if (!_.size(rows)) {
    text = `id <b>${hash}</b> не существует`;
    return sendMessage({ chat_id, text });
  }

  const chatid = _.get(rows, [0, "chatid"]);

  if (+chatid === +chat_id) {
    text = `id <b>${hash}</b> уже привязан`;
    return sendMessage({ chat_id, text });
  }

  if (+chatid !== 0) {
    text = `id <b>${hash}</b> уже привязан к другомму аккаунту, если он ваш, напишите @ijcnvv`;
    return sendMessage({ chat_id, text });
  }

  connection.execute("update `common` set `chatid` = ? where `hash` = ?", [
    chat_id,
    hash
  ]);
  return sendMessage({ chat_id, text });
};

const removeHandler = async (chat_id, data) => {
  const reg = /^\/remove\s+([A-z\d]+)$/i;
  const res = reg.exec(data);

  if (!res) return false;

  const [, hash] = res;
  let text = `id <b>${hash}</b> отвязан от телеграм бота`;

  const [
    response
  ] = await connection.execute(
    "update `common` set `chatid` = 0 where `chatid` = ? and `hash` = ?",
    [chat_id, hash]
  );
  const { affectedRows } = response;

  if (affectedRows === 0) {
    text =
      "что-то пошло не так, попробуйте снова, либо проверьте подключенные <b>id</b> командой /list";
  }

  return sendMessage({ chat_id, text });
};

const switchHandler = async (chat_id, active = true) => {
  const value = active ? 1 : 0;
  let text = `Оповещение о капчах ${
    active ? "включено, отключить /off" : "отключено, включить /on"
  }`;
  const [
    response
  ] = await connection.execute(
    "update `common` set `tm_on` = ? where `chatid` = ?",
    [value, chat_id]
  );

  const { affectedRows } = response;

  if (affectedRows === 0) {
    text =
      "Вы не привязали <b>id</b> бота к телеграму.\nВоспользуйтесь командой: /add <b>ххххх</b>\nгде <b>ххххх</b> - уникальный идентификатор, сгенерированный ботом";
  }

  return sendMessage({ chat_id, text });
};

module.exports = {
  startHandler,
  cbQueryHandler,
  listHandler,
  addHandler,
  removeHandler,
  switchHandler
};
