var app = require('express')();
var http = require('http').Server(app);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.get('/play', function(req, res) {
    res.sendFile(__dirname + '/play.html');
});
app.get('/style.css', function(req, res) {
    res.sendFile(__dirname + '/style.css');
});
app.get('/three.min.js', function(req, res) {
    res.sendFile(__dirname + '/three.min.js');
});
app.get('/OrbitControls.js', function(req, res) {
    res.sendFile(__dirname + '/OrbitControls.js');
});

http.listen(9002, function() {
    console.log('http server started');
});

function getEmptyArray() {
    var empty_3D = [
        [
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ],
        [
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ],
        [
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ],
    ];
    return empty_3D;
}


var rooms = {};

var io = require('socket.io')(http);
io.on('connection', function(socket) {
    var room_id;
    var color;

    socket.on('join game', function(id) {
        if (!rooms[id]) {
            rooms[id] = {};
            rooms[id]['data'] = getEmptyArray();
            rooms[id]['running'] = true;

            rooms[id]['red'] = {};
            rooms[id]['blue'] = {};
            rooms[id]['spectators'] = {};
            rooms[id]['spectators']['sockets'] = [];
        }
        if (rooms[id]['running']) {
            if (!rooms[id]['red']['socket']) {
                // room has no red player
                rooms[id]['red']['socket'] = socket;
                room_id = id;
                color = 'red';

                if (rooms[id]['red']['current_turn'] === undefined) {
                    rooms[id]['red']['current_turn'] = true;
                }
                socket.emit('color', 'red');
                if (!rooms[id]['blue']['socket']) {
                    socket.emit('display', {
                        text: "Waiting for opponent to join...",
                        color: '#000000'
                    });
                } else {
                    if (rooms[id]['red']['current_turn']) {
                        rooms[id]['red']['socket'].emit('display', {
                            text: "Your move!",
                            color: '#000000'
                        });
                        rooms[id]['blue']['socket'].emit('display', {
                            text: "Opponent's move...",
                            color: '#000000'
                        });
                    } else {
                        rooms[id]['red']['socket'].emit('display', {
                            text: "Opponent's move...",
                            color: '#000000'
                        });
                        rooms[id]['blue']['socket'].emit('display', {
                            text: "Your move!",
                            color: '#000000'
                        });
                    }
                }
            } else if (rooms[id]['red']['socket'] && !rooms[id]['blue']['socket']) {
                // room has no blue player
                rooms[id]['blue']['socket'] = socket;
                room_id = id;
                color = 'blue';

                if (rooms[id]['blue']['current_turn'] === undefined) {
                    rooms[id]['blue']['current_turn'] = false;
                }
                socket.emit('color', 'blue');
                if (!rooms[id]['red']['socket']) {
                    socket.emit('display', {
                        text: "Waiting for opponent to join...",
                        color: '#000000'
                    });
                } else {
                    if (rooms[id]['red']['current_turn']) {
                        rooms[id]['red']['socket'].emit('display', {
                            text: "Your move!",
                            color: '#000000'
                        });
                        rooms[id]['blue']['socket'].emit('display', {
                            text: "Opponent's move...",
                            color: '#000000'
                        });
                    } else {
                        rooms[id]['red']['socket'].emit('display', {
                            text: "Opponent's move...",
                            color: '#000000'
                        });
                        rooms[id]['blue']['socket'].emit('display', {
                            text: "Your move!",
                            color: '#000000'
                        });
                    }
                }

            } else {
                rooms[id]['spectators']['sockets'].push(socket);
                room_id = id;

                socket.emit('color', 'spectator');
                socket.emit('display', {
                    text: "You are spectating",
                    color: '#000000'
                });
            }
        } else {
            rooms[id]['spectators']['sockets'].push(socket);
            room_id = id;

            socket.emit('color', 'spectator');
            socket.emit('display', {
                text: "Game over",
                color: '#000000'
            });
        }
    });

    socket.on('request board', function() {
        if (rooms[room_id] && rooms[room_id]['data']) {
            socket.emit('cubes', rooms[room_id]['data']);
        }
    });
    socket.on('place block', function(position) {
        var x = position.x;
        var z = position.z;

        if (color === 'red' || color === 'blue') {
            // player is not spectating    
            // check that x and z are between 0 and 2
            if (!(x < 0 || x > 2 || z < 0 || z > 2)) {
                // x and z are within bounds
                if (rooms[room_id] && rooms[room_id]['running'] && rooms[room_id]['red']['socket'] && rooms[room_id]['blue']['socket']) {
                    if (rooms[room_id][color]['current_turn']) {
                        var data = rooms[room_id]['data'];
                        if (data[x][2][z]) {
                            // square is taken
                        } else {
                            // square is available
                            var single_cube = getEmptyArray();
                            if (!data[x][0][z]) {
                                data[x][0][z] = color;
                                single_cube[x][0][z] = data[x][0][z];
                                rooms[room_id]['red']['socket'].emit('cubes', single_cube);
                                rooms[room_id]['blue']['socket'].emit('cubes', single_cube);
                                for (var i in rooms[room_id]['spectators']['sockets']) {
                                    if (rooms[room_id]['spectators']['sockets'][i]) {
                                        rooms[room_id]['spectators']['sockets'][i].emit('cubes', single_cube);
                                    }
                                }
                            } else if (!data[x][1][z]) {
                                data[x][1][z] = color;
                                single_cube[x][1][z] = data[x][1][z];
                                rooms[room_id]['red']['socket'].emit('cubes', single_cube);
                                rooms[room_id]['blue']['socket'].emit('cubes', single_cube);
                                for (var i in rooms[room_id]['spectators']['sockets']) {
                                    if (rooms[room_id]['spectators']['sockets'][i]) {
                                        rooms[room_id]['spectators']['sockets'][i].emit('cubes', single_cube);
                                    }
                                }
                            } else if (!data[x][2][z]) {
                                data[x][2][z] = color;
                                single_cube[x][2][z] = data[x][2][z];
                                rooms[room_id]['red']['socket'].emit('cubes', single_cube);
                                rooms[room_id]['blue']['socket'].emit('cubes', single_cube);
                                for (var i in rooms[room_id]['spectators']['sockets']) {
                                    if (rooms[room_id]['spectators']['sockets'][i]) {
                                        rooms[room_id]['spectators']['sockets'][i].emit('cubes', single_cube);
                                    }
                                }
                            }
                            if (color === 'red') {
                                rooms[room_id]['red']['current_turn'] = false;
                                if (rooms[room_id]['red']['socket']) {
                                    rooms[room_id]['red']['socket'].emit('display', {
                                        text: "Opponent's move...",
                                        color: '#000000'
                                    });
                                }
                                rooms[room_id]['blue']['current_turn'] = true;
                                if (rooms[room_id]['blue']['socket']) {
                                    rooms[room_id]['blue']['socket'].emit('display', {
                                        text: "Your move!",
                                        color: '#000000'
                                    });
                                }
                            } else {
                                rooms[room_id]['red']['current_turn'] = true;
                                if (rooms[room_id]['red']['socket']) {
                                    rooms[room_id]['red']['socket'].emit('display', {
                                        text: "Your move!",
                                        color: '#000000'
                                    });
                                }
                                rooms[room_id]['blue']['current_turn'] = false;
                                if (rooms[room_id]['blue']['socket']) {
                                    rooms[room_id]['blue']['socket'].emit('display', {
                                        text: "Opponent's move...",
                                        color: '#000000'
                                    });
                                }
                            }

                            var winner = checkForWinner(rooms[room_id]['data']);
                            if (winner) {
                                if (winner === 'red') {
                                    if (rooms[room_id]['red']['socket']) {
                                        rooms[room_id]['red']['socket'].emit('display', {
                                            text: "You win!",
                                            color: '#000000'
                                        });
                                    }
                                    if (rooms[room_id]['blue']['socket']) {
                                        rooms[room_id]['blue']['socket'].emit('display', {
                                            text: "You lose!",
                                            color: '#000000'
                                        });
                                    }
                                    for (var i in rooms[room_id]['spectators']['sockets']) {
                                        if (rooms[room_id]['spectators']['sockets'][i]) {
                                            rooms[room_id]['spectators']['sockets'][i].emit('display', {
                                                text: "Red wins!",
                                                color: '#000000'
                                            });
                                        }
                                    }
                                } else if (winner === 'blue') {
                                    if (rooms[room_id]['red']['socket']) {
                                        rooms[room_id]['red']['socket'].emit('display', {
                                            text: "You lose!",
                                            color: '#000000'
                                        });
                                    }
                                    if (rooms[room_id]['blue']['socket']) {
                                        rooms[room_id]['blue']['socket'].emit('display', {
                                            text: "You win!",
                                            color: '#000000'
                                        });
                                    }
                                    for (var i in rooms[room_id]['spectators']['sockets']) {
                                        if (rooms[room_id]['spectators']['sockets'][i]) {
                                            rooms[room_id]['spectators']['sockets'][i].emit('display', {
                                                text: "Blue wins!",
                                                color: '#000000'
                                            });
                                        }
                                    }
                                } else if (winner === 'draw') {
                                    rooms[id]['red']['socket'].emit('display', {
                                        text: "It's a tie!",
                                        color: '#000000'
                                    });
                                    rooms[id]['blue']['socket'].emit('display', {
                                        text: "It's a tie!",
                                        color: '#000000'
                                    });
                                    for (var i in rooms[room_id]['spectators']['sockets']) {
                                        if (rooms[room_id]['spectators']['sockets'][i]) {
                                            rooms[room_id]['spectators']['sockets'][i].emit('display', {
                                                text: "It's a tie!",
                                                color: '#000000'
                                            });
                                        }
                                    }
                                }
                                rooms[room_id]['running'] = false;
                            }
                        }
                    }
                }
            }
        }
    });
    socket.on('disconnect', function() {
        if (room_id) {
            if (rooms[room_id]) {
                if (rooms[room_id]['red']['socket'] === socket) {
                    // red disconnected
                    rooms[room_id]['red']['socket'] = null;
                    if (rooms[room_id]['blue']['socket'] && rooms[room_id]['running']) {
                        rooms[room_id]['blue']['socket'].emit('display', {
                            text: "Opponent disconnected",
                            color: '#000000'
                        });
                    }
                } else if (rooms[room_id]['blue']['socket'] === socket) {
                    // blue disconnected
                    rooms[room_id]['blue']['socket'] = null;
                    if (rooms[room_id]['red']['socket'] && rooms[room_id]['running']) {
                        rooms[room_id]['red']['socket'].emit('display', {
                            text: "Opponent disconnected",
                            color: '#000000'
                        });
                    }
                } else {
                    // spectator disconnected
                    rooms[room_id]['spectators']['sockets'].splice(rooms[room_id]['spectators']['sockets'].indexOf(socket), 1);
                }
                if (!rooms[room_id]['red']['socket'] && !rooms[room_id]['blue']['socket']) {
                    rooms[room_id] = null;
                }
            }
        }
    });
});

