/*!
 * Isntit - a simple javascript validation library
 * version: 0.0.3
 * (c) 2016 stoempsaucisse
 * Released under the MIT License.
 */

'use strict';

/**
 * Default configuration (for production).
 */
var config = {
    env: process.env.NODE_ENV,
    silent: false,
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
    /**
     * Many thanks to Jan Goyvaerts for his email regular expression
     * @url : http://www.regular-expressions.info/email.html
     */
    emailRE: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    emptyStringRE: /^[\s\t\n\r]+$/,
    emptyValues: [null, undefined, 'undefined'],
    equalityComparators: [
        '==', '===', '!=', '!==', 'equalTo', 'notEqualTo'
    ],
    messages: {
        confirms: "should be sames as %{field}",
        required: "is required",
        email: "is not a valid email",
        format: "",
        length: function(context) {
            var rule = context.ruleSet['length'];
            if(rule.is) {
                return 'must be exactly %{is} characters long';
            }
            if(rule.min && rule.max) {
                return 'must be between %{min} and %{max} characters long';
            }
            if(rule.min) {
                return 'must be minimum %{min} characters long';
            }
            if(rule.max) {
                return 'must be maximum %{min} characters long';
            }
        },
        numeric: {
            onlyInteger: 'must be an integer',
            noStrings: 'strings are not allowed',
            equalTo: 'must be equal to %{equalTo}',
            notEqualTo: 'must not be equal to %{notEqualTo}',
            greaterThan: 'must be greater than %{greaterThan}',
            greaterThanOrEqualTo: 'must be greater than or equal to %{greaterThanOrEqualTo}',
            lessThan: 'must be less than %{lessThan}',
            lessThanOrEqualTo: 'must be less than or equal to %{lessThanOrEqualTo}'
        },
        notValid: "is not valid."
    },
    noLabelChar: "^"
};

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
            mergeData(toVal, fromVal);
        }
    }
    return to;
}

