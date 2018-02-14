const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');

const prefix = "부..부..분배법칙..! ";

// let userdata = JSON.parse(fs.readFileSync('./user.json', 'utf8'));

// function updateData() {
//     fs.writeFile('./user.json', JSON.stringify(userdata), console.error);
// }

// client.on('ready', () => {
//     console.log('I am ready!!');
// });

// client.on('message', message => {
//     if(message.content == '!레벨') {
//         message.reply(prefix+'당신의 현재 레벨은 '+userdata[message.author.id]["level"]+'입니다!');
//     } else {
//         if(userdata[message.author.id] != undefined) {
//             userdata[message.author.id]["level"] = 0;
//         }
//         userdata[message.author.id]["level"] += 1;
//         updateData();
//     }
// });

client.on('message', message => {
    if(message.content == '!레벨') {
        message.reply("ㅁㄴㅇㄹ");
    }
})

// client.on('guildMemberAdd', message => {
//     member.send(prefix+"공주중배그 서버에 오신 것을 환영합니다..!");
//     userdata[message.author.id]["level"] = 0;
//     updateData();
// });

client.login(process.env.BOT_TOKEN);
