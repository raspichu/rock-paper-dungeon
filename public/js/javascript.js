"use strict";
$(document).ready(function () {
    $.ajax({
        type: "GET",
        url: '/start',
        data: null,
        success: function (val) {
            id = val.id;
            position = val.position;
            if (val) {
                drawPos(val);
                 drawHP();
            }
        },
    });
    $(document).keyup(function (e) {
        switch (e.keyCode) {
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

function move(direction) {
    if (id && position) {
        if (!onCombat) {
            $.ajax({
                type: "POST",
                url: '/move',
                data: { id: id, direction: direction },
                success: function (val) {
                    console.log(val);
                    position = val.position;
                    if (val.object){
                        hp++;
                        drawHP();
                    }
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
function drawHP(){
    $('#hp').html('<div> Hp: '+hp+'</div>');
}
function drawPos(value) {
    console.log(value)
    if (value.encounter && value.encounter.mess) {
        $('#message').html('<div>X:' + position.x + ' Y:' + position.y + '</div><div>' + value.encounter.mess + '</div>')
    } else {
        $('#message').html('<div>X:' + position.x + ' Y:' + position.y + '</div>');
    }
    if (value.encounter && value.encounter.fight) {
        onCombat = true;
        $('#combat').css('display', '');
        console.log('Pelea!')
    } else {
        $('#combat').css('display', 'none');
    }
}
function attack(action) {
    if (onCombat) {
        $.ajax({
            type: "POST",
            url: '/fight',
            data: {id: id,action:action},
            success: function (val) {
                if (val.result){
                     $('#message').html('<div>X:' + position.x + ' Y:' + position.y + '</div>'+
                     '<div>Enemigo: ' + val.result.enemy + ' - Tú: ' + val.result.player + '</div>'+
                     '<div>'+
                     ((val.result.winner=='player')?'¡Ganaste!':(val.result.winner=='enemy')?'¡Perdiste!':'Empate')+
                     '</div>'
                     );
                     if (val.result.winner && val.result.winner=='player'){
                         onCombat=false;
                         $('#combat').css('display', 'none');
                     } else if (val.result.winner == 'enemy'){
                         hp--;
                         drawHP();
                     }
                }
            },
        });
    }
}