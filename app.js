const Discord = require('discord.js');
const client = new Discord.Client();
const { Client } = require('pg');
const db = new Client({
    connectionString: process.env.DATABASE_URL
});

const prefix = "부..부..분배법칙..! ";
const EXP_PER_CHARCTER = 7;

const KILLBET_HELP = `
====**킬내기 사용법**====
\`\`\`
!킬내기 : 현재 진행되고 있는 킬내기를 표시합니다.
!킬내기 시작 : 킬내기를 시작합니다.
!킬내기 종료 : 킬내기를 종료합니다.
!킬내기 킬 [닉네임] (변동되는 값) : 플레이어의 킬을 변동되는 값 만큼 올립니다.
!킬내기 초기화 [닉네임] (초기값) : 플레이어의 킬을 초기값으로 초기화합니다.
!킬내기 설정 [벌칙/목표킬] [변경값] : 벌칙이나 목표킬을 변경값에 맞추어 변경합니다.
!킬내기 도움말 : 킬내기 도움말을 보여줍니다.
\`\`\`
`;

var nextInput = () => false;

var killbet = {
    isEmpty: true,
    goalKill: 0,
    penalty: "",
    player: {}
};

var chatlog = [];

function getLevel(exp) {
    return Math.floor(0.1 * Math.sqrt(exp));
}

