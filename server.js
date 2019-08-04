const mongo = require('mongodb').MongoClient;

// const server = require('http').createServer();
// const client = require('socket.io')(server);

var server = require('http').createServer(handler)
var client = require('socket.io')(server);
var fs = require('fs');

let jsonData = JSON.parse(fs.readFileSync(`${__dirname}/particles.json`, 'utf-8'));


function handler(req, res) {
    fs.readFile(__dirname + '/index.html',
        function(err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading Page...');
            }

            res.writeHead(200, { 'Content-type': 'text/html' });
            res.end(data, jsonData);
        });



}



//Connect to MongoDB
mongo.connect('mongodb+srv://ricky093:Icn1950@flashchat-obwgq.mongodb.net/test?retryWrites=true&w=majority', { useNewUrlParser: true }, function(err, db) {
    if (err) {
        throw err;
    }
    console.log('MongoDB connected...');

    //Connect to Socket.io
    client.on('connection', function(socket) {

        let chat = db.db('mongochat').collection('chats');

        //Create a function to send status
        sendStatus = function(s) {
            socket.emit('status', s);
        }

        //Get the chats from the Mongo collection
        chat.find().limit(100).sort({ _id: 1 }).toArray(function(err, res) {
            if (err) {
                throw err;
            }

            //Emit the messages
            socket.emit('output', res)
        });
        //Handle input events
        socket.on('input', function(data) {
            let name = data.name;
            let message = data.message;

            //Check for name and message
            if (name == '' || message == '') {
                //Send error status
                sendStatus('Please enter a name and message');
            } else {
                //Insert the message to the database
                chat.insert({ name: name, message: message }, function() {
                    client.emit('output', [data]);

                    //Send status object
                    sendStatus({
                        message: 'Message Sent',
                        clear: true
                    });
                });
            }
        });

        //Handle Clear
        socket.on('clear', function(data) {
            //Remove all chats from the collection
            chat.remove({}, function() {
                //Emit cleared
                socket.emit('cleared');
            });
        });
    });
});

server.listen(8080, '134.209.208.162', function() {
    console.log('Im listening on Port 8080')
});