var HapiCamper = require('./hapicamper');

var internals = {};

module.exports.register = function (server, options, next) {

    var hc = new HapiCamper(server, options);
    
    server.expose('hapicamper', hc);
    
    return hc.init(next);
};

module.exports.register.attributes = {
    pkg: require('../package.json')
};
