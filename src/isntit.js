import { warn } from './debug'
import { config } from './config'
import { hasOwn, isObject } from './utils'
import { printf, ucfirst } from './string'

function Isntit(rules, options) {
    // called as function
    if (!(this instanceof Isntit)) {
        warn('`Isntit([rules [, options]])` is a constructor and should be called with the `new` keyword.');
        return new Isntit(rules, options);
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

Isntit.prototype.options = {
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

export var checkers = {
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
                return !Isntit.isEmpty(value);
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
}
// Global API

// Get checkers
Isntit.getCheckers = function() {
    return checkers;
}

// Add checker(s)
Isntit.registerChecker = function(checker, name, step, checkersSteps) {
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
}

// Check if a value is empty
Isntit.isEmpty = function(value) {
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
}

// Printf 'clone'.
Isntit.printf = printf;

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
                    warn(`Rule definition for '${ruleName}' set to 'false', are you shure?`, rules[fieldName]);
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
Isntit.prototype.validate = function(data, rules) {
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
                    }
                }
            }
            // Get the value to check
            var value = data[fieldName];
            _loopThroughCheckers.call(I, value, fieldName, data, rules);
        }
    }
    return (Isntit.isEmpty(I.errors)) ? true : I.errors;
}

Isntit.prototype.getCheckers = function() {
    return checkers;
}

Isntit.prototype.getMessages = function() {
    return this.errors;
}

Isntit.prototype.getStep = function(ruleName) {
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
}

export default Isntit;