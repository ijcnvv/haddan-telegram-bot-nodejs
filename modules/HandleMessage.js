const _ = require('lodash');
const DB = require('./db');

const addText = `/add <b>xxxxx</b> - привязка всех ваших персонажей к телеграму, где <b>ххххх</b> id - любого вашего персонажа.`;
const removeText = `/remove - отвязать всех персонажей от телеграм бота, чтобы оповещения о капчах больше не приходили`;

const startHandler = (msg, sendMessage) => {
  const fromId = msg.from.id;
  const text = `Добро пожаловать! Ниже представлен список команд для управления оповещениями от капч в игре Haddan.\n
${addText}\n
${removeText}\n
ID персонажа указывайте <b>через пробел</b>.\n
/list - список привязанных <b>id</b>`;
  return sendMessage(fromId, text);
};

const getIdsList = (list) => {
  if (!_.size(list)) return 'Вы не привязали ни одного <b>id</b>';
  return list.reduce((acc, row) => `${acc}<b>${row.player_id}</b>\n`, 'Список привязанных id:\n');
};

const listHandler = async (msg, sendMessage) => {
  const fromId = msg.from.id;
  const list = await DB.dbGetIdsList(fromId);
  const text = getIdsList(list);

  return sendMessage(fromId, text);
};

const addHandler = async (msg, match, sendMessage) => {
  const fromId = msg.from.id;
  const regexp = /^\s+(\d+)$/i;
  const result = regexp.exec(match[1]);

  if (!result) {
    return sendMessage(fromId, addText);
  }

  const [, playerId] = result;
  const rows = await DB.dbIsHashAllowed(playerId);

  if (!_.size(rows)) {
    return sendMessage(fromId, `id <b>${playerId}</b> не привязан ни к одному профилю`);
  }

  await DB.dbAddChatIdToUser(fromId, playerId);
  const list = await DB.dbGetIdsList(fromId);
  const text = getIdsList(list);
  return sendMessage(fromId, text);
};

const removeHandler = async (msg, sendMessage) => {
  const fromId = msg.from.id;

  const affectedRows = await DB.dbClearChatId(fromId);
  text = 'Все персонажи отвязаны от телеграм бота';

  if (!affectedRows) {
    text = 'К вашему профилю не привязан ни один персонаж';
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
