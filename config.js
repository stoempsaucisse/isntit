const path = require('path')
const flow = require('rollup-plugin-flow-no-whitespace')
const buble = require('rollup-plugin-buble')
const replace = require('rollup-plugin-replace')
const alias = require('rollup-plugin-alias')
const version = process.env.VERSION || require('./package.json').version

const banner =
  '/*!\n' +
  ' * Isntit - a simple javascript validation library\n' +
  ' * version: ' + version + '\n' +
  ' * (c) 2016-' + new Date().getFullYear() + ' stoempsaucisse\n' +
  ' * Released under the MIT License.\n' +
  ' */\n'

// const baseAlias = require('./alias')

const builds = {
  'web-standalone-dev': {
    entry: path.resolve(__dirname, './src/index.js'),
    dest: path.resolve(__dirname, './isntit.js'),
    format: 'umd',
    env: 'development',
    banner,
    alias: {
      he: './entity-decoder'
    }
  }/*,
  'web-standalone-prod': {
    entry: path.resolve(__dirname, './src/index.js'),
    dest: path.resolve(__dirname, './isntit.min.js'),
    format: 'umd',
    env: 'production',
    banner,
    alias: {
      he: './entity-decoder'
    }
  }/**/
}

function genConfig (opts) {
  const config = {
    entry: opts.entry,
    dest: opts.dest,
    external: opts.external,
    format: opts.format,
    banner: opts.banner,
    moduleName: 'Isntit',
    plugins: [
      flow(),
      buble(),
      alias(Object.assign({}, /*baseAlias, */opts.alias))
    ]
  }

  if (opts.env) {
    config.plugins.push(replace({
      'process.env.NODE_ENV': JSON.stringify(opts.env)
    }))
  }

  return config
}

if (process.env.TARGET) {
  module.exports = genConfig(builds[process.env.TARGET])
} else {
  exports.getBuild = name => genConfig(builds[name])
  exports.getAllBuilds = () => Object.keys(builds).map(name => genConfig(builds[name]))
}
