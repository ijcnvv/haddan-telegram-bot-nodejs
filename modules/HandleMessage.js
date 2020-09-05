const _ = require("lodash");
const DB = require("./db");

const startHandler = (msg, sendMessage) => {
  const fromId = msg.from.id;
  const text = `Добро пожаловать! Ниже представлен список команд для управления оповещениями от капч в игре Haddan.\n\n/add <b>xxxxx</b> - привязка персонажа к телеграму, где <b>ххххх</b> уникальный идентификатор, сгенерированный ботом, посмотреть его можно в настройках, во вкладке капча. Привязать можно несколько персонажей, достаточно несколько раз воспользоваться этой командой\n/remove <b>xxxxx</b> - отвязать id от телеграм бота, чтобы при включении оповещений, от этого персонажа ничего не приходило\n\nУникальный идентификатор указывайте <b>через пробел</b>\n\n/list - список привязанных <b>id</b>\n/on - включить оповещения\n/off - отключить оповещения.`;
  return sendMessage(fromId, text);
};

const onHandler = async (msg, sendMessage) => {
  const fromId = msg.from.id;
  const affectedRows = await DB.dbSwitchNotification(fromId, 1);
  let text = "Оповещение о капчах включено, отключить /off";

  if (!affectedRows) {
    text = `Вы не привязали <b>id</b> бота к телеграму.\nВоспользуйтесь командой: /add <b>ххххх</b>\nгде <b>ххххх</b> - уникальный идентификатор, сгенерированный ботом`;
  }

  return sendMessage(fromId, text);
};

const offHandler = async (msg, sendMessage) => {
  const fromId = msg.from.id;
  const affectedRows = await DB.dbSwitchNotification(fromId, 0);
  let text = "Оповещение о капчах отключено, включить /on";

  if (!affectedRows) {
    text = `Вы не привязали <b>id</b> бота к телеграму.\nВоспользуйтесь командой: /add <b>ххххх</b>\nгде <b>ххххх</b> - уникальный идентификатор, сгенерированный ботом`;
  }

  return sendMessage(fromId, text);
};

const listHandler = async (msg, sendMessage) => {
  const fromId = msg.from.id;
  const rows = await DB.dbGetIdsList(fromId);
  let text = "Вы не привязали ни одного <b>id</b>";

  if (!_.size(rows)) return sendMessage(fromId, text);

  text = rows.reduce(
    (acc, row) => `${acc}<b>${row.hash}</b>\n`,
    "Список привязанных id:\n"
  );

  return sendMessage(fromId, text);
};

const addHandler = async (msg, match, sendMessage) => {
  const fromId = msg.from.id;
  const regexp = /^\s+([A-z\d]+)$/i;
  const result = regexp.exec(match[1]);
  let text = `/add <b>xxxxx</b> - привязка персонажа к телеграму, где <b>ххххх</b> уникальный идентификатор, сгенерированный ботом`;

  if (!result) return sendMessage(fromId, text);

  const [, hash] = result;
  const rows = await DB.dbIsHashAllowed(hash);

  if (!_.size(rows)) {
    text = `id <b>${hash}</b> не существует`;
    return sendMessage(fromId, text);
  }

  const chatid = _.get(rows, [0, "chatid"]);

  if (+chatid === +fromId) {
    text = `id <b>${hash}</b> уже привязан`;
    return sendMessage(fromId, text);
  }

  if (+chatid !== 0) {
    text = `id <b>${hash}</b> уже привязан к другомму аккаунту, если он ваш, напишите @ijcnvv`;
    return sendMessage(fromId, text);
  }

  text = `id <b>${hash}</b> успешно привязан к вашему профилю, теперь капчи из игры будут отправляться сюда`;

  await DB.dbAddChatIdToUser(fromId, hash);
  return sendMessage(fromId, text);
};

const removeHandler = async (msg, match, sendMessage) => {
  const fromId = msg.from.id;

  const regexp = /^\s+([A-z\d]+)$/i;
  const result = regexp.exec(match[1]);
  let text = `/remove <b>xxxxx</b> - отвязать id от телеграм бота, чтобы при включении оповещений, от этого персонажа ничего не приходило`;

  if (!result) return sendMessage(fromId, text);

  const [, hash] = result;
  const affectedRows = await DB.dbClearChatId(fromId, hash);
  text = `id <b>${hash}</b> отвязан от телеграм бота`;

  if (!affectedRows) {
    text = `что-то пошло не так, попробуйте снова, либо проверьте подключенные <b>id</b> командой /list`;
  }

  return sendMessage(fromId, text);
};

const btnHandler = async (msg, sendMessage) => {
  const data = _.get(msg, "data") || "";
  const fromId = msg.from.id;
  const reg = /^\/answer\s+(.+)\s+(.+?)$/i;
  const res = reg.exec(data);

  if (!res) return false;

  const response = await DB.dbIsCaptchaNotEmpty(fromId);
  if (!_.size(response)) return false;

  const [, answer, userId] = res;
  const text = `Принят ответ ${answer}`;

  await DB.dbUpdateAnswer(answer, userId);
  return sendMessage(fromId, text);
};

module.exports = {
  startHandler,
  onHandler,
  offHandler,
  listHandler,
  addHandler,
  removeHandler,
  btnHandler,
};
