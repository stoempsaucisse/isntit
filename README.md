Isntit
===

Isntit is a simple javascript data validation library. It is inspired by [ansman's validate.js](http://validatejs.org/).

[![npm](https://img.shields.io/npm/v/isntit.svg?style=flat-square)]()

[![GitHub release](https://img.shields.io/github/release/stoempsaucisse/isntit.svg?style=flat-square)]()

[![GitHub tag](https://img.shields.io/github/tag/stoempsaucisse/isntit.svg?style=flat-square)]()

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://raw.githubusercontent.com/stoempsaucisse/isntit/master/LICENSE)

Example
---

```html
<script src="dist/isntit.min.js" type="text/javascript"></script>
```

```js
var options = {
    capitalize: true,                       // capitalize error messages
    devtools: config.env !== 'production',  // activate devtools
    fullMessages: true,                     // prepend messages with the field name
    silent: false                           // prevent warnings even with devtools
};

var rules = {
    email: {
        required: true,
        email: {
            message: "^'%{value}' is not a valid %{label} ex. : you@mail.com"
        }
    },
    user.firstname: {
        required: true,
        length: {
            min: 3
        }
    },
    user.age: {
        required: false,                    // warns about a rule with false
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
Simply grab [*isntit.js*](https://raw.githubusercontent.com/stoempsaucisse/isntit/master/dist/isntit.js) or [*isntit.min.js*](https://raw.githubusercontent.com/stoempsaucisse/isntit/master/dist/isntit.min.js) and serve it.

### NPM
1. `git clone git@github.com:stoempsaucisse/isntit.git`
2. `cd isntit`
3. `npm install`
4. `node build.js`

Features
---
* extendable: register your own data checker
* use steps to prioritize some checkers upon others (if a step fails, checkers in following steps are not called)
* provide usefull helpers like `Isntit.printf(string: string, replacements: Array<any>)`

Usage
---

#### Global API


###### Isntit.getTypeBit(obj: any): number

Return an integer representing the `obj` type. Types are:

* string
* number
* boolean
* null
* date
* regexp
* array (includes new Map())
* set
* object
* all others

###### Isntit.isEmpty(obj: any): boolean
Check if a given object is empty. Uses `config.emptyStringRE: RegExp` and `config.emptyValues: any`.

###### Isntit.isOfType(types: string | array, value: any, warns: boolean): boolean
Check if a given `value` is of given `types` (string or array of strings, cfr. `Isntit.getTypeBit()`). Use `warns` to toggle warnings about result.

###### Isntit.isNumber(value: any, warns: boolean): boolean
Wrapper for `Isntit.isOfType('number', value, warns)`.

###### Isntit.isString(value: any, warns: boolean): boolean
Wrapper for `Isntit.isOfType('string', value, warns)`.

###### Isntit.printf(string: string, replacements: Array<string>): string
Returns `string` with %{placeholder} replaced with value of `replacements[placeholder]`.

#### Instance methods

###### I.validate(data: {}[, rules: {}]): {}
Core business of Isntit. Validates fields in data against rules. By default the rules provided during instanciation are used. To override those default rules, provide the optional rule argument.

* `data`: an object of `fieldName: value` pairs with the key
* `rules`:

```js
var rules = {
    fieldName: {
        checkerName: {
            checkerProperty: value
        }
    }
}
```

Where:

* fieldName: corresponding key in data.
* checkerName: the checker to use. Value is either a boolean or an object with `checkerProperty: value` pairs.
* checkerProperty: boolean or supplemental arguments for the checker. Use `message` to customize the error message with a string, a function returning a string or an object with `checkerProperty: string|()` pairs. Start the message string with "^" (customize with `config.noLabelChar: string`) to prevent the message from being prefixed with the field name, even when `options.fullMessages: boolean`. Use `fullMessage: boolean` to customize on checker level prefixing with field name.

Checkers:

* "before" checkers:
    * required: field must be non empty (using Isntit.isEmpty()).
    * confirms: field value must be the same as the value of the field with `field: fieldName` checkerProperty. Isntit is smart enough to link field names like `password_confirmation: boolean` and `password: {checkerProperty: any}` (use `config.confirmationRE: RegExp` to customize this behaviour).

* "during" checkers:
    * email: self explanatory.
    * format: field is tested against `pattern: RegExp`
    * length: field must be longer than `min: value` and/or shorter than `max: value`, or exactly `is: value` long.
    * numeric: field must comply with `comparatorName: string` (see I.compare()), `onlyInteger: boolean` and `noStrings: boolean`.

###### I.compare(value1: string | number, comparator: ComparatorType, value2: string | number, strict: boolean): boolean

Compares two values with the given comparator. Both values should have same "type" (see `Isntit.getTypeBit()`). Comparators have default Javascript behavior and are:

```js
type ComparatorType =
        | '==' or 'equalTo'
        | '==='
        | '!=' or 'notEqualTo'
        | '!=='
        | '>' or 'greaterThan'
        | '>=' or 'greaterThanOrEqualTo'
        | '<' or 'lessThan'
        | '<=' or 'lessThanOrEqualTo';
```

Extend `config.comparators: (val1: any, comparator: ComparatorType|string , val2: any)` to support other type comparison and use them from within your customized checker.

###### I.getMessages(): {: string}
Returns the errors from last validation.

###### I.registerChecker(checker: {}[, step: string[, checkerSteps: Array<string>]]): void

or

###### I.registerChecker(checkerFunction: (value: any, context: {}), checkerName: string[, step: string[, checkerSteps: Array<string>]]): void

The checkerFunction is called with the value to check as argument and the current context as `this`. The optional step argument is the validation step to which register your checker to (default is "during"). You may create an new step which is pushed at the end of the steps list. The optional checkerSteps array lets you re-order and hide existing and new steps.

Many thanks to:
---
* [ansman](https://github.com/ansman) for his inspiring [validate.js](http://validatejs.org/).
* Evan You aka. [yyx990803](https://github.com/vuejs) for his awesome [vuejs](http://vuejs.org) and inspiration in coding style and utilities.
* Jan Goyvaerts for his [email regular expression](http://www.regular-expressions.info/email.html)

License
---
[MIT](http://opensource.org/licenses/MIT)
