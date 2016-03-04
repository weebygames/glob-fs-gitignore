'use strict';

var lazy = require('lazy-cache')(require);
lazy('path');
lazy('fs');
lazy('devkit-logging');
lazy('gitignore-parser');

var parseGitignore = function(opts) {
  opts = opts || {};

  var path = lazy.path;
  var fs = lazy.fs;
  var logger = lazy.devkitLogging.get('glob-fs-gitignore');

  if (opts.gitignoreLogLevel !== undefined) {
    logger.setLevel(opts.gitignoreLogLevel);
  } else {
    logger.setLevel(lazy.devkitLogging.LEVELS.WARN.level);
  }

  var cwd = opts.cwd || process.cwd();

  var giFiles = {};
  var testResults = {};

  var findGiFile = function(dir) {
    if (giFiles[dir] !== undefined) {
      return giFiles[dir];
    }
    var giPath = path.join(dir, '.gitignore');
    logger.silly('> Checking for gi at:', giPath);
    if (!fs.existsSync(giPath)) {
      return (giFiles[dir] = null);
    }

    logger.debug('Loading:', giPath);
    var gitignore = {
      gi: lazy.gitignoreParser.compile(fs.readFileSync(giPath, 'utf8')),
      path: giPath,
      dir: dir
    };
    return (giFiles[dir] = gitignore);
  };

  var doShouldIgnoreTest = function(cwd, _path) {
    if (testResults[_path] === false) {
      logger.silly('> Skipping from testResults cache:', _path);
      return false;
    }

    logger.debug('> Testing:', _path);
    var parentDir = path.dirname(_path);
    var ignoreCheck = findGiFile(path.join(cwd, parentDir));
    if (ignoreCheck) {
      var relPath = path.relative(ignoreCheck.dir, path.join(cwd, _path));
      if (ignoreCheck.gi.denies(relPath)) {
        logger.debug('> Ignored by:', ignoreCheck.path);
        // Dont need to store false, glob-fs is smart about that
        return true;
      }
    }
    testResults[_path] = false;
    return false;
  };

  var shouldIgnore = function(cwd, _path) {
    logger.info('Checking:', _path, 'in:', cwd);

    var i = 0;
    var pathLength = _path.length;
    while (i < pathLength) {
      i = _path.indexOf(path.sep, i + 1);
      if (i < 0) {
        i = pathLength;
      }
      var curPath = _path.substring(0, i);

      if (doShouldIgnoreTest(cwd, curPath)) {
        return true;
      }
    }
    return false;
  };

  return function gitignore(file) {
    opts = this.setDefaults(this.pattern.options, opts);

    if (opts.gitignore === false) {
      return file;
    }

    if (shouldIgnore(opts.cwd || cwd, file.relative)) {
      logger.info('> Excluding', file.relative);
      file.exclude = true;
    }
    return file;
  };
};

/**
 * Expose `parseGitignore`
 */

module.exports = parseGitignore;
