var Good = require('good');
var Squeeze = require('good-squeeze').Squeeze;
var Hoek = require('hoek');
var Moment = require('moment');
var SafeStringify = require('json-stringify-safe');
var Through = require('through2');
var _ = require('underscore');

var repository = require('./repository');

var internals = {
    defaults: {
        format: 'YYMMDD/HHmmss.SSS',
        utc: true,
        defaultTableName: 'default'
    }
};

module.exports.register = function (server, options, next) {
    
    var settings = 
    {
        'defaultTableName' : internals.defaults.defaultTableName,
        'routesMap' :  options.routesMap
    };
    
    if(options.replay){
        server.ext('onRequest', function (request, reply) {
            processReplay(request, reply, settings);
        });
    }
    
    //register Good
    server.register({
        register: Good,
        options: {
            requestPayload: true,
            responsePayload:true,
            reporters: [{
                reporter: internals.HappyCamper,
                events: {
                    response: '*',
                },
                config:{
                    routesMap: options.routesMap,
                    record: options.record,
                    replay: options.replay
                }
            }]
        }
    }, function (err) {
        if (err) {
            throw err; // something bad happened loading the plugin
        }
    
        next();
    });    
};

module.exports.register.attributes = {
    pkg: require('../package.json')
};

internals.HappyCamper = function (events, config) {

    if (!(this instanceof internals.HappyCamper)) {
        return new internals.HappyCamper(events, config);
    }
    
    config = config || {};
    this._settings = Hoek.applyToDefaults(internals.defaults, config);
    this._filter = new Squeeze(events);
};


internals.HappyCamper.prototype.init = function (stream, emitter, callback) {

    var self = this;

    if (!stream._readableState.objectMode) {
        return callback(new Error('stream must be in object mode'));
    }

    stream.pipe(this._filter).pipe(Through.obj(function goodConsoleTransform (data, enc, next) {

        var eventName = data.event;
        var tags = [];

        /*eslint-disable */
        if (Array.isArray(data.tags)) {
            tags = data.tags.concat([]);
        } else if (data.tags != null) {
            tags = [data.tags];
        }
        /*eslint-enable */

        tags.unshift(eventName);

        if (eventName === 'response') {
            this.push(self._formatResponse(data, tags));
            return next();
        }
        
        return next();
    })).pipe(process.stdout);

    callback();
};


var findTableName = function(path, defaultTableName, routesMap){
     
    var tableName = defaultTableName;
    
    if(routesMap){
        var matchingPattern = _.find(routesMap, function(routeMap){
            return path.match(routeMap.pattern);
        });
        
        tableName =  matchingPattern.name || defaultTableName;
    }  
    
    return tableName;
};

internals.HappyCamper.prototype._process = function (event) {

    var self = this;
    
    if(self._settings.record){

        var tableName = findTableName(event.responseData.path, self._settings.defaultTableName, self._settings.routesMap);
        
        var insertObj = 
        { 
            tableName : tableName,
            requestPath : event.responseData.path,
            requestPayload : event.responseData.requestPayload,
            responsePayload: event.responseData.responsePayload,
            requestMethod: event.responseData.requestMethod
        };
        
        repository.insert(insertObj, function(err){
            
            if(err){
                return  self._processError(err);
            }
            
            return  self._printEvent(event) + '\n';
        }); 
    }
    else{
        return  self._printEvent(event) + '\n';
    }
};

internals.HappyCamper.prototype._processError = function (error) {
    return "ERROR: " + error;
};


internals.HappyCamper.prototype._printEvent = function (event) {
    
    var self = this;

    var m = Moment.utc(event.timestamp);
    if (!self._settings.utc) { m.local(); }

    var timestring = m.format(self._settings.format);
    var data = event.data;
    var output = timestring + ', [' + event.tags.toString() + '], ' + data;

    return output + '\n';
};


internals.HappyCamper.prototype._formatResponse = function (event, tags) {

    var query = event.query ? JSON.stringify(event.query) : '';
    var responsePayload = '';
    var statusCode = '';

    if (typeof event.responsePayload !== 'undefined' && event.responsePayload) {
        responsePayload = 'response payload: ' + SafeStringify(event.responsePayload);
    }

    var methodColors = {
        get: 32,
        delete: 31,
        put: 36,
        post: 33
    };
    
    var color = methodColors[event.method] || 34;
    var method = '\x1b[1;' + color + 'm' + event.method + '\x1b[0m';

    if (event.statusCode) {
        color = 32;
        if (event.statusCode >= 500) {
            color = 31;
        } else if (event.statusCode >= 400) {
            color = 33;
        } else if (event.statusCode >= 300) {
            color = 36;
        }
        statusCode = '\x1b[' + color + 'm' + event.statusCode + '\x1b[0m';
    }

    
    var responseData = {
        query : event.query,
        path : event.path,
        requestMethod : event.method,
        requestPayload: event.requestPayload,
        responsePayload: event.responsePayload
    };

    return this._process({
        timestamp: event.timestamp,
        tags: tags,
        //instance, method, path, query, statusCode, responseTime, responsePayload
        data: Hoek.format('%s: %s %s %s %s (%sms) %s', event.instance, method, event.path, query, statusCode, event.responseTime, responsePayload),
        responseData : responseData
    });
};

var processReplay = function(request, reply, settings){
    
    var tableName = findTableName(request.path, settings.defaultTableName, settings.routesMap);
    
    var findCriteria =
    {
        tableName: tableName,
        requestMethod : request.method,
        requestPath: request.path,
        requestPayload: request.payload,
        responsePayload : null,
    };
    
    //find a database match for request
    repository.findOne(findCriteria, function(err, model){
       
       if(model && !err){
            return reply(model.response_payload);
        }
        else{
            reply.continue();
        }
        
    });
};