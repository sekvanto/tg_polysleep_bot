const TelegramBot = require('node-telegram-bot-api');
const config = require('./config.json');
const bot = new TelegramBot(config.token, {polling: true});

const shlex = require('shlex');
const fs = require('fs');
const { URL } = require('url');
const { getOrGenImg, createChart } = require("./imageCache");

const usage = 'Введите /create , за которым следуют отрезки времени, по желанию с префиксом цвета и метки; разделите полосы символом ";"'
  + '\nПример:'
  + '\n"/create red 3-18" или "/create red=sleep 0-5; purple=dp 22-5". \n'
  + 'Для получения дополнительной инфы нажмите /createhelp';

const coms = 'Доступные команды:'
  + '\n/help - Помощь'
  + '\n/create <полосы> - Создать график сна'
  + '\n/createhelp - Подробнее о команде /create';

const start = 'Приветствую! Нажмите /help, чтобы получить список команд';

const colors = [ 'red', 'blue',
				 'brown', 'green',
				 'gray', 'yellow',
				 'purple', 'pink', 'black' ]; // show available colors

const validRegex = /^(((((\w+)(=\w+)?) )?((\d{1,2}(:\d{1,2})?)-(\d{1,2}(:\d{1,2})?) ?)+)+)* ?(; ?(((((\w+)(=\w+)?) )?((\d{1,2}(:\d{1,2})?)-(\d{1,2}(:\d{1,2})?) ?)+)+)*)*$/

const prefix = '+create '

bot.onText(/\/create/, (msg, match) => {
  const arg = match[1];
  create(arg, msg);
});

bot.onText(/\/createhelp/, (msg, match) => {
  const data = fs.readFileSync('CREATEHELP.md', 'utf8');
  bot.sendMessage(msg.chat.id, data, {parseMode : 'HTML'});
});

bot.onText(/\/help/, (msg, match) => {
  bot.sendMessage(msg.chat.id, coms);
});

bot.onText(/\/start/, (msg, match) => {
  bot.sendMessage(msg.chat.id, start);
});

async function create(commandBody, message) {
  const chatId = message.chat.id;
  commandBody = commandBody.replace(/(?<!=)sleep/, 'red=sleep')
  commandBody = commandBody.replace(/(?<!=)dp/, 'purple=dp')
  commandBody = commandBody.replace(/(?<!=)flex/, 'blue=flex')
  commandBody = commandBody.replace(/(?<!=)food/, 'yellow=food')
  commandBody = commandBody.replace(/(?<!=)free/, 'green=free')
  commandBody = commandBody.replace(/(?<!=)school/, 'black=school')
  commandBody = commandBody.trim()



  if (!commandBody.match(validRegex)) {
    bot.sendMessage(chatId, usage, { parseMode: 'HTML' });
	return;
  }
  const lanes = commandBody.split(';');
  console.log(lanes.length)
  if (lanes.length > 128) {
    bot.sendMessage(chatId, "Мы поддерживаем не более 128 полос.")
    return;
  }

  const i = 0;
  let lane_i = 0;
  const timeelems = [];
  const colorTags = [];
  console.log(lanes)
  lanes.forEach((lane)=>{
	lane = lane.trim()
    if (lane === "") {
      lane_i += 1
      return;
    }

    let color = "red"; // default color
    const args = shlex.split(lane);
	console.log(args)
	try {
 	  args.forEach((arg)=>{
	    if (isLetter(arg[0])) {
		  if (arg.includes("=")){
		    let meta = arg.split("=");
			if (colors.includes(meta[0])) {
			  console.log(meta[0] + " is a good color")
   			  color = meta[0];
			  tag = meta[1].replace(/_/g, " ")
 			  colorTags.push({
		    color,
		    tag,
			  });
			}
		  }
		  else {
		    if (colors.includes(arg)) {
			  console.log(color + " is a good color")
		      color = arg;
			}
		  }
		}
		else {
		  const times = arg.split('-');
		  s = parseTime(times[0]);
		  e = parseTime(times[1]);
		  if (s > 1440 || e > 1440){
		    bot.sendMessage(chatId, "Пожалуйста, не ломайте бота. Василиск придет за вами.");
		    throw new Error();
		  }

		  timeelems.push({
	    start: s,
		end: e,
		lane: lane_i,
		color: color
		  });
		}
	  });
	
	} catch(err) {
	  console.error("ERROR", err);
	  bot.sendMessage(chatId, usage, { parseMode: 'HTML' });
	  return;
	}
	lane_i++;
  });

  const data = {
    data:JSON.stringify({
	  chartData:{
	elements: timeelems,
    colorTags,
	shape: "circle",
	lanes: lane_i
	  },
      metaInfo:{
	title:"",
	description:"",
	  }
	})
  };
  let nurl = await createChart(data);
//  const emb = await getOrGenImg(nurl,message);
  if (!nurl.pathname) {
    nurl = new URL(nurl);
  }
  let ncId = nurl.pathname.substring(1);
  bot.sendMessage(chatId, 'napchart.com/' + ncId, { disable_web_page_preview: true });
  bot.sendMessage(chatId, 'cache.polysleep.org/napcharts/' + ncId + '.png');

}

function parseTime(s) {
  let hours;
  let hm = null;

  if (s.includes(":")){
    hm = s.split(":");
  }
  else if (s.length === 4){
    hm = [s.slice(0,2), s.slice(2,4)];
  }
  else if (s.length === 3){
    hm = [s.slice(0,1), s.slice(1,3)];
  }

  if (hm){
    hours = parseInt(hm[0], 10);
    hours += parseInt(hm[1], 10) / 60;
  }
  else{
    hours = parseInt(s, 10);
  }
  return Math.round(60 * hours);
}

function isLetter(str) {
  return str.length === 1 && str.match(/[a-z]/i);
}
