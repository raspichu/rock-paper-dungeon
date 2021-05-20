"use strict";
const express = require('express')
const app = express()
var bodyParser = require('body-parser');
var fs = require('fs');

const port = process.env.PORT || 8006;
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

const fileName = './files/map.txt';
let file = fs.readFileSync(fileName, 'utf8');
var idUser = 1;
var users = {};
var map = (file) ? JSON.parse(file) : {};

let intervalToSaveTheMap = setInterval(function () {
    console.log('--------------------- Saving state ------------------')
    fs.writeFileSync(fileName, JSON.stringify(map));
}, 1000 * 60);

app.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err);
    }
    console.log('server is listening on ' + port);
});
app.get('/start', (req, res) => {
    let obj = randomPosInit(idUser)
    let usr = { position: obj.pos, id: idUser };
    res.send({ position: usr.position, id: usr.id, map: obj.map, encounter: obj.encounter, fullMap: map });
    idUser++;
    users[usr.id] = usr;
    console.log(`Player ${usr.id} staring in position: x:${usr.position.x} y:${usr.position.y}`);
});
app.post('/move', (req, res) => {
    if (req.body && req.body.id && req.body.direction && users[req.body.id]) {
        let tomove = move(users[req.body.id].position, req.body.direction, req.body.id);
        console.log(`Moving player ${req.body.id} - Before:${users[req.body.id].position.x}:${users[req.body.id].position.y} Now:${tomove.pos.x}:${tomove.pos.y}`)
        users[req.body.id].position = tomove.pos;
        res.send({ position: tomove.pos, map: tomove.map, encounter: tomove.encounter, fullMap: map });
    } else {
        res.end();
    }
});
app.post('/fight', (req, res) => {
    if (req.body && req.body.id && req.body.action) {
        // users[req.body.id].position = tomove
        let enact = ActionForEnemy();
        let result = fightComp(req.body.action, enact);
        let mess = '';
        if (result.error) {
            res.send({ error: result.error });
        } else {
            res.send({ result: result });
        }
        console.log(`Player ${req.body.id} fighting - Player:${req.body.action} Enemy:${enact} - result: ${result.winner}`);
    } else {
        res.end();
    }
});

function findPlayers(position) {
    let final = [];
    for (let index in users) {
        if (users[index].position.x == position.x && users[index].position.y == position.y) {
            final.push(index);
        }
    }
    return final;
}

function randomPosInit(user) {
    let x = Math.floor(Math.random() * 1000);
    let y = Math.floor(Math.random() * 1000);
    let obj = { x: x, y: y };
    if (!map[po(obj)]) {
        map[po(obj)] = { done: true };
    }
    return { map: map[po(obj)], pos: obj, encounter: { mess: 'Back to home' } };
}
function move(position, direction, user) {
    let post = { x: position.x, y: position.y };
    let encounter = { mess: '' };
    switch (direction) {
        case 'left': post.x = post.x - 1; break;
        case 'right': post.x = post.x + 1; break;
        case 'up': post.y = post.y - 1; break;
        case 'down': post.y = post.y + 1; break;
    }
    if (map[po(position)]) {
        map[po(position)].done = true;
    }
    if (!map[po(post)]) {
        encounter = encounterEmpty();
        map[po(post)] = { done: false };
    } else {
        let numPlayer = findPlayers(post).length;
        if (numPlayer) {
            if (numPlayer == 1) {
                encounter.mess = 'There is another user here!';
            } else {
                encounter.mess = 'There are' + numPlayer + ' players here!';
            }
        } else {
            if (map[po(post)].done) {
                encounter.mess = 'Another player has already passed by here';
            }
        }
    }
    return { pos: post, map: map[po(post)], encounter: encounter };
}
function po(position) {
    return position.x + '_' + position.y;
}
function encounterEmpty() {
    let ram = Math.floor(Math.random() * 5000);
    if (ram < 10) {
        return { mess: 'You met the final boss!', fight: true };
    } else if (ram < 200) {
        return { mess: 'You have found an object, you recover life!', object: true };
    } else if (ram < 500) {
        return { mess: 'You found an enemy!', fight: true, enemy: createEnemy() };
    } else if (ram < 1000) {
        return { mess: 'Nothing happens' };
    } else if (ram < 2000) {
        return { mess: 'Nothing happens' };
    } else if (ram < 5000) {
        return { mess: 'Nothing happens' };
    } else {
        return { mess: 'This should not come out' };
    }
}
function ActionForEnemy() {
    let ram = Math.floor(Math.random() * 3) + 1;
    switch (ram) {
        case 1:
            return 'Rock';
        case 2:
            return 'Paper';
        case 3:
            return 'Scissors';
        default:
            return false;
    }
}
function createEnemy() {
    let ram = Math.floor(Math.random() * 5000);
    let enm = {
        name: 'Slime',
    };
    if (ram < 10) {
        enm.name = 'Really Big guy';
    } else if (ram < 100) {
        enm.name = 'Bandit boss';
    } else if (ram < 500) {
        enm.name = 'Soldier';
    } else if (ram < 1000) {
        enm.name = 'Bandit';
    } else if (ram < 2000) {
        enm.name = 'Goblin';
    }
    return enm;
}
function fightComp(playerAction, enemyAction) {
    let win = {
        player: playerAction,
        enemy: enemyAction,
        winner: false
    }
    if (playerAction == enemyAction) {
        win.winner = 'none';
        return win;
    }
    switch (playerAction) {
        case 'Rock':
            if (enemyAction == 'Paper') {
                win.winner = 'enemy';
            } else if (enemyAction == 'Scissors') {
                win.winner = 'player';
            }
            break;
        case 'Paper':
            if (enemyAction == 'Scissors') {
                win.winner = 'enemy';
            } else if (enemyAction == 'Rock') {
                win.winner = 'player';
            }
            break;
        case 'Scissors':
            if (enemyAction == 'Rock') {
                win.winner = 'enemy';
            } else if (enemyAction == 'Paper') {
                win.winner = 'player';
            }
            break;
        default:
            win.winner = false;
            win.error = "Invalid move";
    }
    return win;
}