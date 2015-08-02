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
            requestQuery: request.url.search
        };
        
        //find a database match for request
        repository.findOne(findCriteria, function(err, model){
           
            if(model && !err){
               
                var result = model.response_payload;
                if(model.response_payload && typeof model.response_payload === 'object'){
                    result = JSON.parse(model.response_payload);
                }
               
               return reply(result).code(model.response_statusCode);
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
        
        var serializedResponsePayload = (typeof request.response.source === 'object' && request.response.source ? SafeStringify(request.response.source) : request.response.source);
        var serializedRequestPayload = (typeof request.payload === 'object' && request.payload ? SafeStringify(request.payload) : request.payload);
        
        var responsePayload = serializedResponsePayload;
        var requestMethod = request.method;
        var requestPath = request.path;
        var requestPayload = serializedRequestPayload;
        var responseStatusCode = request.response.statusCode;
        var requestQuery = request.url.search;
        
        var tableName = self._getTableName(request.path, settings.defaultTableName, settings.routesMap);
        
        var insertObj = 
        { 
            tableName : tableName,
            requestPath : requestPath,
            requestQuery: requestQuery,
            requestPayload : requestPayload,
            responsePayload: responsePayload,
            requestMethod: requestMethod,
            responseStatusCode: responseStatusCode,
        };
        
        //TODO: validate elegantly
        if(responseStatusCode && requestPath && requestMethod && tableName){
            repository.insert(insertObj, function(err){
                reply.continue(); //continue no matter what happens
            }); 
        }
        else{
            reply.continue();
        }
        

    }
    else{
        reply.continue();
    }
};