const config = require('./config');

const TelegramBot = require('node-telegram-bot-api');

const token = config.telegramToken;
var TelegramChatBot = null;




module.exports = {

  initTelegram: function () {

    TelegramChatBot = new TelegramBot(token, {
      polling: true
    });

    TelegramChatBot.onText(/\/help/, (msg, match) => {

      const chatId = msg.chat.id;
      var helpString = '';
      helpString = helpString + 'User ID: ' + chatId + '\n';
      helpString = helpString + 'Welcome to HotPotato.\n';

      TelegramChatBot.sendMessage(chatId, helpString);

    });

  },


  telegramBroadcast: function (message) {



    for (var i = 0; i < config.telegramUsers.length; i++) {

      TelegramChatBot.sendMessage(config.telegramUsers[i], message);


    }




  }



};