function query(sql, listener) {
    db.query(sql, (err, res) => {
        if (err) {
            console.error("sql: " + sql);
            console.error(err);
        }
        if (listener) {
            try {
                listener(res);
            } catch (error) {
                console.error("sql: " + sql);
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
    if (message.author.bot) return;

    if (message.channel.name == "일반") {
        let log = [message.member.nickname, message.content];
        chatlog.push(log);
        while (chatlog.length > 10) {
            chatlog.shift();
        }
    }

    query(`SELECT id FROM users WHERE id='${message.author.id}'`, res => {
        if (res.rows.length == 0) {
            console.log(`새로운 유저 군요..!  새로 만들어야 겠습니다. (${message.author.username}, ${message.author.id})`);
            query(`INSERT INTO users VALUES('${message.author.id}', '${message.member.nickname.trim()}', 0)`, res => onMessage(message));
        } else {
            onMessage(message);
        }
    });
});

function onMessage(message) {
    if (message.content == '!레벨') {
        query(`SELECT exp FROM users WHERE id='${message.author.id}'`, res => {
            let exp = res.rows[0].exp;
            let level = getLevel(exp);
            message.reply('당신의 현재 레벨은 ' + level + '/(' + exp + ') 입니다!');
        });
    } else if (message.content == '!순위' || message.content == '!랭킹') {
        query(`SELECT * FROM users`, res => {
            let result = '\n';
            res.rows.sort((a, b) => {
                return (a.exp > b.exp) ? -1 : ((a.exp < b.exp) ? 1 : 0)
            });
            res.rows.forEach((e, i) => {
                if (parseInt(e.id) == message.author.id) {
                    result += `**${i+1}위) ${e.username.trim()} (Lv.${getLevel(e.exp)}, ${e.exp})**\n`;
                } else {
                    result += `${i+1}위) ${e.username.trim()} (Lv.${getLevel(e.exp)}, ${e.exp})\n`;
                }
            });
            message.reply(result);
        });
    } else if (message.content == '!순위초기화' && message.author.id == "283902458365739008") {
        query(`DELETE FROM users`, res => message.reply(prefix + "순위가 초기화 되었습니다."));
    } else if (message.content.startsWith("!말 ") && message.author.id == "283902458365739008") {
        client.channels.find("name", "일반").send(message.content.substring(3));
    } else if (message.content.startsWith("!채팅기록")) {
        if(chatlog.length == 0) {
            message.reply("채팅기록이 비어있습니다!");
            return;
        }

        let result = "\n최근 10건의 채팅기록입니다.\n```";

        let reversed = chatlog.slice().reverse();
        reversed.forEach(log => {
            result += `${log[0]}: ${log[1]}\n`;
        });

        result += "```";
        message.reply(result);
    } else if (message.content.startsWith("!킬내기")) {
        let args = message.content.substring("!킬내기".length).split(/\ /).slice(1);

        if (args.length == 0) {
            if (killbet.isEmpty) {
                message.reply("킬내기가 아직 시작되지 않았습니다!");
            } else {
                // Make Object to Array
                let array = Object.entries(killbet.player);
                // Sort Items by Value
                array.sort((a, b) => b[1] - a[1]);

                /*
                 10 킬 내기 
                 벌칙: ```빵빠라빵빠빵```
                 플레이어:
                 1. 안녕: 5킬
                 2. 잘가: 4킬
                 3. 아니: 2킬
                 */

                let players = "";
                let playerIndex = 1;

                for (const [key, value] of array) {
                    if (killbet.player[key] >= killbet.goalKill) {
                        players += `~~${playerIndex}. ${key}: ${value}킬~~\n`;
                    } else {
                        players += `${playerIndex}. ${key}: ${value}킬\n`;
                    }
                    playerIndex += 1;
                }

                message.reply(`
==== **${killbet.goalKill} 킬 내기** ====
**벌칙**: \`\`\`${killbet.penalty}\`\`\`
**플레이어**:
${players}
`);
            }
        } else if (args.length == 1) {
            if (args[0] == "시작") {
                message.reply("목표 킬을 입력하세요! (취소하시려면 \"취소\" 입력)");
                nextInput = msg => {
                    if (message.author.id !== msg.author.id) return;
                    if (msg.content.trim() == "취소") {
                        message.reply("킬내기 생성이 취소되었습니다.");
                        nextInput = () => false;

                        return true;
                    }

                    let num = parseInt(msg.content);
                    if (isNaN(num) || !isFinite(num)) {
                        msg.reply("숫자만 입력해주세요!");

                        return true;
                    }

                    if (num < 1) {
                        msg.reply("목표 킬은 꼭 1킬 이상이여야 합니다.");

                        return true;
                    }

                    killbet.goalKill = num;

                    message.reply(`목표 킬이 ${num}킬로 설정되었습니다.\n벌칙을 말해주세요! (취소하시려면 "취소" 입력)`);

                    nextInput = msg => {
                        if (message.author.id !== msg.author.id) return;
                        if (msg.content.trim() == "취소") {
                            message.reply("킬내기 생성이 취소되었습니다.");
                            nextInput = () => false;

                            return true;
                        }

                        killbet.penalty = msg.content;
                        killbet.player = {};
                        killbet.isEmpty = false;

                        message.reply(`벌칙이 "${killbet.penalty}"로 설정되었습니다.`);
                        nextInput = () => false;

                        return true;
                    };

                    return true;
                };
            } else if (args[0] == "종료") {
                killbet.isEmpty = true;
                message.reply("킬내기가 종료 되었습니다.");
            } else {
                message.reply(KILLBET_HELP);
            }
        } else if (args[0] == "킬") {
            if (killbet.isEmpty) {
                message.reply("킬내기가 아직 시작되지 않았습니다!");
            } else {
                let nick = args[1];
                let value = args.length > 2 ? parseInt(args[2]) : 1;

                if (!(nick in killbet.player)) {
                    killbet.player[nick] = 0;
                }

                if (killbet.player[nick] >= killbet.goalKill) {
                    message.reply(`${nick}님은 이미 목표를 달성하셨습니다!`);
                    return;
                }


                killbet.player[nick] += args.length > 2 ? parseInt(args[2]) : args[1];

                if (killbet.player[nick] >= killbet.goalKill) {
                    message.reply(`**"${nick}" 님이 목표를 달성하였습니다! (최종 ${killbet.player[nick]} 킬)**`);
                } else {
                    message.reply(`**"${nick}" ${(value<0?"":"+")+value} 킬 (현재 ${killbet.player[nick]} 킬)**`);
                }
            }
        } else {
            message.reply(KILLBET_HELP);
        }
    } else if (message.content.startsWith("!sql ") && message.author.id == "283902458365739008") {
        sql = message.content.split(/\ (.+)/)[1];
        query(sql, res => {
            message.reply("SQL 실행 결과:\n" + JSON.stringify(res.rows));
        });
    } else {
        if (nextInput(message)) return;

        query(`SELECT exp FROM users WHERE id='${message.author.id}'`, res => {
            let exp = res.rows[0].exp;
            let addedExp = message.content.length * EXP_PER_CHARCTER;
            let prevLevel = getLevel(res.rows[0].exp);
            let nextLevel = getLevel(res.rows[0].exp + addedExp);

            if (prevLevel < nextLevel) {
                message.channel.send(`${prefix}축하드립니다! **${message.member.nickname}**님의 레벨이 ${prevLevel}에서 ${nextLevel}로 올라갔습니다!`);
            }
            query(`UPDATE users SET exp=${exp+addedExp} WHERE id='${message.author.id}'`);
        });
    }
}

client.login(process.env.BOT_TOKEN);
