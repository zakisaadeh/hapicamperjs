var db = require('sqlite-wrapper')('hapicamper.sqlite3');

var _createTable = function(tableName, callback){
    
  //this call will only create a table if it doesn't exist
	db.createTable(tableName, {
        'id': {
            type: 'INTEGER',
            primary: true,
            notnull: true
        },
        'request_path': {
            type: 'TEXT',
            notnull: true
        },
        'request_query': {
            type: 'TEXT'
        },        
        'request_payload': {
            type: 'TEXT'
        },
        'request_method': {
            type: 'TEXT',
            notnull: true
        },
        'response_payload': {
            type: 'TEXT'
        },
        'response_statusCode': {
            type: 'INTEGER',
            notnull: true
        }
    }, callback);
    
};

var insert = function(insertObj, callback){
  
  var tableName = insertObj.tableName;
  var requestMethod = insertObj.requestMethod;
  var requestPath = insertObj.requestPath;
  var requestPayload = insertObj.requestPayload;
  var responsePayload = insertObj.responsePayload;
  var responseStatusCode = insertObj.responseStatusCode;
  var requestQuery = insertObj.requestQuery;
  
  var findCriteria = 
  {
    tableName: tableName,
    requestMethod : requestMethod,
    requestPath : requestPath,
    requestPayload : requestPayload,
    requestQuery: requestQuery
  };
  
  _createTable(tableName, function(){
  
      //check if record exist first. do not insert dup
      findOne(findCriteria,
          function(err, row) {
              
              if(!err && !row){
                    db.insert(tableName, {
                        request_path: requestPath,
                        request_query: requestQuery,
                        request_method: requestMethod,
                        request_payload: requestPayload,
                        response_payload : responsePayload,
                        response_statusCode: responseStatusCode
                    }, callback);
              }
              else{
                callback(err);
              }
        });
    }); 
};

var findOne = function(findCriteria, cb){
  
  var tableName = findCriteria.tableName;
  
  var requestMethod = findCriteria.requestMethod;
  var requestPath = findCriteria.requestPath;
  var requestPayload = findCriteria.requestPayload;
  var requestQuery = findCriteria.requestQuery;
  
  var tblRequestPath = tableName + '.request_path';
  var tblRequestMethod = tableName + '.request_method';
  var tblRequestPayload = tableName + '.request_payload';
  var tblResponsePayload = tableName + '.response_payload';
  var tblResponseStatusCode = tableName + '.response_statusCode';
  var tblRequestQuery = tableName + '.request_query';
  
  var columnMappings = {};
  columnMappings[tblRequestQuery.toString()] = 'request_query';
  columnMappings[tblRequestPath.toString()] = 'request_path';
  columnMappings[tblRequestMethod.toString()] = 'request_method';
  columnMappings[tblRequestPayload.toString()] = 'request_payload';
  columnMappings[tblResponsePayload.toString()] = 'response_payload';
  columnMappings[tblResponseStatusCode.toString()] = 'response_statusCode';
  
  var whereClause = 'request_path=? and request_method=?';
  var whereValues = [requestPath, requestMethod];
  
  
  if(requestPayload){
      whereClause += ' and request_payload=?';
      whereValues.push(requestPayload);
  }
  else{
      whereClause += ' and request_payload is null';
  }
  
  if(requestQuery){
      whereClause += ' and request_query=?';
      whereValues.push(requestQuery);
  }
  else{
      whereClause += ' and request_query is null';
  }
  
  
  //check if record exist first. do not insert dup
  db.selectOne(tableName, null, 
    columnMappings, 
    whereClause, 
    whereValues,
    function(err, row) {
        return cb(err, row);
  });
};

module.exports = {
	insert : insert,
  findOne : findOne
};