const path = require('path')
const buble = require('rollup-plugin-buble')
const replace = require('rollup-plugin-replace')
const alias = require('rollup-plugin-alias')
const version = process.env.VERSION || require('../package.json').version
const firstYear = 2016;
const year = new Date().getFullYear();

const banner =
  '/*!\n' +
  ' * Isntit - a simple javascript validation library\n' +
  ' * version: ' + version + '\n' +
  ' * (c) ' + firstYear + ((firstYear == year)? '' : '-' + year) + ' stoempsaucisse\n' +
  ' * Released under the MIT License.\n' +
  ' */\n'

// const baseAlias = require('./alias')

const builds = {
  // Runtime only (CommonJS). Used by bundlers e.g. Webpack & Browserify
  'web-standalone-dev': {
    entry: path.resolve(__dirname, '../src/entries/development.js'),
    dest: path.resolve(__dirname, '../dist/isntit.js'),
    format: 'umd',
    env: 'development',
    banner,
    alias: {
      he: './entity-decoder'
    }
  },
  'web-standalone-prod': {
    entry: path.resolve(__dirname, '../src/entries/production.js'),
    dest: path.resolve(__dirname, '../dist/isntit.min.js'),
    format: 'umd',
    env: 'production',
    banner,
    alias: {
      he: './entity-decoder'
    }
  },
  'web-runtime-dev': {
    entry: path.resolve(__dirname, '../src/index.js'),
    dest: path.resolve(__dirname, '../dist/isntit.common.js'),
    format: 'cjs',
    banner
  }
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
      buble(),
      alias(Object.assign({}, /*baseAlias, */opts.alias))
    ]
  }

  if (opts.env) {
    config.plugins.push(replace({
      "'process.env.NODE_ENV'": JSON.stringify(opts.env)
    }))
  } else {
    config.plugins.push(replace({
      "'process.env.NODE_ENV'": 'process.env.NODE_ENV'
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
