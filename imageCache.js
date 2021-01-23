const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const { URL } = require('url');
const axios = require('axios');
const ncEndpoint = "http://thumb.napchart.com:1771/api";

module.exports = {
  getOrGenImg: function (nurl, message, dry = false) {
    return new Promise(function (resolve, reject) {
      if (!nurl.pathname) {
        nurl = new URL(nurl);
      }
      let napChartId = nurl.pathname.substring(1);
	  let cacheurl = 'https://cache.polysleep.org/napcharts/' + napChartId + '.png';
      console.log('MSG   : ', 'MessageEmbed[' + nurl.href + ']');
      msgImg = new Discord.MessageEmbed().setDescription(nurl.href)
        .setImage(cacheurl)
        .setURL(nurl.href);
      resolve(msgImg);
      });
  },
  createChart: function (data) {
    let url = `${ncEndpoint}/create`;
    console.log('url', url);
    return new Promise(function (resolve, reject) {
      axios
        .post(url, data)
        .then((res) => {
          console.log('INFO  : ', 'Chart created', res);
          let nurl = 'https://napchart.com/' + res.data.chartid;
          resolve(nurl);
        })
        .catch((error) => {
          console.error('ERR   : ', 'Chart could not be created', error);
          reject(error);
        });
    });
  },
};
