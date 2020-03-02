const _ = require("lodash");
const makeRequest = require("./axios");
const {
  dbUpdateAnswer,
  dbGetIdsList,
  dbIsHashAllowed,
  dbAddChatIdToUser,
  dbClearChatId,
  dbSwitchNotification,
  dbIsCaptchaNotEmpty
} = require("./db");

const sendMessage = ({ chat_id, text, disable_notification = false }) => {
  const params = {
    chat_id,
    text,
    disable_notification,
    parse_mode: "HTML"
  };
  return makeRequest.get("/sendMessage", { params });
};

const startHandler = chat_id => {
  const text = `Добро пожаловать! Ниже представлен список команд для управления оповещениями от капч в игре Haddan.\n\n/add <b>xxxxx</b> - привязка персонажа к телеграму, где <b>ххххх</b> уникальный идентификатор, сгенерированный ботом, посмотреть его можно в настройках, во вкладке капча. Привязать можно несколько персонажей, достаточно несколько раз воспользоваться этой командой\n/remove <b>xxxxx</b> - отвязать id от телеграм бота, чтобы при включении оповещений, от этого персонажа ничего не приходило\n\nУникальный идентификатор указывайте <b>через пробел</b>\n\n/list - список привязанных <b>id</b>\n/on - включить оповещения\n/off - отключить оповещения.`;
  return sendMessage({ chat_id, text });
};

const cbQueryHandler = async query => {
  const data = _.get(query, "data") || "";
  const chat_id = _.get(query, "message.chat.id");
  const reg = /^\/answer\s+(.+?)\s+(.+?)$/i;
  const res = reg.exec(data);

  if (!res) return false;

  const response = await dbIsCaptchaNotEmpty(chat_id);
  if (!_.size(response)) return false;

  const [, answer, userId] = res;
  const text = `Принят ответ ${answer}`;

  return dbUpdateAnswer(answer, userId).then(() =>
    sendMessage({ chat_id, text })
  );
};

const listHandler = chat_id => {
  return dbGetIdsList(chat_id).then(rows => {
    let text = "Вы не привязали ни одного <b>id</b>";
    if (!_.size(rows)) return sendMessage({ chat_id, text });

    text = rows.reduce(
      (acc, row) => `${acc}<b>${row.hash}</b>\n`,
      "Список привязанных id:\n"
    );

    return sendMessage({ chat_id, text });
  });
};

const addHandler = async (chat_id, data) => {
  const regexp = /^\/add\s+([A-z\d]+)$/i;
  const result = regexp.exec(data);
  let text = `/add <b>xxxxx</b> - привязка персонажа к телеграму, где <b>ххххх</b> уникальный идентификатор, сгенерированный ботом`;

  if (!result) return sendMessage({ chat_id, text });

  const [, hash] = result;
  const rows = await dbIsHashAllowed(hash);

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

  text = `id <b>${hash}</b> успешно привязан к вашему профилю, теперь капчи из игры будут отправляться сюда`;

  return dbAddChatIdToUser(chat_id, hash).then(() =>
    sendMessage({ chat_id, text })
  );
};

const removeHandler = async (chat_id, data) => {
  const regexp = /^\/remove\s+([A-z\d]+)$/i;
  const result = regexp.exec(data);
  let text = `/remove <b>xxxxx</b> - отвязать id от телеграм бота, чтобы при включении оповещений, от этого персонажа ничего не приходило`;

  if (!result) return sendMessage({ chat_id, text });

  const [, hash] = result;
  const affectedRows = await dbClearChatId(chat_id, hash);
  text = `id <b>${hash}</b> отвязан от телеграм бота`;

  if (affectedRows === 0) {
    text = `что-то пошло не так, попробуйте снова, либо проверьте подключенные <b>id</b> командой /list`;
  }

  return sendMessage({ chat_id, text });
};

const switchHandler = async (chat_id, active = true) => {
  const value = active ? 1 : 0;
  const affectedRows = await dbSwitchNotification(chat_id, value);
  let text = `Оповещение о капчах ${
    active ? "включено, отключить /off" : "отключено, включить /on"
  }`;

  if (affectedRows === 0) {
    text = `Вы не привязали <b>id</b> бота к телеграму.\nВоспользуйтесь командой: /add <b>ххххх</b>\nгде <b>ххххх</b> - уникальный идентификатор, сгенерированный ботом`;
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
