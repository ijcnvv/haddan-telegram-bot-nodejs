const TelegramBot = require('node-telegram-bot-api');
const config = require('config');
const token = config.get('telegram_token');
const bot = new TelegramBot(token, { polling: true });
const MH = require('./modules/HandleMessage');

const sendMessage = (id, text) => {
  return bot.sendMessage(id, text, { parse_mode: 'HTML' });
};

bot.onText(/^\/start/, (msg) => MH.startHandler(msg, sendMessage));
bot.onText(/^\/list/, (msg) => MH.listHandler(msg, sendMessage));
bot.onText(/^\/add(.*)/, (msg, match) => MH.addHandler(msg, match, sendMessage));
bot.onText(/^\/remove/, (msg) => MH.removeHandler(msg, sendMessage));
bot.onText(/^\d+$/, (msg) => MH.answerHandler(msg, sendMessage));
bot.on('callback_query', (msg) => MH.btnHandler(msg, sendMessage));
