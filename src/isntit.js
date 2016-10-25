import { config } from './config'
import { warn } from './debug'
import { hasOwn, ucfirst, printf, compareNumbers } from './utils'
// import Checker from './checker'

// Default options
var defaultOptions = {
    silent: false,
    devtools: process.env.NODE_ENV !== 'production',
    fullMessages: false
}

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

function Isntit(rules, options) {
    // called as function
    if (!(this instanceof Isntit)) {
        warn('`Isntit([rules [, options]])` is a constructor and should be called with the `new` keyword.');
        return new Isntit(rules, options);
    }
    this.options = Object.assign(defaultOptions, options || {});
    this.rules = rules || {};
}

Isntit.prototype.config = config;

Isntit.prototype.currentContext = {};

Isntit.prototype.checkers = {
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
                    var comparatorName = this.config.comparators[comparator].name;
                    if (typeof numeric[comparatorName] !== 'undefined') {
                        return compareNumbers.call(this, value, comparator, numeric[comparatorName]);
                    }
                }
            }
        }
    },
    after: {}
}

Isntit.prototype.isEmpty = function(value) {
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
        if (value === this.config.emptyValues[i]) {
            return true;
        }
    }
    return false;
}

Isntit.prototype.validate = function(data, rules) {
    var rules = rules || this.rules;
    var result = {};
    // Looping on fields in data
    for (var fieldName in data) {
        if(hasOwn(data, fieldName)) {
            // Check if is shorthand for `confirms`
            if (rules[fieldName] === true ) {
                var matches = fieldName.match(this.config.confirmationRE);
                if (matches) {
                    rules[fieldName] = {
                        confirms: {
                            field: matches[1]
                        }
                    }
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
                    var step = this.config.checkersSteps[i];
                    var checker = this.checkers[step][ruleName];
                    if (typeof checker !== 'undefined') {
                        if (!checker.validate.call(this, data[fieldName], currentContext)) {
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
                            var fullMessage = (typeof replacements['fullMessage'] !== 'undefined') ? replacements['fullMessage'] : this.options.fullMessages;
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
}

export default Isntit;