function emptyFn(){}

/**
 * Grab the first stack frame off the error object, and get
 * filename and line number. Stack frames look like this:
 *
 *     at require.connect.callback (/foo/app.js:36:13)
 */
function getFrame0( err ) {
  var frame0 = err.stack.split( /\r?\n/ )[ 1 ],
      match = frame0.match( /\(([^:]+):(\d+):(\d+)\)$/ );
  return match ? { filename: match[ 1 ], line: match[ 2 ] } : {};
}

/**
 * Read +/- lines of context around the frame0 error.
 * The `context` variable is the number of lines to read
 * before and after the given error line.
 */
function getSourceLines( frame0, context, callback ) {
  var filename = frame0.filename,
      line = frame0.line;

  if ( !( filename || line ) ) {
    callback();
  }

  require( 'fs' ).readFile( filename, 'utf8', function( err, data ) {
    if ( err ) {
      callback();
      return;
    }

    // Grab `context` lines of context on either side of the line
    data = data.split( /\r?\n/ );
    data[ line - 1 ] += " <<<<<<<< Line " + line;
    var start = Math.max( 0, line - context ),
        end = Math.min( data.length, line + context ),
        lines = data.slice( start, end ).join( '\n' );

    callback( null, filename + ':' + line + '\n' + lines );
  });
}

/**
 * Find an existing bug, or file a new bug. Only 1 bug will ever be
 * filed for a given error message, file, line number. In both cases,
 * the callback will contain the bug number.
 *
 * Bug summaries look like:
 *
 * [Crash:my-app] Object #<process> has no method 'foo' @ /foo/app.js:36
 *
 * Where "[Crash:my-app]" is a user provided prefix. Bugs also get a full
 * backtrace and lines of context from the crash site.
 */
function fileBug( prefix, error, bugzilla, callback ) {
  prefix += ' ';

  var frame0 = getFrame0( error ),
      suffix = frame0.filename ? ' @ ' + frame0.filename + ':' + frame0.line : '',
      summary = prefix + error.message + suffix;

  // If there's already a bug on file, don't file another
  bugzilla.searchBugs({
    summary: summary,
    summary_type: 'contains_all_words'
  },
  function( err, bugs ) {
    if ( err ) {
      callback( err );
      return;
    }

    if ( bugs.length >= 1 ) {
      callback( null, bugs[ 0 ].id );
      return;
    }

    // Otherwise file a new bug
    getSourceLines( frame0, 4, function( err, sourceLines ) {
      if ( err ) {
        sourceLines = '';
      }

      var bug = {
        summary: summary,
        comments: [{ text: error.stack + '\n\n' + sourceLines }]
      };

      // Populate bug with bug field defaults.
      Object.keys( bugzilla.defaults ).forEach( function( key ) {
        bug[ key ] = bugzilla.defaults[ key ];
      });

      bugzilla.createBug( bug, callback );
    });
  });
}

/**
 * Connect to a Bugzilla instance, passing the instance back in the callback.
 * Callers must provide the following options:
 *
 * - username (Bugzilla user)
 * - password
 * - url (Bugzilla REST API url)
 * - defaults (optional) a list of fields to use when filing a new bug
 *
 */
function connect( options, callback ) {
  options = options || {};
  callback = callback || emptyFn;

  var username = options.username,
      password = options.password,
      url = options.url,
      defaults = options.defaults || {},
      bugzilla = require( 'bz' ).createClient({
        url: url,
        username: username,
        password: password
      });

  // TODO: set some defaults we can automatically include

  // Test the connection to the server
  bugzilla.getConfiguration( function( err, result ) {
    if ( err ) {
      callback( err );
      return;
    }

    // Add some useful bugzilla config info to our instance
    bugzilla.version = result.version;
    bugzilla.maxAttachmentSizeBytes = result['max_attachment_size'];
    bugzilla.defaults = defaults;

    bugzilla.handleUncaughtExceptions = function( prefix, callback ) {
      // Don't handle more than one crash, in case the callback also throws
      // and we end-up in an infinite loop.
      process.once( 'uncaughtException', function( err ) {
        callback = callback || emptyFn;
        fileBug( prefix, err, bugzilla, function( error, bug ) {
          callback( error, { err: err, bug: bug } );
        });
      });
    };

    callback( null, bugzilla );
  });
}

exports.connect = connect;
