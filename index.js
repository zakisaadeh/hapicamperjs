// module.exports = require('./lib');

var Hapi = require('hapi');
var Good = require('good');
var HappyCamper = require('./lib');

var server = new Hapi.Server();
server.connection({ port: 3000 });


server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        reply('Hello, world!');
    }
});



server.register({
    register: Good,
    options: {
        requestPayload: true,
        responsePayload:true,
        reporters: [{
            reporter: HappyCamper,
            events: {
                response: '*',
                // log: '*'
            }
        }]
    }
}, function (err) {
    if (err) {
        throw err; // something bad happened loading the plugin
    }

	server.start(function () {
	    console.log('Server running at:', server.info.uri);
	});
});


