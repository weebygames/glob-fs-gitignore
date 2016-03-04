'use strict';

/* deps: mocha */
var path = require('path');

var fs = require('fs-extra');
var assert = require('assert');
var glob = require('glob-fs');
var logging = require('devkit-logging');
var gitignore = require('../');

var has = function(files, fp) {
  return files.indexOf(fp) !== -1;
};

describe('gitignore', function () {
  var testDir = __dirname;
  var gitignoreOpts = { gitignoreLogLevel: logging.LEVELS.SILLY.level };
  var readdirOpts = { cwd: testDir };
  var globPattern = '**/*';

  var logger = logging.get('tests');

  before(function () {
    fs.copySync(path.join(testDir, 'gitignore'), path.join(testDir, '.gitignore'));
    fs.ensureFileSync('ignored_by_test.txt');
  });

  after(function () {
    fs.unlinkSync(path.join(testDir, '.gitignore'));
    fs.unlinkSync('ignored_by_test.txt');
  });

  it('should ignore files specified in `.gitignore` automatically:', function (done) {
    glob({ builtins: false })
      .use(gitignore(gitignoreOpts))
      .readdir(globPattern, readdirOpts, function (err, files) {
        logger.log('Files:', files);
        assert.equal(has(files, 'foo.txt'), false);
        assert.equal(has(files, 'bar.txt'), true);
        assert.equal(has(files, 'subfolder'), false);
        assert.equal(has(files, 'subfolder/baz.txt'), false);
        done();
      });
  });

  it('should not use `.gitignore` when `gitignore: false` is passed:', function (done) {
    glob({ builtins: false, gitignore: false })
      .use(gitignore(gitignoreOpts))
      .readdir(globPattern, readdirOpts, function (err, files) {
        logger.log('Files:', files);
        assert.equal(has(files, 'foo.txt'), true);
        assert.equal(has(files, 'bar.txt'), true);
        done();
      });
  });

  it('should ignore files specified in `.gitignore` automatically (no cwd):', function (done) {
    glob({ builtins: false })
      .exclude('.git')
      .use(gitignore(gitignoreOpts))
      .readdir(globPattern, function (err, files) {
        logger.log('Files:', files);
        assert.equal(has(files, 'ignored_by_test.txt'), false);
        assert.equal(has(files, 'index.js'), true);
        done();
      });
  });
});
