var db = require('sqlite-wrapper')('happycamper.sqlite3');

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
        'request_payload': {
            type: 'TEXT'
        },
        'request_method': {
            type: 'TEXT',
            notnull: true
        },
        'response_payload': {
            type: 'TEXT'
        }
    }, callback);
    
};

var insert = function(insertObj, callback){
  
  var tableName = insertObj.tableName;
  var requestMethod = insertObj.requestMethod;
  var requestPath = insertObj.requestPath;
  var requestPayload = insertObj.requestPayload;
  var responsePayload = insertObj.responsePayload;
  
  var findCriteria = 
  {
    tableName: tableName,
    requestMethod : requestMethod,
    requestPath : requestPath,
    requestPayload : requestPayload,
    responsePayload: responsePayload
  };
  
  _createTable(tableName, function(){
  
      //check if record exist first. do not insert dup
      findOne(findCriteria,
          function(err, row) {
              
              if(!err && !row){
                    db.insert(tableName, {
                        request_path: requestPath,
                        request_method: requestMethod,
                        request_payload: requestPayload,
                        response_payload : responsePayload
                    }, callback);
              }
        });
    }); 
};

var findOne = function(findCriteria, cb){
  
  var tableName = findCriteria.tableName;
  
  var requestMethod = findCriteria.requestMethod;
  var requestPath = findCriteria.requestPath;
  var requestPayload = findCriteria.requestPayload;
  
  var tblRequestPath = tableName + '.request_path';
  var tblRequestMethod = tableName + '.request_method';
  var tblRequestPayload = tableName + '.request_payload';
  var tblResponsePayload = tableName + '.response_payload';
  
  var columnMappings = {};
  columnMappings[tblRequestPath.toString()] = 'request_path';
  columnMappings[tblRequestMethod.toString()] = 'request_method';
  columnMappings[tblRequestPayload.toString()] = 'request_payload';
  columnMappings[tblResponsePayload.toString()] = 'response_payload';
  
  var whereClause = 'request_path=? and request_method=?';
  var whereValues = [requestPath, requestMethod];
  
  
  if(requestPayload){
      whereClause += ' and request_payload=?';
      whereValues.push(requestPayload);
  }
  else{
      whereClause += ' and request_payload is null';
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