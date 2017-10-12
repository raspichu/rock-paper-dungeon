"use strict";
var map = {};
$(document).ready(function () {
    $.ajax({
        type: "GET",
        url: '/start',
        data: null,
        success: function (val) {
            if (val) {
                id = val.id;
                position = val.position;
                drawPos(val);
                drawHP();
                map = val.fullMap;
                drawInitMap(position);
            }
        },
    });
    $(document).keyup(function (e) {
        switch (e.keyCode) {
            case 74: attack('Roca'); break;
            case 75: attack('Papel'); break;
            case 76: attack('Tijeras'); break;
            case 37: // Left
            case 65: // A
                move('left');
                break;
            case 38: // Up
            case 87: // W
                move('up');
                break;
            case 39: // Right
            case 68: // D
                move('right');
                break;
            case 40: // Down
            case 83: // S
                move('down');
                break;
            default:
                return;
        }
    })
})
var id = null;
var position = null;
var onCombat = false;
var hp = 10;
function drawInitMap(pos) {
    let html = '';

    for (let y = 8; y >= -8; y--) {
        let xtorest;
        html += '<div style="display:flex;">'
        for (let x = 15; x >= -15; x--) {
            let index = (pos.x - x) + '_' + (pos.y - y);
            if (map[index]) {
                html += '<div id="' + index + '" class="showbox">';
                switch (map[index]) {
                    case 'combat': html += 'X'; break;
                    case 'object': html += 'O'; break;
                    case 'player': html += 'P'; break;
                    case 'boss': html += 'B'; break;
                    case 'finalBoss': html += 'FB'; break;
                }
                html += '</div>'
            } else {
                html += '<div id="' + index + '" class="box"></div>';
            }
        }
        html += '</div>'
    }
    $('#showingMap').html(html);
    $('#' + stringPos(position)).html('@');
    $('#' + stringPos(position)).addClass('showBox');
}
function stringPos(pos) {
    return pos.x + '_' + pos.y
}
function move(direction) {
    if (id && position) {
        if (!onCombat) {
            $.ajax({
                type: "POST",
                url: '/move',
                data: { id: id, direction: direction },
                success: function (val) {
                    position = val.position;
                    map = val.fullMap;
                    drawInitMap(position)
                    drawPos(val);
                },
            });

        } else {
            $('#error').html('No puedes moverte en combate');
            $('#error').stop();
            $('#error').fadeIn('fast', function () {
                setTimeout(function () {
                    $('#error').fadeOut('fast', function () {
                        $('#error').html('');
                    });
                }, 1000)
            })
        }
    } else {
        console.log('No hay id o posición', id, position);
    }
}
function drawHP() {
    $('#hp').html('<div> Hp: ' + hp + '</div>');
}
function drawPos(value) {
    if (value.encounter && value.encounter.mess) {
        $('#message').html('<div>X:' + position.x + ' Y:' + position.y + '</div><div>' + value.encounter.mess + '</div>')
    } else {
        $('#message').html('<div>X:' + position.x + ' Y:' + position.y + '</div>');
    }
    if (value.encounter && value.encounter.fight) {
        onCombat = true;
        $('#combat').css('display', '');
        // map[stringPos(position)] = 'combat';
        console.log('Pelea!')
    } else {
        if (value.encounter && value.encounter.object) {
            hp++;
            drawHP();
            // if (!map[stringPos(position)]) {
            //     map[stringPos(position)] = 'object';
            // }
        } else {
            // if (!map[stringPos(position)]) {
            //     map[stringPos(position)] = 'done';
            // }
        }
        $('#combat').css('display', 'none');
    }
}
function attack(action) {
    if (onCombat) {
        $.ajax({
            type: "POST",
            url: '/fight',
            data: { id: id, action: action },
            success: function (val) {
                if (val.result) {
                    $('#message').html('<div>X:' + position.x + ' Y:' + position.y + '</div>' +
                        '<div>Enemigo: ' + val.result.enemy + ' - Tú: ' + val.result.player + '</div>' +
                        '<div>' +
                        ((val.result.winner == 'player') ? '¡Ganaste!' : (val.result.winner == 'enemy') ? '¡Perdiste!' : 'Empate') +
                        '</div>'
                    );
                    if (val.result.winner && val.result.winner == 'player') {
                        onCombat = false;
                        $('#combat').css('display', 'none');
                    } else if (val.result.winner == 'enemy') {
                        hp--;
                        drawHP();
                    }
                }
            },
        });
    }
}