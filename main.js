"use strict";
const express = require('express')
const app = express()
var bodyParser = require('body-parser');
var fs = require('fs');

const port = process.env.PORT || 8080;
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

const fileName = './files/map.txt'
let file = fs.readFileSync(fileName, 'utf8')
var idUser = 1;
var users = {};
var map = (file) ? JSON.parse(file) : {};

let intervalToSaveTheMap = setInterval(function () {
    console.log('--------------------- Guardando estado ------------------')
    fs.writeFileSync(fileName, JSON.stringify(map));
}, 1000 * 60);

app.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }
    console.log('server is listening on ' + port)
})
app.get('/start', (req, res) => {
    let obj = randomPosInit(idUser)
    let usr = { position: obj.pos, id: idUser };
    res.send({ position: usr.position, id: usr.id, map: obj.map, encounter: obj.encounter, fullMap: map });
    idUser++;
    users[usr.id] = usr;
    console.log(`Jugador ${usr.id} empezando en la posicion: x:${usr.position.x} y:${usr.position.y}`);
})
app.post('/move', (req, res) => {
    if (req.body && req.body.id && req.body.direction && users[req.body.id]) {
        let tomove = move(users[req.body.id].position, req.body.direction, req.body.id);
        console.log(`Moviendo jugador ${req.body.id} - Antes:${users[req.body.id].position.x}:${users[req.body.id].position.y} Ahora:${tomove.pos.x}:${tomove.pos.y}`)
        users[req.body.id].position = tomove.pos
        res.send({ position: tomove.pos, map: tomove.map, encounter: tomove.encounter, fullMap: map });
    } else {
        res.end();
    }
})
app.post('/fight', (req, res) => {
    if (req.body && req.body.id && req.body.action) {
        // users[req.body.id].position = tomove
        let enact = ActionForEnemy();
        let result = fightComp(req.body.action, enact);
        let mess = '';
        if (result.error) {
            res.send({ error: result.error });
        } else {
            res.send({ result: result })
        }
        console.log(`Jugador ${req.body.id} luchando - Jugador:${req.body.action} Enemigo:${enact} - Resultado: ${result.winner}`)
    } else {
        res.end();
    }
})

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
    let obj = { x: x, y: y }
    if (!map[po(obj)]) {
        map[po(obj)] = { done: true }
    }
    return { map: map[po(obj)], pos: obj, encounter: { mess: 'Bienvenido al inicio' } };
}
function move(position, direction, user) {
    let post = { x: position.x, y: position.y };
    let encounter = { mess: '' }
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
                encounter.mess = '¡Te has encontrado con otro usuario!';
            } else {
                encounter.mess = '¡Te has encontrado con ' + numPlayer + ' usuarios!';
            }
        } else {
            if (map[po(post)].done) {
                encounter.mess = 'Ya ha pasado alguien por aquí';
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
        return { mess: '¡Te has encontrado el boss final!', fight: true }
    } else if (ram < 200) {
        return { mess: '¡Te has encontrado un objeto, recuperas vida!', object: true }
    } else if (ram < 500) {
        return { mess: '¡Te has encontrado un enemigo!', fight: true, enemy: createEnemy() }
    } else if (ram < 1000) {
        return { mess: 'No pasa nada' }
    } else if (ram < 2000) {
        return { mess: 'No pasa nada' }
    } else if (ram < 5000) {
        return { mess: 'No pasa nada' }
    } else {
        return { mess: 'Esto no deberia salir' }
    }
}
function ActionForEnemy() {
    let ram = Math.floor(Math.random() * 3) + 1;
    switch (ram) {
        case 1:
            return 'Roca';
            break;
        case 2:
            return 'Papel';
            break;
        case 3:
            return 'Tijeras';
            break;
        default:
            return false;
    }
}
function createEnemy() {
    let ram = Math.floor(Math.random() * 5000);
    let enm = {
        name: 'Slime',
    }
    if (ram < 10) {
        enm.name = 'Gigantón gigante';
    } else if (ram < 100) {
        enm.name = 'Jefe bandido';
    } else if (ram < 500) {
        enm.name = 'Soldado';
    } else if (ram < 1000) {
        enm.name = 'Bandido';
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
        case 'Roca':
            if (enemyAction == 'Papel') {
                win.winner = 'enemy';
            } else if (enemyAction == 'Tijeras') {
                win.winner = 'player';
            }
            break;
        case 'Papel':
            if (enemyAction == 'Tijeras') {
                win.winner = 'enemy';
            } else if (enemyAction == 'Roca') {
                win.winner = 'player';
            }
            break;
        case 'Tijeras':
            if (enemyAction == 'Roca') {
                win.winner = 'enemy';
            } else if (enemyAction == 'Papel') {
                win.winner = 'player';
            }
            break;
        default:
            win.winner = false, win.error = 'Invadil move'
    }
    return win;
}