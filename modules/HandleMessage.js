const _ = require('lodash');
const DB = require('./db');

const addText = `/add <b>xxxxx</b> - привязка персонажа к телеграму, где <b>ххххх</b> id - персонажа.`;
const removeText = `/remove <b>xxxxx</b> - отвязать id от телеграм бота, чтобы при включении оповещений, от этого персонажа ничего не приходило.`;

const startHandler = (msg, sendMessage) => {
  const fromId = msg.from.id;
  const text = `Добро пожаловать! Ниже представлен список команд для управления оповещениями от капч в игре Haddan.\n
${addText} Привязать можно несколько персонажей, достаточно несколько раз воспользоваться этой командой\n
${removeText}\n
ID персонажа указывайте <b>через пробел</b>, ID инкорнаций необходимо привязывать отдельно.\n
/list - список привязанных <b>id</b>`;
  return sendMessage(fromId, text);
};

const listHandler = async (msg, sendMessage) => {
  const fromId = msg.from.id;
  const rows = await DB.dbGetIdsList(fromId);
  let text = 'Вы не привязали ни одного <b>id</b>';

  if (!_.size(rows)) return sendMessage(fromId, text);

  text = rows.reduce((acc, row) => `${acc}<b>${row.player_id}</b>\n`, 'Список привязанных id:\n');

  return sendMessage(fromId, text);
};

const addHandler = async (msg, match, sendMessage) => {
  const fromId = msg.from.id;
  const regexp = /^\s+(\d+)$/i;
  const result = regexp.exec(match[1]);
  let text = addText;

  if (!result) return sendMessage(fromId, text);

  const [, playerId] = result;
  const rows = await DB.dbIsHashAllowed(playerId);

  if (!_.size(rows)) {
    text = `id <b>${playerId}</b> не существует`;
    return sendMessage(fromId, text);
  }

  const chatid = _.get(rows, [0, 'chatid']);

  if (+chatid === +fromId) {
    text = `id <b>${playerId}</b> уже привязан`;
    return sendMessage(fromId, text);
  }

  if (+chatid !== 0) {
    text = `id <b>${playerId}</b> уже привязан к другомму аккаунту, если он ваш, напишите @ijcnvv`;
    return sendMessage(fromId, text);
  }

  text = `id <b>${playerId}</b> успешно привязан к вашему профилю`;

  await DB.dbAddChatIdToUser(fromId, playerId);
  return sendMessage(fromId, text);
};

const removeHandler = async (msg, match, sendMessage) => {
  const fromId = msg.from.id;

  const regexp = /^\s+([A-z\d]+)$/i;
  const result = regexp.exec(match[1]);
  let text = removeText;

  if (!result) return sendMessage(fromId, text);

  const [, playerId] = result;
  const affectedRows = await DB.dbClearChatId(fromId, playerId);
  text = `id <b>${playerId}</b> отвязан от телеграм бота`;

  if (!affectedRows) {
    text = `что-то пошло не так, попробуйте снова, либо проверьте подключенные <b>id</b> командой /list`;
  }

  return sendMessage(fromId, text);
};

const btnHandler = async (msg, sendMessage) => {
  const data = _.get(msg, 'data') || '';
  const fromId = msg.from.id;
  const reg = /^\/answer\s+(.+)\s+(.+?)$/i;
  const res = reg.exec(data);

  if (!res) return false;

  const [, answer, playerId] = res;
  const text = `Принят ответ ${answer}`;
  const response = await DB.dbIsCaptchaNotEmptyByPlayerId(playerId);
  if (!_.size(response)) return false;

  await DB.dbUpdateAnswer(answer, playerId);
  return sendMessage(fromId, text);
};

const answerHandler = async (msg, sendMessage) => {
  const fromId = msg.from.id;
  const answer = msg.text;
  const text = `Принят ответ ${answer}`;
  const response = await DB.dbIsCaptchaNotEmptyByChatId(fromId);

  if (!_.size(response)) return false;

  await DB.dbUpdateAnswerByChatId(answer, fromId);
  return sendMessage(fromId, text);
};

module.exports = {
  startHandler,
  listHandler,
  addHandler,
  removeHandler,
  btnHandler,
  answerHandler,
};
