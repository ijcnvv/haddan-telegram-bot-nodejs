const _ = require('lodash');
const DB = require('./db');


const startHandler = (msg, sendMessage) => {
  const fromId = msg.from.id;
  const text = `Привет! Чтобы начать получать капчи из игры, вам необходимо сначала создать аккаунт через бота @haddan_jc_bot \n
Затем в настройках приложения Haddan Bot включить отправку капч в телеграм\n
`;
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
  btnHandler,
  answerHandler,
};
