/*!
 * Isntit - a simple javascript validation library
 * version: 0.0.1
 * (c) 2016-2016 stoempsaucisse
 * Released under the MIT License.
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.Isntit = factory());
}(this, (function () { 'use strict';

/**
 * Default configuration (for production).
 */
var config = {
    /**
     * Many thanks to Jan Goyvaerts for his email regular expression
     * @url : http://www.regular-expressions.info/email.html
     */
    emailRE: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    emptyStringRE: /^[\s\t\n\r]+$/,
    emptyValues: [null, undefined, 'undefined'],
    checkersSteps: ['before', 'during'],
    confirmationRE: /(.+)_confirmation$/,
    comparators: {
        '==': {
            fun: function(val1, val2) {
                return (val1 == val2);
            },
            name: "equalsTo"
        },
        '>': {
            fun: function(val1, val2) {
                return (val1 > val2);
            },
            name: "greaterThan"
        },
        '>=': {
            fun: function(val1, val2) {
                return (val1 >= val2);
            },
            name: "greaterThanOrEqualsTo"
        },
        '<': {
            fun: function(val1, val2) {
                return (val1 < val2);
            },
            name: "lessThan"
        },
        '<=': {
            fun: function(val1, val2) {
                return (val1 <= val2);
            },
            name: "lessThanOrEqualsTo"
        }
    }
};

var warn = noop;
{
    var hasConsole = typeof console !== 'undefined';
    warn = function(msg, obj) {
        if (hasConsole && (!config.silent)) {
            if (obj) {
                console.error(("[Isntit warn]: " + msg), obj);
            } else {
                console.error(("[Isntit warn]: " + msg));
            }
        }
    };
}

/**
 * Perform no operation.
 */
function noop() {}

/**
 * Always return false.
 */


/**
 * Check whether the object has the property.
 */
var hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwn (obj, key) {
    return hasOwnProperty.call(obj, key);
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
function set (obj, key, val) {
    if (Array.isArray(obj)) {
        obj.splice(key, 1, val);
        return val
    }
    if (hasOwn(obj, key)) {
        obj[key] = val;
        return
    }
    return val
}

/**
 * Quick object check - this is primarily used to tell
 * Objects from primitive values when we know the value
 * is a JSON-compliant type.
 */
function isObject (obj) {
  return obj !== null && typeof obj === 'object'
}

/**
 * Helper that recursively merges two data objects together.
 * Data from `to` has priority on data from `from`
 * If you want to override data from `from` to `to`,
 * please use `Object.assign(to, from);`
 */
function mergeData (to, from) {
    var key, toVal, fromVal;
    for (key in from) {
        toVal = to[key];
        fromVal = from[key];
        if (! hasOwn(to, key)) {
            set(to, key, fromVal);
        } else if (isObject(toVal) && isObject(fromVal)) {
            mergeData(toVal, fromVal, override);
        }
    }
    return to;
}

/**
 * Set first character to upercase
 */
function ucfirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
/**
 * Printf clone.
 * Use %{varName} wher 'varName' is a key in `replacements`
 */
function printf(str, replacements) {
    var replacements = replacements;
    return str.replace(/\%\{([\w\d_\.]+)\}/g, function(match, placeholder){
        return replacements[placeholder];
    });
}

function compareNumbers(val1, comparator, val2) {
    if (!hasOwn(this.config.comparators, comparator)) {
        warn(("'" + comparator + "' cannot be used as comparition operator. Returning false by default."));
        return false;
    }
    return this.config.comparators[comparator].fun(val1, val2);
}

// import Checker from './checker'

// Default options
var defaultOptions = {
    silent: false,
    devtools: "development" !== 'production',
    fullMessages: false
};

function _getCurrentContext(fieldName, data, rules) {
    var context = {
        value: data[fieldName],
        data: data,
        ruleSet: rules[fieldName],
        rules: rules
    };
    return context;
}

function _parseMessage(msg, replacements, fullMessages) {
    var noPrefix = msg.charCodeAt(0) === 0x005E;
    var message = (noPrefix || !fullMessages) ? '' : '%{label} ';
    message += (noPrefix) ? msg.substr(1) : msg;
    message = printf(message, replacements);
    if(fullMessages) {
        message = ucfirst(message);
    }
    return message;
}

function Isntit$1(rules, options) {
    // called as function
    if (!(this instanceof Isntit$1)) {
        warn('`Isntit([rules [, options]])` is a constructor and should be called with the `new` keyword.');
        return new Isntit$1(rules, options);
    }
    this.options = Object.assign(defaultOptions, options || {});
    this.rules = rules || {};
}

Isntit$1.prototype.config = config;

Isntit$1.prototype.currentContext = {};

Isntit$1.prototype.checkers = {
    before: {
        confirms: {
            validate: function(value, context) {
                var otherValue = context.data[context.ruleSet.confirms.field];
                return (context.ruleSet.confirms.strict) ?
                    (value === otherValue) :
                    (value == otherValue);
            },
            message: function() {
                return 'should be same as %{field}.'
            }
        },
        required: {
            validate: function(value, context) {
                return !this.isEmpty(value);
            },
            message: "is required."
        }
    },
    during: {
        email: {
            validate: function(value){
                return this.config.emailRE.test(value);
            },
            message: "is not a valid email."
        },
        format: {
            validate: function(value, context) {
                var RE = (context.ruleSet.format instanceof RegExp) ? context.ruleSet.format : context.ruleSet.format.pattern;
                console.log(context, RE.test(value));
                return RE.test(value);
            }
        },
        length: {
            validate: function(value, context) {
                var result = true;
                var length = context.ruleSet['length'];
                value += '';
                if(length.min) {
                    result = result && (value.length >= length.min);
                }
                if(length.max) {
                    result = result && (value.length <= length.max);
                }
                if(length.is) {
                    result = result && (value.length == length.is);
                }
                return result;
            },
            message: function() {
                var rule = this.ruleSet['length'];
                if(rule.is) {
                    return 'must be exactly %{is} characters long.';
                }
                if(rule.min && rule.max) {
                    return 'must be between %{min} and %{max} characters long.';
                }
                if(rule.min) {
                    return 'must be minimum %{min} characters long.';
                }
                if(rule.max) {
                    return 'must be maximum %{min} characters long.';
                }
            }
        },
        numeric: {
            validate: function(value, context) {
                var this$1 = this;

                var numeric = context.ruleSet['numeric'];
                if (typeof value === 'string') {
                    if (numeric.noStrings === true) {
                        return false;
                    }
                    if (value === "") {
                        return true;
                    }
                    value = +value;
                }
                if (! isFinite(value) || value === null) {
                    return false;
                }
                var result = true;
                if(numeric.onlyInteger) {
                    result = result && (value % 1 === 0);
                }
                for(var comparator in this.config.comparators) {
                    var comparatorName = this$1.config.comparators[comparator].name;
                    if (typeof numeric[comparatorName] !== 'undefined') {
                        return compareNumbers.call(this$1, value, comparator, numeric[comparatorName]);
                    }
                }
            }
        }
    },
    after: {}
};

Isntit$1.prototype.isEmpty = function(value) {
    var this$1 = this;

    var typeOf = typeof value;
    if ((typeOf === 'string' || typeOf === 'array') && value.length === 0) {
        return true;
    }
    if ((typeOf === 'string') && this.config.emptyStringRE.test(value)) {
        return true;
    }
    if (value instanceof Object && Object.keys(value).length === 0) {
        return true;
    }
    for (var i = 0; i < this.config.emptyValues.length; i++) {
        if (value === this$1.config.emptyValues[i]) {
            return true;
        }
    }
    return false;
};

Isntit$1.prototype.validate = function(data, rules) {
    var this$1 = this;

    var rules = rules || this.rules;
    var result = {};
    // Looping on fields in data
    for (var fieldName in data) {
        if(hasOwn(data, fieldName)) {
            // Check if is shorthand for `confirms`
            if (rules[fieldName] === true ) {
                var matches = fieldName.match(this$1.config.confirmationRE);
                if (matches) {
                    rules[fieldName] = {
                        confirms: {
                            field: matches[1]
                        }
                    };
                }
            }
            // Set current context property
            var currentContext = Object.assign(
                {},
                _getCurrentContext(fieldName, data, rules)
            );
            // Looping through checkers steps
            for (var i = 0; i < this.config.checkersSteps.length; i++) {
                // Looping on rules for current data field
                for (var ruleName in currentContext.ruleSet) {
                    var step = this$1.config.checkersSteps[i];
                    var checker = this$1.checkers[step][ruleName];
                    if (typeof checker !== 'undefined') {
                        if (!checker.validate.call(this$1, data[fieldName], currentContext)) {
                            // Boot errors array for current data field
                            if (typeof result[fieldName] === 'undefined') {
                                result[fieldName] = [];
                            }
                            // Get message
                            var message = currentContext.ruleSet[ruleName]['message'] ||
                                          checker.message ||
                                          'is not valid.';
                            message = (typeof message === 'function') ? message.call(currentContext) : message;
                            // Prepare replacements for parsing
                            var replacements = {
                                value: data[fieldName],
                                label: fieldName
                            };
                            Object.assign(replacements, currentContext.ruleSet[ruleName]);
                            // Should the message be prepended with %{label}
                            var fullMessage = (typeof replacements['fullMessage'] !== 'undefined') ? replacements['fullMessage'] : this$1.options.fullMessages;
                            // Set message in errors array
                            result[fieldName].push(_parseMessage(message, replacements, fullMessage));
                        }
                    }
                }
                if (typeof result[fieldName] !== 'undefined') {
                    break;
                }
            }
        }
    }
    return result;
};

/*  */

return Isntit$1;

})));
