// module.exports = require('./lib');

var Hapi = require('hapi');
var HappyCamper = require('./lib');

var server = new Hapi.Server();
server.connection({ port: 3000 });

server.route([
    {
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
            reply('Hello, world!');
        }
    },
    {
    method: 'GET',
    path: '/hello',
    handler: function (request, reply) {
            reply('this goes to table dictator!');
        }
    },
    {
    method: 'GET',
    path: '/test',
    handler: function (request, reply) {
            reply('this goes to table test!');
        }
    }
]);


var routesMap = [
    { pattern: "/hel+o", name: "dictator"},
    { pattern: "/te.*" , name: "test"},
    { pattern:".*" , name: "main"}
];

server.register({
    register: HappyCamper,
    options: {
        routesMap: routesMap
    }
}, function (err) {
    if (err) {
        throw err; // something bad happened loading the plugin
    }

	server.start(function () {
	    console.log('Server running at:', server.info.uri);
	});
});


