# node-bugzilla

A node module that makes it easy to file bugs automatically from node and Express apps.

When an uncaught exception happens in a node app, `node-bugzilla` handles it and confirms that there is a bug filed in Bugzilla for this crash. Crashes are identified by their summary, which includes an optional user supplied prefix (e.g., "[Crash:<my-app>]"), an error message (the value of `err.message`) and the filename and line number of the crash's top frame. Bugs are only filed once, and additional crashes in the same location will not fill-up your Bugzilla server with duplicates.

# Install
For [node](http://nodejs.org) install with [npm](http://npmjs.org):

```
npm install node-bugzilla
```

# Usage

To use `node-bugzilla` in your app, first require it, and create an instance by connecting to a [Bugzilla REST API](https://wiki.mozilla.org/Bugzilla:REST_API):

```javascript
require( 'node-bugzilla' ).connect({
  url: "https://api-dev.bugzilla.mozilla.org/1.3/",
  username: "user",
  password: "secret",
  defaults: {
    "product": "FoodReplicator",
    "component": "Salt"
  }
},
function callback( err, bugzilla ) {
  if ( err ) {
    console.log( 'node-bugzilla error: Unable to connect to bugzilla.' );
    return;
  }

  bugzilla.handleUncaughtExceptions( '[Crash:my-app]', function( err, result ) {
    if ( err ) {
      console.log( 'node-bugzilla error: Crash, but unable to file bug in bugzilla.' );
      return;
    }

    console.log( "Crash, Bug #" + result.bug );
    console.log( result.err.stack );
  });
});
```

In the above example, a connection is made to the Mozilla Bugzilla test instance. A number of default fields are specified, which will be used when creating new bugs (note: `product` and `component` are required, and you can specify [other fields](https://wiki.mozilla.org/Bugzilla:REST_API:Objects#Bug)).

The callback function passed to `connect` enables one to get back the connected instance. If something goes wrong, `err` will contain the error message; otherwise the second argument contains the `bugzilla` object.

With the connected `bugzilla` object, you can enable global exeception handling using `bugzilla.handleUncaughtExceptions`, such that all crashes create new bugs (or confirm one is already filed--only 1 bug will ever be filed for a given crash). You can optionally specify a `prefix` to add to any bug's summary, for example: [Crash:<name of your app>].  You can also provide an optional callback, which will get the unhandled error as well as the bug number that is filed against it. If your callback itself causes an unhandled exception, no bug will be filed.

# License

Copyright 2013 David Humphrey david.humphrey@senecacollege.ca

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
