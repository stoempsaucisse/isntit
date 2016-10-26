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
        '==': function(val1, val2) {
            return (val1 == val2);
        },
        '===': function(val1, val2) {
            return (val1 === val2);
        },
        '!=': function(val1, val2) {
            return (val1 != val2);
        },
        '!==': function(val1, val2) {
            return (val1 !== val2);
        },
        '>': function(val1, val2) {
            return (val1 > val2);
        },
        '>=': function(val1, val2) {
            return (val1 >= val2);
        },
        '<': function(val1, val2) {
            return (val1 < val2);
        },
        '<=': function(val1, val2) {
            return (val1 <= val2);
        },
        // Aliasses
        get equalTo(){ 
            delete this.equalTo;
            return this.equalTo = this['=='];
        },
        get notEqualTo(){ 
            delete this.notEqualTo;
            return this.notEqualTo = this['!='];
        },
        get greaterThan(){ 
            delete this.greaterThan;
            return this.greaterThan = this['>'];
        },
        get greaterThanOrEqualTo(){ 
            delete this.greaterThanOrEqualTo;
            return this.greaterThanOrEqualTo = this['>='];
        },
        get lessThan(){ 
            delete this.lessThan;
            return this.lessThan = this['<'];
        },
        get lessThanOrEqualTo(){ 
            delete this.lessThanOrEqualTo;
            return this.lessThanOrEqualTo = this['<='];
        }
    },
    equalityComparators: [
        '==', '===', '!=', '!==', 'equalTo', 'notEqualTo'
    ],
    messages: {
        confirms: "should be sames as %{field}.",
        required: "is required",
        email: "is not a valid email.",
        format: "",
        length: function() {
            var context = this;
            var rule = context.ruleSet['length'];
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
        },
        numeric: function() {
            var context = this;
            var numeric = context.ruleSet['numeric'];
            var message = [];
            if(numeric.onlyInteger && (context.value % 1 !== 0)) {
                message.push('must be an integer');
            }
            if(numeric.noStrings && (typeof context.value === 'string')) {
                message.push('strings are not allowed');
            }
            if(numeric.equalTo) {
                message.push('must be equal to %{equalTo}');
            }
            if(numeric.notEqualTo) {
                message.push('must not be equal to %{notEqualTo}');
            }
            if(numeric.greaterThan) {
                message.push('must be greater than %{greaterThan}');
            }
            if(numeric.greaterThanOrEqualTo) {
                message.push('must be greater than or equal to %{greaterThanOrEqualTo}');
            }
            if(numeric.lessThan) {
                message.push('must be less than %{lessThan}');
            }
            if(numeric.lessThanOrEqualTo) {
                message.push('must be less than or equal to %{lessThanOrEqualTo}');
            }
            return message.join(' and ') + '.';
        }
    },
    noLabelChar: "^"
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

// Default options
var defaultOptions = {
    silent: false,
    devtools: "development" !== 'production',
    fullMessages: false,
    capitalize: true
};

var invalid = function() { return "is not valid."};

function _prependWithLabel(msg) {
    // Does `msg` starts with a '^'?
    if (msg.charAt(0) === config.noLabelChar) {
        return msg.substr(1);
    }
    return '%{label} ' + msg;
}

// Get a bit mask for object
function _getTypeBitInt(obj) {
    switch (typeof obj) {
        case 'string':
            return 1;
        case 'number':
            return 2;
        case 'boolean':
            return 4;
        case 'object':
            switch (true) {
                case (obj === null):
                    return 8;
                case (obj instanceof Date):
                    return 16;
                case (obj instanceof RegExp):
                    return 32;
                case (obj instanceof Array):
                    return 64;
                case (obj instanceof Map):
                case (obj instanceof Set):
                case (obj instanceof WeakMap):
                case (obj instanceof WeakSet):
                    return 128;
                default:
                    return 256;
            }
        default:
            return (1 << 30);
    }
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
            validate: function(value) {
                var I = this;
                var data = I.currentContext.data;
                var confirms = I.currentContext.ruleSet.confirms;
                confirms['otherValue'] = data[confirms.field];
                return result = (confirms.strict) ?
                    (value === confirms.otherValue) :
                    (value == confirms.otherValue);
            }
        },
        required: {
            validate: function(value) {
                var I = this;
                return (!I.isEmpty(value)) ;
            }
        }
    },
    during: {
        email: {
            validate: function(value){
                var I = this;
                return I.config.emailRE.test(value);
            }
        },
        format: {
            validate: function(value) {
                var I = this;
                var ruleSet = I.currentContext.ruleSet;
                var RE = (ruleSet.format instanceof RegExp) ? ruleSet.format : ruleSet.format.pattern;
                return RE.test(value);
            }
        },
        length: {
            validate: function(value) {
                var I = this;
                var result = true;
                var length = I.currentContext.ruleSet['length'];
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
            }
        },
        numeric: {
            validate: function(value) {
                var this$1 = this;

                var I = this;
                var numeric = I.currentContext.ruleSet['numeric'];
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
                for(var comparatorName in numeric) {
                    if (!result) {
                        return false;
                    }
                    if (hasOwn(this$1.config.comparators, comparatorName)) {
                        result = (result && this$1.compareNumbers(value, comparatorName, numeric[comparatorName]));
                    }
                }
                return result;
            }
        }
    }
};