var warn = noop;
/* eslint-disable no-console */
if ( config.env !== 'production') {
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
 * Sort of 'printf' clone.
 * Use %{varName} in string with 'varName' as key in the `replacements` object
 */
function printf(str, replacements) {
    return str.replace(/\%\{([\w\d_\.]+)\}/g, function(match, placeholder){
        if (typeof replacements[placeholder] != 'undefined') {
            return replacements[placeholder];
        }
        warn(("There is no replacement for " + match + " in " + str), replacements);
        return match;
    });
}

/**
 * Set first character to upercase
 */
function ucfirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function Isntit$1(rules, options) {
    // called as function
    if (!(this instanceof Isntit$1)) {
        warn('`Isntit([rules [, options]])` is a constructor and should be called with the `new` keyword.');
        return new Isntit$1(rules, options);
    }
    if (options && options.config) {
        Object.assign(config, options.config);
        delete options.config;
    }
    Object.assign(this.options, options || {});
    this.cache = {
        checkersToStep: {},
        messages: {}

    };
    this.checkRules(rules);
    this.rules = rules || {};
    this.errors = {};
}

Isntit$1.prototype.options = {
    /**
     * Whether to capitalize error messages.
     */
    capitalize: true,
    /**
     * Whether to enable devtools.
     */
    devtools: config.env !== 'production',
    /**
     * Whether to prefix erro messages with the field name.
     */
    fullMessages: false
};

var checkers = {
    before: {
        confirms: {
            validate: function(value, context) {
                var data = context.data;
                var confirms = context.ruleSet.confirms;
                confirms['otherValue'] = data[confirms.field];
                return (confirms.strict) ?
                    (value === confirms.otherValue) :
                    (value == confirms.otherValue);
            },
            types: ['boolean', { field: 'string' }]
        },
        required: {
            validate: function(value) {
                return !Isntit$1.isEmpty(value);
            },
            types: 'boolean'
        }
    },
    during: {
        email: {
            validate: function(value){
                return config.emailRE.test(value);
            },
            preprocess: function(value) {
                var I = this;
                if (typeof value !== 'string') {
                    I.cache.messages['email::preprocess'] = 'Values checked for email MUST be of type string. Given: ' + value;
                    return false;
                }
                return true;
                
            },
            types: 'boolean'
        },
        format: {
            validate: function(value, context) {
                var ruleSet = context.ruleSet;
                var RE = (ruleSet.format instanceof RegExp) ? ruleSet.format : ruleSet.format.pattern;
                return (RE.test(value));
            },
            preprocess: function(value) {
                var I = this;
                if (typeof value !== 'string' && typeof value !== 'number') {
                    I.cache.messages['format::preprocess'] = 'Values checked for format MUST either be of type string or number. Given: ' + value;
                    return false;
                }
                return true;
                
            },
            types: ['regexp', { pattern: 'regexp' }]
        },
        length: {
            validate: {
                is: function(value, context) {
                    return (value.length == context.ruleSet['length'].is);
                },
                min: function(value, context) {
                    return (value.length >= context.ruleSet['length'].min);
                },
                max: function(value, context) {
                    return (value.length <= context.ruleSet['length'].max);
                }
            },
            preprocess: function(value) {
                var I = this;
                if (value.length === undefined) {
                    I.cache.messages['length::preprocess'] = 'Values checked for length MUST have a length property. Given: ' + value;
                    return false;
                }
                return true;
            },
            types: {
                __all: 'number'
            }
        },
        numeric: {
            validate: {
                equalTo: function(value, context) {
                    return (+value == context.ruleSet['numeric'].equalTo);
                },
                notEqualTo: function(value, context) {
                    return (+value != context.ruleSet['numeric'].notEqualTo);
                },
                greaterThan: function(value, context) {
                    return (+value > context.ruleSet['numeric'].greaterThan);
                },
                greaterThanOrEqualTo: function(value, context) {
                    return (+value >= context.ruleSet['numeric'].greaterThanOrEqualTo);
                },
                lessThan: function(value, context) {
                    return (+value < context.ruleSet['numeric'].lessThan);
                },
                lessThanOrEqualTo: function(value, context) {
                    return (+value <= context.ruleSet['numeric'].lessThanOrEqualTo);
                },
                noStrings: function(value) {
                    return (typeof value !== 'string');
                },
                onlyInteger: function(value) {
                    return ((+value) % 1 === 0);
                }

            },
            preprocess: function(value) {
                var I = this;
                if (typeof value !== 'string' && typeof value !== 'number') {
                    I.cache.messages['numeric::preprocess'] = 'Values checked for numeric MUST either be of type string or number. Given: ' + value;
                    return false;
                }
                return true;
                
            },
            types: {
                noStrings: 'boolean',
                onlyInteger: 'boolean',
                __others: 'number'
            }
        }
    }
};
// Global API

// Get checkers
Isntit$1.getCheckers = function() {
    return checkers;
};

// Add checker(s)
Isntit$1.registerChecker = function(checker, name, step, checkersSteps) {
    var I = this;
    if (typeof checker !== 'function' && !hasOwn(checker, 'validate')) {
        if (arguments.length > 3) {
            warn('Instance methode registerChecker() signature is:\n(object[, step[, checkersSteps]]), supplemental arguments will be ignored.', Array.from(arguments));
        }
        for(var key in checker) {
            checkersSteps = step;
            if(config.checkersSteps.indexOf(key) !== -1) {
                step = key;
                for(name in checker[step]) {
                    I.registerChecker(checker[step][name], name, step, checkersSteps);
                }
            } else {
                step = name;
                I.registerChecker(checker[key], key, step, checkersSteps);
            }
        }
    } else {
        step = step || 'during';
        if (typeof name === 'undefined') {
            throw new Error('When registering a `callback` as checker, you must provide a `name` for it: registerChecker(callable, name[, step[, checkersSteps]])');
        }
        if(!hasOwn(checkers, step)) {
            checkers[step] = {};
            if (typeof checkersSteps === 'undefined') {
                config.checkersSteps.push(step);
            }
        }
        if (hasOwn(checker, 'validate')) {
            checkers[step][name] = checker;
        } else {
            checkers[step][name] = {
                validate: checker
            };
        }
    }
};

// Check if a value is empty
Isntit$1.isEmpty = function(value) {
    var typeOf = typeof value;
    if ((typeOf === 'string' || typeOf === 'array') && value.length === 0) {
        return true;
    }
    if ((typeOf === 'string') && config.emptyStringRE.test(value)) {
        return true;
    }
    if (isObject(value) && Object.keys(value).length === 0) {
        return true;
    }
    for (var i = 0; i < config.emptyValues.length; i++) {
        if (value === config.emptyValues[i]) {
            return true;
        }
    }
    return false;
};

// Printf 'clone'.
Isntit$1.printf = printf;

// Instance methods
function _setError(context, fieldName, ruleName, constraint) {
    var I = this;
    if (!hasOwn(I.errors, fieldName)) {
        I.errors[fieldName] = {};
    }
    if (constraint) {
        if (!hasOwn(I.errors[fieldName], ruleName)) {
            I.errors[fieldName][ruleName] = {};
        }
        I.errors[fieldName][ruleName][constraint] = true;
    } else {
        I.errors[fieldName][ruleName] = true;
    }
}

function _callChecker(checker, value, context) {
    var I = this;
    if (typeof checker.validate === 'function') {
        if (!checker.validate.call(I, value, context)) {
            _setError.call(I, context, context.fieldName, context.ruleName);
        }
    } else {
        for (var constraint in context.ruleSet[context.ruleName]) {
            if (!checker.validate[constraint].call(I, value, context)) {
                _setError.call(I, context, context.fieldName, context.ruleName, constraint);
            }
        }
    }
}

// Get the error message
function _getMsg(context, constraint) {
    var I = this;
    var key = context.ruleName + (constraint ? '::' + constraint : '');
    if (!I.cache.messages[key]) {
        var message;
        // Get the message from possible sources
        message = context.ruleSet[context.ruleName].message ||
            config.messages[context.ruleName] ||
            config.messages.notValid;
        // If constraint exists and is a prop on message, retrieve it or invalid
        if (isObject(message)) {
            message = message[constraint] || config.messages.notValid;
        }
        // If message is a function call it else asume its just a string
        I.cache.messages[key] = (typeof message === 'function') ?
            message(context, constraint) :
            message;
    }
    return I.cache.messages[key];
}

function _handleErrors(fieldName, value, context) {
    var I = this;
    var message = [];
    // Loop through rules
    for(var ruleName in I.errors[fieldName]) {
        if (I.errors[fieldName][ruleName] === true) {
            message.push(_getMsg.call(I, context));
        } else {
            for(var constraint in I.errors[fieldName][ruleName]) {
                message.push(_getMsg.call(I, context, constraint));
            }
        }
    }
    // Flatten message
    message = message.join(', ');
    // Prepare replacements for parsing
    var replacements = {
        value: context.value,
        label: context.fieldName
    };
    // Add properties from rule definition :
    // length.`min = 1`, numeric.`noStrings = false`,...
    Object.assign(replacements, context.ruleSet[context.ruleName]);
    // Should the message be prepended with %{label}
    var noPrepend = message.charAt(0) === config.noLabelChar;
    var fullMessage = context.rules[context.fieldName][context.ruleName]['fullMessage'] || I.options.fullMessages;
    if (fullMessage && !noPrepend) {
        message = '%{label} ' + message;
    }
    if (noPrepend) {
        message = message.substr(1);
    }
    // Parse message
    message = printf(message, replacements);
    // Should the message be prepended capitalized
    var capitalize = context.rules[context.fieldName][context.ruleName]['capitalize'] || I.options.capitalize;
    if (capitalize) {
        message = ucfirst(message);
    }
    // Replace array of messages with parsed message
    I.errors[context.fieldName] = message;
}

function _loopThroughCheckers(value, fieldName, data, rules) {
    var I = this;
    for (var i = 0; i < config.checkersSteps.length; i++) {
        var step = config.checkersSteps[i];
        // Looping on rules for current data field
        for (var ruleName in rules[fieldName]) {
            // Select the right checker
            var checker = checkers[step][ruleName];
            if (typeof checker !== 'undefined') {
                // Exit loop and warn if rule === false
                if (rules[fieldName][ruleName] === false) {
                    warn(("Rule definition for '" + ruleName + "' set to 'false', are you shure?"), rules[fieldName]);
                    break;

                }
                // Set the current context
                var context = {
                    value: value,
                    fieldName: fieldName,
                    data: data,
                    ruleName: ruleName,
                    ruleSet: rules[fieldName],
                    rules: rules,
                    step: step
                };
                // Call preprocess
                if (typeof checker.preprocess === "function" && !checker.preprocess.call(I, value, context)) {
                    _setError.call(I, context, context.fieldName, context.ruleName, 'preprocess');
                } else {
                    _callChecker.call(I, checker, value, context);
                }
                if (hasOwn(I.errors, fieldName)) {
                    _handleErrors.call(I, fieldName, value, context);
                }
            }
        }
        if (typeof I.errors[fieldName] !== 'undefined') {
            break;
        }
    }
}

// Validate
Isntit$1.prototype.validate = function(data, rules) {
    var I = this;
    if (rules) {
        I.checkRules(rules);
    } else {
        rules = I.rules;
    }
    I.errors = {};
    // Looping on fields in data
    for (var fieldName in data) {
        if(hasOwn(data, fieldName)) {
            // Check if it is a shorthand for `confirms`
            if (rules[fieldName] === true) {
                var matches = fieldName.match(config.confirmationRE);
                if (matches) {
                    rules[fieldName] = {
                        confirms: {
                            field: matches[1]
                        }
                    };
                }
            }
            // Get the value to check
            var value = data[fieldName];
            _loopThroughCheckers.call(I, value, fieldName, data, rules);
        }
    }
    return (Isntit$1.isEmpty(I.errors)) ? true : I.errors;
};

Isntit$1.prototype.getCheckers = function() {
    return checkers;
};

Isntit$1.prototype.getMessages = function() {
    return this.errors;
};

Isntit$1.prototype.getStep = function(ruleName) {
    var I = this;
    if (!I.cache.checkersToStep[ruleName]) {
        for (var i = 0; i < config.checkersSteps.length; i++) {
            if (checkers[config.checkersSteps[i]][ruleName]) {
                I.cache.checkersToStep[ruleName] = config.checkersSteps[i];
                break;
            }
        }
        if (!I.cache.checkersToStep[ruleName]) {
            warn('No step found for "' + ruleName + '". Given: ' + JSON.stringify(checkers));
            return false;
        }
    }
    return I.cache.checkersToStep[ruleName];
};

Isntit$1.version = '0.0.3';

module.exports = Isntit$1;
