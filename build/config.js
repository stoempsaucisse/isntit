const path = require('path');
const replace = require('rollup-plugin-replace');
const version = process.env.VERSION || require('../package.json').version;
const firstYear = 2016;
const year = new Date().getFullYear();

const banner =
  '/*!\n' +
  ' * Isntit - a simple javascript validation library\n' +
  ' * version: ' + version + '\n' +
  ' * (c) ' + firstYear + ((firstYear == year)? '' : '-' + year) + ' stoempsaucisse\n' +
  ' * Released under the MIT License.\n' +
  ' */\n';

const builds = {
  // Runtime only (CommonJS). Used by bundlers e.g. Webpack & Browserify
  'isntit-dev': {
    entry: path.resolve(__dirname, '../src/entries/development.js'),
    dest: path.resolve(__dirname, '../dist/isntit.js'),
    format: 'umd',
    env: 'development',
    banner,
    moduleName: 'isntit'
  },
  // Bag Runtime only (CommonJS). Used by bundlers e.g. Webpack & Browserify
  'test': {
    entry: path.resolve(__dirname, '../src/entries/test.js'),
    dest: path.resolve(__dirname, '../dist/test.js'),
    format: 'umd',
    env: 'development',
    banner,
    moduleName: 'test'
  },
  // Message Bag Runtime only (CommonJS). Used by bundlers e.g. Webpack & Browserify
  // 'messageBag-dev': {
  //   entry: path.resolve(__dirname, '../src/entries/messageBag.js'),
  //   dest: path.resolve(__dirname, '../dist/messageBag.js'),
  //   format: 'umd',
  //   env: 'development',
  //   banner,
  //   moduleName: 'messageBag'
  // },
  // // Bag Runtime only (CommonJS). Used by bundlers e.g. Webpack & Browserify
  // 'bag-dev': {
  //   entry: path.resolve(__dirname, '../src/entries/bag.js'),
  //   dest: path.resolve(__dirname, '../dist/bag.js'),
  //   format: 'umd',
  //   env: 'development',
  //   banner,
  //   moduleName: 'bag'
  // },
  // Bag Runtime only (CommonJS). Used by bundlers e.g. Webpack & Browserify
  'validator-dev': {
    entry: path.resolve(__dirname, '../src/entries/validator.js'),
    dest: path.resolve(__dirname, '../dist/validator.js'),
    format: 'umd',
    env: 'development',
    banner,
    moduleName: 'validator'
  },
  // Bag Runtime only (CommonJS). Used by bundlers e.g. Webpack & Browserify
  'validators-dev': {
    entry: path.resolve(__dirname, '../src/entries/validators.js'),
    dest: path.resolve(__dirname, '../dist/validators.js'),
    format: 'umd',
    env: 'development',
    banner,
    moduleName: 'validators'
  }
};

var genConfig = function (opts) {
  const config = {
    entry: opts.entry,
    dest: opts.dest,
    external: opts.external,
    format: opts.format,
    banner: opts.banner,
    moduleName: opts.moduleName,
    plugins: [/*
      flow(),
      buble()/**/
    ]/**/
    };

  if (opts.env) {
    config.plugins.push(replace({
      "'process.env.NODE_ENV'": JSON.stringify(opts.env)
    }))
  } else {
    config.plugins.push(replace({
      "'process.env.NODE_ENV'": 'process.env.NODE_ENV'
    }))

  };

  return config;
};

if (process.env.TARGET) {
  module.exports = genConfig(builds[process.env.TARGET])
} else {
  exports.getBuild = name => genConfig(builds[name])
  exports.getAllBuilds = () => Object.keys(builds).map(name => genConfig(builds[name]))
};