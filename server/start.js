var _ = require('underscore');
var io = require('socket.io').listen(3000);

var users = [];


io.sockets.on('connection', function (socket) {

	// Establish a user id and color
	var user = {
		id: socket.id,
		color: getRandomColor()
	};
	console.log("connected",user.id,user.color);
	users.push(user);

	socket.on('mouse_move', function (data,callback) {
		data = _.extend(data,{
			id: +user.id,
			color: user.color
		});
		 socket.broadcast.emit('mouse_move',data);
	});
});


function getRandomColor () {
                var color = {
                        red: Math.floor(Math.random() * 256),
                        green: Math.floor(Math.random() * 256),
                        blue: Math.floor(Math.random() * 256)
                };
                return "rgba("+color.red+","+color.green+","+color.blue+",0.95)";
        }
