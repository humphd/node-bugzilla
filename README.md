# node-bugzilla

A node module that makes it easy to file bugs automatically from node and Express apps.

# Overview

When an uncaught exception happens in a node app, `node-bugzilla` handles it and confirms that there is a bug filed in Bugzilla for this crash. Crashes are identified by their summary, which includes an optional user supplied prefix (e.g., "[Crash:my-app]"), an error message (the value of `err.message`) and the filename and line number of the crash's top frame. Bugs are only filed once, and additional crashes in the same location will not fill-up your Bugzilla server with duplicates.

# Install
For [node](http://nodejs.org) install with [npm](http://npmjs.org):

```
npm install node-bugzilla
```

# Usage

To use `node-bugzilla` in your app, first require it, and create an instance by connecting to a [Bugzilla REST API](https://wiki.mozilla.org/Bugzilla:REST_API):

```javascript
var bugzilla = require( 'node-bugzilla' ).connect({
  url: "https://api-dev.bugzilla.mozilla.org/test/1.3/",
  username: "user",
  password: "secret",
  defaults: {
    "product": "My Bugzilla Product",
    "component": "My Bugzilla Component"
  }
});

bugzilla.handleUncaughtExceptions( '[Crash:my-app]', function( err, result ) {
  if ( err ) {
    console.log( 'Crash, node-bugzilla unable to file bug in bugzilla.' );
    return;
  }

  console.log( "Crash, Bug #" + result.bug );
  console.log( result.err.stack );
});
```

In the above example, a connection is made to the Mozilla Bugzilla test instance. A number of default fields are specified, which will be used when creating new bugs (note: `product` and `component` are required, and you can specify [other fields](https://wiki.mozilla.org/Bugzilla:REST_API:Objects#Bug)).

With the `bugzilla` object, you can enable global exeception handling using `handleUncaughtExceptions`, such that all crashes create new bugs (or confirm one is already filed--only 1 bug will ever be filed for a given crash). You can optionally specify a `prefix` to add to any bug's summary, for example: [Crash:my-app]. You can also provide an optional callback, which will get the unhandled error as well as the bug number that is filed against it. If your callback itself causes an unhandled exception, no bug will be filed.

# Methods

## connect( options, [callback] )

The `connect` method must be called first. It creates and returns an instance. It expects a number of options, and an optional callback:

* `url` - the Bugzilla REST API url to use, for example https://api-dev.bugzilla.mozilla.org/1.3/ (see [Bugzilla REST API](https://wiki.mozilla.org/Bugzilla:REST_API))
* `username` - a Bugzilla username
* `password` - the user's password
* `defaults` - an `Object` list of bug [fields](https://wiki.mozilla.org/Bugzilla:REST_API:Objects#Bug) and their values to use when creating new bugs. Only the `product` and `component` fields are necessary, but any valid field can be specified. Default values will be used for The `platform` (All), `op_sys` (All), `severity` (normal), `version` (1.0), and `priority` (P2) fields if left absent, since Bugzilla expects them to be specified.

You can also specify an optional `callback` function in order to make sure that your instance is properly connected (the `connect` method tries to connect to the url and with the given username/password):

```javascript
var bugzilla = require( 'node-bugzilla' ).connect({
  url: "https://api-dev.bugzilla.mozilla.org/1.3/",
  username: "user",
  password: "secret",
  defaults: {
    "product": "My Bugzilla Product",
    "component": "My Bugzilla Component"
  }
},
function( err ) {
  if ( err ) {
    console.log( 'node-bugzilla unable to connect to server.' );
  } else {
    console.log( 'node-bugzilla connected to server.' );
  }
});
```

## handleUncaughtExceptions( [prefix], [callback] )

Once `connect` has been called, and you have an instance, you can call the `handleUncaughtExceptions` method. It can optionally be passed a `prefix` and a `callback`. The `prefix` is a string to add to the summary of any bugs filed, and is useful for indicating the name of your app.

The `callback` will receive two arguments, an error message, and a crash report:

* `error` - either a `String` indicating that the connection to bugzilla didn't work, or nothing if successful.
* `report` - an `Object` with an `err` property (the uncaught exception), and a `bug` property (the bug's id that was filed for this issue).

# Testing

You can try `node-bugzilla` using Mozilla's test server:

* Web: http://landfill.bugzilla.org/bzapi_sandbox/
* API: https://api-dev.bugzilla.mozilla.org/test/1.3/ or https://api-dev.bugzilla.mozilla.org/test/latest/

The URL you provide with your options to `connect` needs to be the API endpoint, not the Web URL.

# License

Copyright 2013 David Humphrey david.humphrey@senecacollege.ca

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
