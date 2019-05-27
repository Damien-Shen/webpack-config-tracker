const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');

const DEFAULT_OUTPUT_FILENAME = 'webpack-config.json';
const DEFAULT_PLUGIN = {name: 'ConfigTrackerPlugin'};

// take in webpack info and writes into file
/**
 * @param {Object} options info passed from webpack config
 * can contain special param of outputPath, outputFilename
 * and indent
 */
function Plugin(options) {
  this.options = options || {};

  this.options.outputFilename =
    this.options.outputFilename || DEFAULT_OUTPUT_FILENAME;
  this.options.outputPath = this.options.outputPath || '.';

  this.contents = this.options;
}

Plugin.prototype.apply = function(compiler) {
  const self = this;

  const compileStage = function(factory, callback) {
    self.writeOutput(compiler, {status: 'compiling'});
  };

  const compilationStage = function(compilation, callback) {
    const failedModule = function(fail) {
      const output = {
        status: 'error',
        error: fail.error.name || 'unknown-error',
      };
      self.writeOutput(compiler, output);
    };

    if (compilation.hooks) {
      compilation.hooks.failedModule.tap(DEFAULT_PLUGIN, failedModule);
    } else {
      compilation.plugin('failed-module', failedModule);
    }
  };

  const doneStage = function(stats) {
    if (stats.compilation.errors.length > 0) {
      const error = stats.compilation.errors[0];
      self.writeOutput(compiler, {
        status: 'error',
        error: error['name'] || 'unknown-error',
      });
      return;
    }

    // fetch chunk info and fix a path issue
    const chunks = {};
    stats.compilation.chunks.map(function(chunk) {
      const files = chunk.files.map(function(file) {
        const Chunk = {name: file};
        const publicPath = compiler.options.output.publicPath;

        if (publicPath && publicPath.endsWith('/')) {
          Chunk.publicPath = publicPath + file;
        } else if (publicPath) {
          Chunk.publicPath = publicPath + '/' + file;
        }

        if (compiler.options.output.path) {
          Chunk.path = path.join(compiler.options.output.path, file);
        }
        return Chunk;
      });
      chunks[chunk.name] = files;
    });

    const output = {
      status: 'done',
      chunk: chunks,
    };

    self.writeOutput(compiler, output);
  };

  if (compiler.hooks) {
    compiler.hooks.compile.tap(DEFAULT_PLUGIN, compileStage);
    compiler.hooks.compilation.tap(DEFAULT_PLUGIN, compilationStage);
    compiler.hooks.done.tap(DEFAULT_PLUGIN, doneStage);
  } else {
    compiler.plugin('compile', compileStage);
    compiler.plugin('compilation', compilationStage);
    compiler.plugin('done', doneStage);
  }
};

Plugin.prototype.writeOutput = function(compiler, contents) {
  const outputFilename = path.join(
      this.options.outputPath,
      this.options.outputFilename
  );
  mkdirp.sync(path.dirname(outputFilename));

  const publicPath = compiler.options.output.publicPath;
  if (publicPath) {
    contents.publicPath = publicPath;
  }
  this.contents = {...this.contents, ...contents};
  fs.writeFileSync(
      outputFilename,
      JSON.stringify(this.contents, null, this.options.indent)
  );
};

module.exports = Plugin;
