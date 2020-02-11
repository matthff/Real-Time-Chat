var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    ent = require('ent'), // Blocks HTML characters (security equivalent to html entities in PHP)
    fs = require('fs');

// Loading the page index.html
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

const allClients = new Set(); // Object for the clients that are received via socket (can be optimized, but will need to ajust all the architecture of the program in certain areas)
const clientsUsernames = []; // Array for clients usernames
const clientsMessages = new Set(); // Messages are received as objects with username and value
var clientsMessagesValues = []; // Array for all the chat section data

io.sockets.on('connection', function (socket, username) {
    allClients.add(socket);// Insert the socket object on the variable for the clients

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
        clientsMessagesArray = Array.from(clientsMessages);
        let lastElement = clientsMessagesArray.splice(-1)[0];
        clientsMessagesValues.push(lastElement);
    }); 

    //When a user disconnects, the username is sent to the client and emit the message
    socket.on('disconnect', function(){
        var i = clientsUsernames.indexOf(socket.username);
        socket.broadcast.emit('client_disconnected', clientsUsernames[i]);
        allClients.delete(socket);
        removeElementFromArray(clientsUsernames, socket.username);
    });

    //When a user changes the username, notify the chat
    socket.on('new_user', function(newUsername){
        username = ent.encode(newUsername);
        let i = clientsUsernames.indexOf(socket.username);
        let tempUser = clientsUsernames[i];
        socket.username = username;
        clientsUsernames[i] = username;
        socket.emit('changed_user', username, tempUser);
        socket.broadcast.emit('changed_user', username, tempUser);
    });

    //TODO
    socket.on('audio_alert', function(username){
        let audioCaller = username;
        socket.broadcast.emit('audio_alert', audioCaller);
    });

    // Receives a call from the frontend to render previous messages
    socket.on('render_message_call', function(){
        var i = 0;
        for(i in clientsMessagesValues){
            socket.emit('render_message_action', clientsMessagesValues[i]);
        }
    });

    // Return all the clients usernames stored to the frontend
    socket.on('client_array', function(){
        socket.emit('client_array_response', clientsUsernames);
    });

    // Return all the previous warning type messages in the chat section 
    socket.on('warning_sender', function(warning){
        var counter = 0;
        for(i in clientsMessagesValues){
            if(clientsMessagesValues[i] == warning){
                counter++;
            }
        }
        if (counter == 0){
            clientsMessagesValues.push(warning);
        }
    });
});

const port = 8080;
server.listen(port);
console.log("App listening on port: " + port);

// Give a element, search in array, if exists remove it
function removeElementFromArray(array, element){
    var elementIndex = array.indexOf(element);
    while(elementIndex  > -1){
        array.splice(elementIndex, 1);
        elementIndex = array.indexOf(element);
    }
}