Isntit
===

Isntit is a simple javascript data validation library. It is inspired by [ansman's validate.js](http://validatejs.org/).

[![npm](https://img.shields.io/npm/v/isntit.svg?style=flat-square)]() [![GitHub release](https://img.shields.io/github/release/stoempsaucisse/isntit.svg?style=flat-square)]() [![GitHub tag](https://img.shields.io/github/tag/stoempsaucisse/isntit.svg?style=flat-square)]() [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://raw.githubusercontent.com/stoempsaucisse/isntit/master/LICENSE)

Example
---

```html
<script src="dist/isntit.min.js" type="text/javascript"></script>
```

```js
var options = {
    capitalize: true,                       // capitalize error messages
    devtools: config.env !== 'production',  // activate devtools (! disabled in production files)
    fullMessages: true,                     // prepend messages with the field name
    config: {                               // override config
        silent: false                       // prevent warnings even with devtools
    }
};

var rules = {
    email: {
        required: true,
        email: {
            message: "^'%{value}' is not a valid %{label} ex. : you@mail.com"
        },
        label: 'email address'
    },
    user.firstname: {
        required: true,
        length: {
            min: 3
        },
        label: 'firstname'
    },
    user.age: {
        required: false,                    // Isntit warns about and skip a rule with false
        length: {
            min: 3
        }
    }
};

var I = new Isntit(rules, options);

var results = I.validate({
    email: "stoempsaucisse@hotmail.com",
    "user.firstname": "stoempsaucisse"
});

```

Installation
---
### Standalone
Simply grab [*isntit.js*](https://raw.githubusercontent.com/stoempsaucisse/isntit/master/dist/isntit.js) (for development) or [*isntit.min.js*](https://raw.githubusercontent.com/stoempsaucisse/isntit/master/dist/isntit.min.js) (for production) and serve it.

### NPM (TODO)
```js
npm install isntit
```

Features
---
* devtools: get usefull warnings during runtime (only enabled in development files)
* extendable: register your own data checker
* use steps to prioritize some checkers upon others (if a step fails, checkers in following steps are not called)
* helpers: `Isntit.printf(string: string, replacements: Array<any>)` or `Isntit.isEmpty(value: any)`

Documentation
---
Isntit uses [JSDoc](http://usejsdoc.org/) to automaticaly generate its [documentation](https://stoempsaucisse.github.io/isntit/).

Unit testing
---
Actually only validation, string helpers and type checking are covered.
[Sinon.js](http://sinonjs.org), [Should.js](http://shouldjs.github.io/) and [should-sinon](https://github.com/shouldjs/sinon) (Sinon.js bindings for Should.js) are needed to run the tests.
```js
npm i should sinon should-sinon --save-dev

```

Many thanks to:
---
* [ansman](https://github.com/ansman) for his inspiring [validate.js](http://validatejs.org/).
* Evan You aka. [yyx990803](https://github.com/vuejs) for his awesome [vuejs](http://vuejs.org) and inspiration in coding style and utilities.
* Jan Goyvaerts for his [email regular expression](http://www.regular-expressions.info/email.html)

License
---
[MIT](http://opensource.org/licenses/MIT)
