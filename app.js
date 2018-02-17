const Discord = require('discord.js');
const client = new Discord.Client();
const {Client} = require('pg');
const db = new Client({connectionString: process.env.DATABASE_URL});

const prefix = "부..부..분배법칙..! ";
const EXP_PER_CHARCTER = 7;

function getLevel(exp) {
    return Math.floor(0.1*Math.sqrt(exp));
}

function query(sql, listener) {
    db.query(sql, (err, res) => {
        if(err) {
            console.error("sql: "+sql);
            console.error(err);
        }
        if(listener) {
            try {
                listener(res);
            } catch(error) {
                console.error("sql: "+sql);
                console.error(error);
            }
        };
    });
}

client.on('ready', () => {
    console.log('I am ready!!');
    db.connect();
});

client.on('message', message => {
    if(message.author.bot) return;

    query(`SELECT id FROM users WHERE id='${message.author.id}'`, res => {
        if(res.rows.length == 0) {
            console.log(`새로운 유저 군요..!  새로 만들어야 겠습니다. (${message.author.username}, ${message.author.id})`);
            query(`INSERT INTO users VALUES('${message.author.id}', '${message.author.username}', 0)`, res => onMessage(message));
        } else {
            onMessage(message);
        }
    });
});

function onMessage(message) {
    if(message.content == '!레벨') {
        query(`SELECT exp FROM users WHERE id='${message.author.id}'`, res => {
            let exp = res[0].exp;
            let level = getLevel(exp);
            message.reply('당신의 현재 레벨은 '+level+'/('+exp+')입니다!');
        });
    } else if(message.content == '!순위' || message.content == '!랭킹'){
        query(`SELECT * FROM users`, res => {
            let result = '\n';
            res.rows.sort((a, b) => {return (a.exp > b.exp) ? -1 : ((a.exp < b.exp) ? 1 : 0)});
            res.rows.forEach((e, i) => {
                if(parseInt(e.id) == message.author.id) {
                    result += `**${i+1}위) ${e.username.trim()} (Lv.${getLevel(e.exp)}, ${e.exp})**\n`;
                } else {
                    result += `${i+1}위) ${e.username.trim()} (Lv.${getLevel(e.exp)}, ${e.exp})\n`;
                }
            });
            message.reply(result);
        });
    } else if(message.content == '!순위초기화' && message.author.username == "뎁온누리") {
        query(`DELETE FROM users`, res => message.reply(prefix+"순위가 초기화 되었습니다."));
    } else {
        query(`SELECT exp FROM users WHERE id='${message.author.id}'`, res => {
            let exp = res.rows[0].exp;
            let addedExp = message.length*EXP_PER_CHARCTER;
            let prevLevel = getLevel(res.rows[0].exp);
            let nextLevel = getLevel(res.rows[0].exp+addedExp);

            if(prevLevel < nextLevel) {
                message.channel.send(`${prefix}축하드립니다! **${message.author.username}**님의 레벨이 ${prevLevel}에서 ${nextLevel}로 올라갔습니다!`);
            }
            query(`UPDATE users SET exp=${exp+addedExp} WHERE id='${message.author.id}'`);
        });
    }
}

client.login(process.env.BOT_TOKEN);