// Check if value is empty
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

Isntit$1.prototype.compare = function(value1, comparator, value2, strict) {
    var this$1 = this;

    var strict = strict || false;
    var result;
    var typeOf1 = _getTypeBitInt(value1);
    var typeOf2 = _getTypeBitInt(value2);
    var types = (typeOf1 | typeOf2);
    if (strict && (typeOf1 !== typeOf2)) {
        throw new Error("When comparing values in strict mode, both value MUST have same bit mask.")
    }
    // Strings and numbers only
    if (types <= 3) {
        if (types === 1) {
            result = this.compareStrings(value1, comparator, value2);
        }
        if (types > 1 || result === false) {
            result = this.compareNumbers(value1, comparator, value2);
        }
        return result;
    }
    // Other types MUST have same bit mask
    if (typeOf1 !== typeOf2) {
        return false;
    }
    // Other types are only compared for equality
    if (this.config.equalityComparators.indexOf(comparator) === -1) {
        throw new Error("Values other than numbers or string can only by compared for equality. Given comparator: " + comparator);
    }
    // Is Array
    if (types === 64) {
        if (value1.length !== value2.length) {
            return false;
        }
        result = true;
        for (var i = 0; i < value1.length; i++) {
            result = (result && this$1.compare(value1[i], comparator, value2[i], strict));
        }
        // console.log('Array result: ', result);
        return result;
    }
    // Is iterable (Map, Set)
    if (types === 128) {
        if (value1.size !== value2.size) {
            return false;
        }
        result = true;
        for (var i = 0; i < value1.size; i++) {
            if (!result) {
                return false;
            }
            result = (result && this$1.compare(value1[i], comparator, value2[i], strict));
        }
        // console.log('Map/Set result: ', result);
        return result;
    }
    // Is Object
    if (types === 256) {
        result = true;
        for(var key in value1) {
            if (!result) {
                return false;
            }
            result = (result && this$1.compare(value1[key], comparator, value2[key], strict));
        }
        // console.log('Object result: ', result);
        return result;
    }
};

Isntit$1.prototype.compareNumbers = function(val1, comparator, val2) {
    if (!hasOwn(this.config.comparators, comparator)) {
        throw new Error("Unknown comparator: " + comparator);
    }
    return this.config.comparators[comparator](val1, val2);
};

Isntit$1.prototype.compareStrings = function(val1, comparator, val2) {
    if (!hasOwn(this.config.comparators, comparator)) {
        throw new Error("Unknown comparator: " + comparator);
    }
    return this.config.comparators[comparator](val1, val2);
};

Isntit$1.prototype.setCurrentContext = function(fieldName, data, ruleName, rules, step) {
    this.currentContext = {
        value: data[fieldName],
        data: data,
        ruleName: ruleName,
        ruleSet: rules[fieldName],
        rules: rules,
        step: step
    };
};

Isntit$1.prototype.getMsg = function(ruleName) {
    var message = this.currentContext.ruleSet[ruleName].message || this.config.messages[ruleName] || invalid;
    return (typeof message === 'function') ?
        message.call(this.currentContext) :
        message;
};

/**
 * Printf clone.
 * Use %{varName} wher 'varName' is a key in `replacements` object
 */
Isntit$1.prototype.parse = function(str, replacements) {
    var replacements = replacements;
    return str.replace(/\%\{([\w\d_\.]+)\}/g, function(match, placeholder){
        return replacements[placeholder];
    });
};

Isntit$1.prototype.validate = function(data, rules) {
    var this$1 = this;

    var rules = rules || this.rules;
    var errors = {};
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
            // Looping through checkers steps
            for (var i = 0; i < this.config.checkersSteps.length; i++) {
                var step = this$1.config.checkersSteps[i];
                // Looping on rules for current data field
                for (var ruleName in rules[fieldName]) {
                    // Set the current context
                    this$1.setCurrentContext(fieldName, data, ruleName, rules, step);
                    // Select the right checker
                    var checker = this$1.checkers[step][ruleName];
                    if (typeof checker !== 'undefined') {
                        var value = data[fieldName];
                        if (!checker.validate.call(this$1, value)) {
                            // Boot errors array for current data field
                            if (typeof errors[fieldName] === 'undefined') {
                                errors[fieldName] = [];
                            }
                            // Get error message
                            var message = this$1.getMsg(ruleName);
                            // Prepare replacements for parsing
                            var replacements = {
                                value: value,
                                label: fieldName
                            };
                            // Add properties from rule definition :
                            // length.`min = 1`, numeric.`noStrings = false`,...
                            Object.assign(replacements, this$1.currentContext.ruleSet[ruleName]);
                            // Should the message be prepended with %{label}
                            var fullMessage = rules[fieldName][ruleName]['fullMessage'] || this$1.options.fullMessages;
                            if (fullMessage) {
                                message = _prependWithLabel(message);
                            }
                            // Set message in errors array
                            errors[fieldName].push(this$1.parse(message, replacements));
                        }
                    }
                }
                if (typeof errors[fieldName] !== 'undefined') {
                    break;
                }
            }
        }
    }
    return errors;
};

/*  */

return Isntit$1;

})));