function checkForWinner(data) {
    // check the layers
    for (var layer = 0; layer <= 2; layer++) {
        // check x direction
        for (var z = 0; z <= 2; z++) {
            if ((data[0][layer][z] === data[1][layer][z]) && (data[0][layer][z] === data[2][layer][z])) {
                if (data[0][layer][z]) {
                    return data[0][layer][z];
                }
            }
        }
        // check z direction
        for (var x = 0; x <= 2; x++) {
            if ((data[x][layer][0] === data[x][layer][1]) && (data[x][layer][0] === data[x][layer][2])) {
                if (data[x][layer][0]) {
                    return data[x][layer][0];
                }
            }
        }
        // check diagonals
        if ((data[0][layer][0] === data[1][layer][1]) && (data[0][layer][0] === data[2][layer][2])) {
            if (data[0][layer][0]) {
                return data[0][layer][0];
            }
        }
        if ((data[2][layer][0] === data[1][layer][1]) && (data[2][layer][0] === data[0][layer][2])) {
            if (data[2][layer][0]) {
                return data[2][layer][0];
            }
        }
    }

    // check slices
    for (var x = 0; x <= 2; x++) {
        // check for columns
        for (var z = 0; z <= 2; z++) {
            if ((data[x][0][z] === data[x][1][z]) && (data[x][0][z] === data[x][2][z])) {
                if (data[x][0][z]) {
                    return data[x][0][z];
                }

            }
        }
        // check for diagonals
        if ((data[x][0][0] === data[x][1][1]) && (data[x][0][0] === data[x][2][2])) {
            if (data[x][0][0]) {
                return data[x][0][0];
            }
        }
        if ((data[x][0][2] === data[x][1][1]) && (data[x][0][2] === data[x][2][0])) {
            if (data[x][0][2]) {
                return data[x][0][2];
            }
        }
    }

    // check z slices for diagonals
    for (var z = 0; z <= 2; z++) {
        // check for diagonals
        if ((data[0][0][z] === data[1][1][z]) && (data[0][0][z] === data[2][2][z])) {
            if (data[0][0][z]) {
                return data[0][0][z];
            }
        }
        if ((data[0][2][z] === data[1][1][z]) && (data[0][2][z] === data[2][0][z])) {
            if (data[0][2][z]) {
                return data[0][2][z];
            }
        }
    }

    // check for big diagonals (opposite corners)
    if ((data[0][0][0] === data[1][1][1]) && (data[0][0][0] === data[2][2][2])) {
        if (data[0][0][0]) {
            return data[0][0][0];
        }
    }
    if ((data[2][0][0] === data[1][1][1]) && (data[2][0][0] === data[0][2][2])) {
        if (data[2][0][0]) {
            return data[2][0][0];
        }
    }
    if ((data[0][0][2] === data[1][1][1]) && (data[0][0][2] === data[2][2][0])) {
        if (data[0][0][2]) {
            return data[0][0][2];
        }
    }
    if ((data[2][0][2] === data[1][1][1]) && (data[2][0][2] === data[0][2][0])) {
        if (data[2][0][2]) {
            return data[2][0][2];
        }
    }

    if (data[0][2][0] && data[1][2][0] && data[2][2][0] && data[0][2][1] && data[1][2][1] && data[2][2][1] && data[0][2][2] && data[1][2][2] && data[2][2][2]) {
        return 'draw';
    }

    return false;
}