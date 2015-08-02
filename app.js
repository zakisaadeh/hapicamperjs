//DEV NOTE: add hapi dependency when wanting to run this for a quick demo

var Hapi = require('hapi');
var HapiCamper = require('./lib');

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
        var obj = {'firstName' : 'Zaki',
            'lastName': 'Saadeh'};
            reply(obj);
        }
    },
    {
    method: 'GET',
    path: '/error400',
    handler: function (request, reply) {
            reply(null).code(400);
        }
    },
    {
    method: 'GET',
    path: '/error500',
    handler: function (request, reply) {
            reply(null).code(500);
        }
    }
]);


var routesMap = [
    { pattern: "/hel+o", name: "dictator"},
    { pattern: "/te.*" , name: "test"},
    { pattern:".*" , name: "main"}
];

server.register({
    register: HapiCamper,
    options: {
        routesMap: null,
        record: true,
        replay: true
    }
}, function (err) {
    if (err) {
        throw err; // something bad happened loading the plugin
    }

	server.start(function () {
	    console.log('Server running at:', server.info.uri);
	});
});