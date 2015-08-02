var Hoek = require('hoek');
var SafeStringify = require('safe-json-stringify');
var _ = require('underscore');
var repository = require('./repository');

var internals = {};

internals.defaults = {
    defaultTableName: 'main'
};


module.exports = internals.HapiCamper = function (server, options){
    var settings = Hoek.applyToDefaults(internals.defaults, options);
    internals.settings = settings;
    internals.server = server;
};

internals.HapiCamper.prototype.init = function(callback){
    
    var self = this;
    
    if(internals.settings.replay){
        internals.server.ext('onRequest', function (request, reply) {
            self._processReplay(request, reply, internals.settings);
        });
    }
    
    if(internals.settings.record){
        internals.server.ext('onPreResponse', function (request, reply) {
            self._processRecord(request, reply, internals.settings);
        });
    }
    
    callback();
};

internals.HapiCamper.prototype._getTableName = function(path, defaultTableName, routesMap){
     
    var tableName = defaultTableName;
    
    if(routesMap){
        var matchingPattern = _.find(routesMap, function(routeMap){
            return path.match(routeMap.pattern);
        });
        
        tableName =  matchingPattern.name || defaultTableName;
    }  
    
    return tableName;
};

internals.HapiCamper.prototype._processReplay = function(request, reply, settings){
    var self = this;
    
    if(settings.replay){
        var tableName = self._getTableName(request.path, settings.defaultTableName, settings.routesMap);
        
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
    }
    else{
        reply.continue();
    }
};


internals.HapiCamper.prototype._processRecord = function(request, reply, settings){
    
    var self = this;
    
    if(settings.record){
        
        var serializedResponsePayload = (typeof request.response.source === 'object' ? SafeStringify(request.response.source) : request.response.source);
        var serializedRequestPayload = (typeof request.payload === 'object' ? SafeStringify(request.payload) : request.payload);
        
        var responsePayload = serializedResponsePayload;
        var requestMethod = request.method;
        var requestPath = request.path;
        var requestPayload = serializedRequestPayload;
        
        var tableName = self._getTableName(request.path, settings.defaultTableName, settings.routesMap);
        
        var insertObj = 
        { 
            tableName : tableName,
            requestPath : requestPath,
            requestPayload : requestPayload,
            responsePayload: responsePayload,
            requestMethod: requestMethod
        };
        
        repository.insert(insertObj, function(err){
            reply.continue(); //continue no matter what happens
        }); 
    }
    else{
        reply.continue();
    }
};