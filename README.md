# hapicamperjs

HapiCamper is a [hapi](https://github.com/hapijs/hapi) plugin that allows you to record and replay http requests. When recording is on, all requests are recorded in a sqlite database. When replay is turned on, any requets that match the signature of a pre-recorded request will have its content served from that database. If no match is found, the request will run normally (eg. go hit the backend for information). The two operations, record and replay are mutually exclusive. You may run either of them independently of the other. Request info is stored in one table (called "main") by default. You can optionally provide a map to map request routes to different tables. See section below for usage details.

## Usage
```
var HapiCamper = require('hapicamperjs');

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
```

### Record and Replay

To enable or disable record and replay features of this plugin, use the options object.
```
server.register({
    register: HapiCamper,
    options: {
        routesMap: null,
        record: true,
        replay: true
    }
}
```


### Route map to custom tables

The plugin options object also accepts a routesMap. routesMap allows you to map the routes of requests into custom tables. This could be useful if you need to ogranize the data into smaller sets. For each mapping you may provide a regex for the pattern.
```
var routesMap = [
    { pattern: "/hel+o", name: "hello"},
    { pattern: "/te.*" , name: "test"},
    { pattern: ".*" , name: "main"}
];
```

This will map all requests matching regex '/hel+o' to table 'hello', and anything that starts with 'te' to be mapped to the 'test' table. You may also provide a catch-all mapping by using '.*' to map everything to 'main' table. For table names, you may not use any [reserved sqlite3 keywords] (https://www.sqlite.org/lang_keywords.html).

**The order in which you specify the mappings matter. The first pattern to successfully match a route will be used. So any catch-all mappings need to be at the very end.**
