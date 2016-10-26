import { config } from './config'
import { warn } from './debug'
import { hasOwn, noop } from './utils'

// Default options
var defaultOptions = {
    silent: false,
    devtools: process.env.NODE_ENV !== 'production',
    fullMessages: false,
    capitalize: true
}

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
                    if (hasOwn(this.config.comparators, comparatorName)) {
                        result = (result && this.compareNumbers(value, comparatorName, numeric[comparatorName]));
                    }
                }
                return result;
            }
        }
    }
}

// Check if value is empty
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

Isntit.prototype.compare = function(value1, comparator, value2, strict) {
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
            result = (result && this.compare(value1[i], comparator, value2[i], strict));
        };
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
            result = (result && this.compare(value1[i], comparator, value2[i], strict));
        };
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
            result = (result && this.compare(value1[key], comparator, value2[key], strict));
        }
        // console.log('Object result: ', result);
        return result;
    }
}

Isntit.prototype.compareNumbers = function(val1, comparator, val2) {
    if (!hasOwn(this.config.comparators, comparator)) {
        throw new Error("Unknown comparator: " + comparator);
    }
    return this.config.comparators[comparator](val1, val2);
}

Isntit.prototype.compareStrings = function(val1, comparator, val2) {
    if (!hasOwn(this.config.comparators, comparator)) {
        throw new Error("Unknown comparator: " + comparator);
    }
    return this.config.comparators[comparator](val1, val2);
}

Isntit.prototype.setCurrentContext = function(fieldName, data, ruleName, rules, step) {
    this.currentContext = {
        value: data[fieldName],
        data: data,
        ruleName: ruleName,
        ruleSet: rules[fieldName],
        rules: rules,
        step: step
    };
}

Isntit.prototype.getMsg = function(ruleName) {
    var message = this.currentContext.ruleSet[ruleName].message || this.config.messages[ruleName] || invalid;
    return (typeof message === 'function') ?
        message.call(this.currentContext) :
        message;
}

/**
 * Printf clone.
 * Use %{varName} wher 'varName' is a key in `replacements` object
 */
Isntit.prototype.parse = function(str, replacements) {
    var replacements = replacements;
    return str.replace(/\%\{([\w\d_\.]+)\}/g, function(match, placeholder){
        return replacements[placeholder];
    });
}

Isntit.prototype.validate = function(data, rules) {
    var rules = rules || this.rules;
    var errors = {};
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
            // Looping through checkers steps
            for (var i = 0; i < this.config.checkersSteps.length; i++) {
                var step = this.config.checkersSteps[i];
                // Looping on rules for current data field
                for (var ruleName in rules[fieldName]) {
                    // Set the current context
                    this.setCurrentContext(fieldName, data, ruleName, rules, step);
                    // Select the right checker
                    var checker = this.checkers[step][ruleName];
                    if (typeof checker !== 'undefined') {
                        var value = data[fieldName];
                        if (!checker.validate.call(this, value)) {
                            // Boot errors array for current data field
                            if (typeof errors[fieldName] === 'undefined') {
                                errors[fieldName] = [];
                            }
                            // Get error message
                            var message = this.getMsg(ruleName);
                            // Prepare replacements for parsing
                            var replacements = {
                                value: value,
                                label: fieldName
                            };
                            // Add properties from rule definition :
                            // length.`min = 1`, numeric.`noStrings = false`,...
                            Object.assign(replacements, this.currentContext.ruleSet[ruleName]);
                            // Should the message be prepended with %{label}
                            var fullMessage = rules[fieldName][ruleName]['fullMessage'] || this.options.fullMessages;
                            if (fullMessage) {
                                message = _prependWithLabel(message);
                            }
                            // Set message in errors array
                            errors[fieldName].push(this.parse(message, replacements));
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
}

export default Isntit;