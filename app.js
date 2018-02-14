const Discord = require('discord.js')
const client = new Discord.Client()
const fs = require('fs')

const prefix = "부..부..분배법칙..! "

let userdata = JSON.parse(fs.readFileSync('./user.json', 'utf8'))

function updateData() {
    fs.writeFile('./user.json', JSON.stringify(userdata), console.error)
}

String.prototype.format = function() {
    a = this;
    for (k in arguments) {
        a = a.replace("{" + k + "}", arguments[k])
    }
    return a
}

client.on('ready', () => {
    console.log('I am ready!!')
});

client.on('message', message => {
    if(message.content == '!레벨') {
        message.reply(prefix+'당신의 현재 레벨은 {0}입니다!'.format(userdata[message.author.id]["level"]))
    } else {
        if(userdata[message.author.id] != undefined) {
            userdata[message.author.id]["level"] = 0;
        }
        userdata[message.author.id]["level"] += 1;
        updateData();
    }
});

client.on('guildMemberAdd', message => {
    member.send(prefix+"공주중배그 서버에 오신 것을 환영합니다..!")
    userdata[message.author.id]["level"] = 0;
    updateData();
});

client.login(process.env.BOT_TOKEN)