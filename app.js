var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { MongoClient } = require('mongodb');
const { Server } = require('socket.io');

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

const dbName = 'datadb';

async function main() {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    return db;
}

main().then((db) => {
    var indexRouter = require('./routes/index')(db);
    var usersRouter = require('./routes/users')(db); // immediately call
    var chatsRouter = require('./routes/chats')(db);

    var app = express();

    app.use(logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

    app.use('/', indexRouter);
    app.use('/users', usersRouter);
    app.use('/chats', chatsRouter);

    var debug = require('debug')('web-api:server');
    var http = require('http');

    /**
     * Get port from environment and store in Express.
     */

    var port = normalizePort(process.env.PORT || '3000');
    app.set('port', port);

    /**
     * Create HTTP server.
     */

    var server = http.createServer(app);
    const io = new Server(server);

    let onlineUsers = {};

    io.on('connection', (socket) => {

        socket.on('user_online', (username) => {
            onlineUsers[username] = socket.id;
            console.log(`${username} is online`);

            // Send updated list to the connected user
            socket.emit('online_users', onlineUsers);

            // Broadcast to others that a new user is online
            socket.broadcast.emit('friend_online', onlineUsers);
        });

        socket.on('refresh-data', () => {
            console.log('fontend ngasih tau data harus di refresh')
            socket.broadcast.emit('load-data')
        })

        socket.on('add-chat', (data) => {
            socket.broadcast.emit('load-chat', data)
        })

        socket.on('disconnect', () => {
            let disconnectedUser = null;

            for (let username in onlineUsers) {
                if (onlineUsers[username] === socket.id) {
                    disconnectedUser = username;
                    delete onlineUsers[username];
                    console.log(`${username} is offline`);
                    break;
                }
            }

            if (disconnectedUser) {
                // Broadcast to others that a user went offline
                socket.broadcast.emit('friend_offline', onlineUsers);
            }
        });
    });

    /**
     * Listen on provided port, on all network interfaces.
     */

    server.listen(port);
    server.on('error', onError);
    server.on('listening', onListening);

    /**
     * Normalize a port into a number, string, or false.
     */

    function normalizePort(val) {
        var port = parseInt(val, 10);

        if (isNaN(port)) {
            // named pipe
            return val;
        }

        if (port >= 0) {
            // port number
            return port;
        }

        return false;
    }

    /**
     * Event listener for HTTP server "error" event.
     */

    function onError(error) {
        if (error.syscall !== 'listen') {
            throw error;
        }

        var bind = typeof port === 'string'
            ? 'Pipe ' + port
            : 'Port ' + port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    /**
     * Event listener for HTTP server "listening" event.
     */

    function onListening() {
        var addr = server.address();
        var bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        debug('Listening on ' + bind);
    }
}).catch((e) => {
    console.log('gagal terhubung ke mongodb', e)
})
