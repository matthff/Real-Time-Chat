var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    ent = require('ent'), // Blocks HTML characters (security equivalent to html entities in PHP)
    fs = require('fs');

// Loading the page index.html
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

const allClients = new Set();
const clientsUsernames = [];
const clientsMessages = new Set();
var clientsMessagesValues = [];

io.sockets.on('connection', function (socket, username) {
    allClients.add(socket);
    // When the username is received it’s stored as a session variable and informs the other people
    socket.on('new_client', function(username) {
        username = ent.encode(username);
        socket.username = username;
        clientsUsernames.push(username);
        socket.broadcast.emit('new_client', username);
    });

    // When a message is received, the client’s username is retrieved and sent to the other people
    socket.on('message', function (message) {
        message = ent.encode(message);
        socket.broadcast.emit('message', {username: socket.username, message: message});
        clientsMessages.add({username: socket.username, message: message});
        clientsMessagesValues = Array.from(clientsMessages);
    }); 
    //When a user disconnects, the username is sent to the client and emit the message
    socket.on('disconnect', function(){
        var i = clientsUsernames.indexOf(socket.username);
        socket.broadcast.emit('client_disconnected', clientsUsernames[i]);
        allClients.delete(socket);
        removeElementFromArray(clientsUsernames, socket.username);
    })
    //When a user changes the username, notify the chat
    socket.on('new_user', function(newUsername){
        username = ent.encode(newUsername);
        let i = clientsUsernames.indexOf(socket.username);
        let tempUser = clientsUsernames[i];
        socket.username = username;
        clientsUsernames[i] = username;
        socket.emit('changed_user', username, tempUser);
        socket.broadcast.emit('changed_user', username, tempUser);
    })

    socket.on('audio_alert', function(username){
        let audioCaller = username;
        socket.broadcast.emit('audio_alert', audioCaller);
    })

    socket.on('render_message_call', function(){
        var i = 0;
        for(i in clientsMessagesValues){
            socket.emit('render_message_action', clientsMessagesValues[i]);
        }
    })

    socket.on('client_array', function(){
        socket.emit('client_array_response', clientsUsernames);
    })
});

const port = 8080;
server.listen(port);
console.log("App listening on port: " + port);


function removeElementFromArray(array, element){
    var elementIndex = array.indexOf(element);
    while(elementIndex  > -1){
        array.splice(elementIndex, 1);
        elementIndex = array.indexOf(element);
    }
}