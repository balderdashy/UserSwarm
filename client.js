var socket = io.connect('http://userswarm.com:3000');
var RateLimitedSocket = function (callback) {
	// Used to prevent requests coming in too fast
	this.minDuration = 25;
	this.lastSent = null;

	this.initialize = function() {
		_.bindAll(this);
	}

	this.on = function (eventName,callback) {
		socket.on(eventName, callback);
	},

	this.throttledEmit = function (eventName,data) {
		var now = new Date().getTime();

		// TODO: clear timer from below here

		// Only send a message if it's been a while
		if (this.lastSent < now-this.minDuration || !this.lastSent) {
			
			this.lastSent = now;
			socket.emit(eventName,data,callback);
		}

		// TODO: But also set a timer to check later so the correct
		// at-rest position is returned.
	}

	return true;
}


var SwimView = Backbone.View.extend({

	// Prevent scrollbars from appearing w/ edge buffer px
	buffer: 12,

	timeoutTimer: null,
	hidden: false,
	busy: false,
	
	// Ms to wait before hiding this user's cursor
	timeoutDuration: 15000,

	initialize: function(data) {
		_.bindAll(this);
		this.data = data;
		this.el = $(this.generateHTML(data));
		$("body").append(this.el);
		this.move(data.pageX,data.pageY);
	},
	
	move: function (x,y) {
		if (this.hidden) {
			this.show();
		}

		var w = $(window);

		// Bound other user cursor at edge of this user's viewport
		x = (x+this.buffer > w.width()) ? w.width()-this.buffer : x;
		y = (y+this.buffer > w.height()) ? w.height()-this.buffer : y;

		// Move to data.pageX,Y
		this.el.offset({
			left: x,
			top: y
		});

		// Update timeoutTimer
		this.timeoutTimer || window.clearTimeout(this.timeoutTimer);
		this.timeoutTimer = window.setTimeout(this.timeout,this.timeoutDuration);
		
	},

	timeout: function () {
		this.hide();
	},

	hide: function (callback) {
		var me = this;
//		if (this.busy) return;
//		this.busy = true;

		me.hidden = true;
		this.el.stop(true).fadeTo(500,0,function () {
			me.busy = false;
			_.isFunction(callback) && callback();
		});
	},
	show: function (callback) {
		var me = this;
		if (!this.hidden)
			return;
		
//		if (this.busy) return;
//		this.busy = true;

		me.hidden = false;
		this.el.stop(true).fadeTo(500,1,function () {
			me.busy = false;
			_.isFunction(callback) && callback();
		});
	},

	generateHTML: function (data) {
		var template = _.template(this.markup),
			html = template(data);
		return html;
	},

	markup:
		"<div class='swim' style='background-color:<%- color %>;'></div>"

});


//  socket.on('news', function (data) {
//    console.log(data);
//    socket.emit('my other event', { my: 'data' });
//  });
  
var AppView = Backbone.View.extend({

	events: {
//		'mousemove': 'sendEvent'
	},

	users: {},

	initialize: function() {
		_.bindAll(this);



		this.socket = new RateLimitedSocket(function () {
			console.log("k callback");
		});

		this.socket.on('mouse_move',this.handleSwimMouse);
		$(this.domReady);
	},

	domReady: function () {
		// Listen for global mouse movements
		$(window).bind('mousemove',this.sendEvent);
		this.el = $("body");
		this.delegateEvents();
	},

	sendEvent: function (e) {
		// Send mouse position
		this.socket.throttledEmit('mouse_move',{'pageX':e.pageX,'pageY':e.pageY});
	},

	handleSwimMouse: function (swim) {
		var userIds = _.pluck(this.users,'id');
		if (!_.contains(userIds,swim.id)) {
			// New user
			console.log("added new user!",swim);
			this.users[swim.id] = new SwimView(swim);
		}
		else {
			// Existing user
			this.users[swim.id].move(swim.pageX,swim.pageY);
		}

	},

	render: function () {
		
	}
});
a = new AppView();