const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

module.exports = {
  logMessage: function (msg) {

    var m = new Date();
    var date = 'UTC ' + m.getUTCFullYear() + "/" +
                    ("0" + (m.getUTCMonth()+1)).slice(-2) + "/" +
                    ("0" + m.getUTCDate()).slice(-2) + " " +
                    ("0" + m.getUTCHours()).slice(-2) + ":" +
                    ("0" + m.getUTCMinutes()).slice(-2) + ":" +
                    ("0" + m.getUTCSeconds()).slice(-2);

    let log = '\n' + date + " | " + msg.from.id
                          + " | " + msg.from.username
                          + " | " + msg.text;
				   
    fs.appendFileSync('logs.txt', log);
  },
};
