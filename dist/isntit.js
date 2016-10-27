/*!
 * Isntit - a simple javascript validation library
 * version: 0.0.2
 * (c) 2016 stoempsaucisse
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
    bitMasks: {
        string: 1,
        number: 2,
        'boolean': 4,
        'null': 8,
        date: 16,
        regexp: 32,
        array: 64,
        set: 128,
        object: 256,
        rest: (1 << 30)
    },
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
        length: function() {
            var context = this;
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

var defaultOptions = {
    /**
     * Whether to suppress warnings.
     */
    silent: false,
    /**
     * Whether to enable devtools.
     */
    devtools: "development" !== 'production',
    /**
     * Whether to prefix erro messages with the field name.
     */
    fullMessages: false,
    /**
     * Whether to capitalize error messages.
     */
    capitalize: true
};


// Get the error message
var _getMsg = function(context, ruleName, ruleProperty) {
    var I = this;
    var message;
    // Get the message from possible sources
    message = context.ruleSet[ruleName].message ||
        I.config.messages[ruleName] ||
        I.config.messages.notValid;
    // If ruleProperty exists and is a prop on message, retrieve it or invalid
    if (message instanceof Object && typeof message != 'function' ) {
        message = message[ruleProperty] || I.config.messages.notValid;
    }
    // If message is a function call it else its just a string
    return (typeof message === 'function') ?
        message.call(context) :
        message;
};

function Isntit$1(rules, options) {
    // called as function
    if (!(this instanceof Isntit$1)) {
        warn('`Isntit([rules [, options]])` is a constructor and should be called with the `new` keyword.');
        return new Isntit$1(rules, options);
    }
    this.options = Object.assign(defaultOptions, options || {});
    this.rules = rules || {};
    this.config = config;
    this.errors = {};
}

Isntit$1.prototype.currentContext = {};
Isntit$1.prototype.config = config;

Isntit$1.prototype.checkers = {
    before: {
        confirms: {
            validate: function(value, context) {
                var I = this;
                var data = context.data;
                var confirms = context.ruleSet.confirms;
                confirms['otherValue'] = data[confirms.field];
                result = (confirms.strict) ?
                    (value === confirms.otherValue) :
                    (value == confirms.otherValue);
                if (!result) {
                    return _getMsg.call(I, context, 'confirms');
                }
                return true;
            }
        },
        required: {
            validate: function(value, context) {
                var I = this;
                if (Isntit$1.isEmpty(value)) {
                    return _getMsg.call(I, context, 'required');
                }
                return true;
            }
        }
    },
    during: {
        email: {
            validate: function(value, context){
                Isntit$1.isString(value);
                var I = this;
                if (!config.emailRE.test(value)) {
                    return _getMsg.call(I, context, 'email');
                }
                return true;
            }
        },
        format: {
            validate: function(value, context) {
                Isntit$1.isOfType(['string', 'number'], value);
                var I = this;
                var ruleSet = context.ruleSet;
                var RE = (ruleSet.format instanceof RegExp) ? ruleSet.format : ruleSet.format.pattern;
                if (RE.test(value)) {
                    return _getMsg.call(I, context, 'format');
                }
                return true;
            }
        },
        length: {
            validate: function(value, context) {
                Isntit$1.isOfType(['string', 'number', 'array'], value);
                var I = this;
                var messages = [];
                var result = true;
                var length = context.ruleSet['length'];
                value += '';
                if(length.min && !(value.length >= length.min)) {
                    result = false;
                    var msg = _getMsg.call(I, context, 'length', 'min');
                    if (msg) {
                        messages.push(msg);
                    }
                }
                if(length.max && !(value.length <= length.max)) {
                    result = false;
                    var msg = _getMsg.call(I, context, 'length', 'max');
                    if (msg) {
                        messages.push(msg);
                    }
                }
                if(length.is && !(value.length == length.is)) {
                    result = false;
                    var msg = _getMsg.call(I, context, 'length', 'is');
                    if (msg) {
                        messages.push(msg);
                    }
                }
                if (!result) {
                    return messages.join(' and ') || _getMsg.call(I, context, 'length');
                }
                return true;
            }
        },
        numeric: {
            validate: function(value, context) {
                Isntit$1.isOfType(['string', 'number'], value);
                var I = this;
                var messages = [];
                var numeric = context.ruleSet['numeric'];
                if (typeof value === 'string') {
                    if (numeric.noStrings === true) {
                        return _getMsg.call(I, context, 'numeric', 'noStrings') || _getMsg.call(I, context, 'numeric');
                    }
                    if (value === "") {
                        return true;
                    }
                    value = +value;
                }
                if (! isFinite(value) || value === null) {
                    return _getMsg.call(I, context, 'numeric', 'notValid') || _getMsg.call(I, context, 'numeric');
                }
                var result = true;
                var messages = [];
                if(numeric.onlyInteger && !(value % 1 === 0)) {
                    result = false;
                    var msg = _getMsg.call(I, context, 'numeric', 'onlyInteger');
                    if (msg) {
                        messages.push(msg);
                    }
                }
                for(var comparatorName in numeric) {
                    if ((comparatorName != 'onlyInteger') && (comparatorName != 'noStrings') && (! I.compare(value, comparatorName, numeric[comparatorName]))) {
                        result = false;
                        var msg = _getMsg.call(I, context, 'numeric', comparatorName);
                        if (msg) {
                            messages.push(msg);
                        }
                    }
                }
                if (!result) {
                    return messages.join(' and ') || _getMsg.call(I, context, 'numeric');
                }
                return true;
            }
        }
    }
};
// Global API


// Compare values
// Isntit.compare = function(value1, comparator, value2, strict) {
//     var strict = strict || false;
//     var result;
//     var typeOf1 = Isntit.getTypeBit(value1);
//     var typeOf2 = Isntit.getTypeBit(value2);
//     var types = (typeOf1 | typeOf2);
//     if (strict && (typeOf1 !== typeOf2)) {
//         throw new Error("When comparing values in strict mode, both value MUST have same bit mask.")
//     }
//     // Strings and Numbers only
//     if (types <= 3) {
//         return _compare(value1, comparator, value2);
//     }
//     // Other types MUST have same bit mask
//     if (typeOf1 !== typeOf2) {
//         return false;
//     }
//     // Other types are only compared for equality
//     if (config.equalityComparators.indexOf(comparator) === -1) {
//         throw new Error("Values other than numbers or string can only by compared for equality. Given comparator: " + comparator);
//     }
//     // Arrays and Maps
//     if (types === 64) {
//         var objLength1 = value1.length || value1.size;
//         var objLength2 = value2.length || value2.size;
//         if (objLength1 !== objLength2) {
//             return false;
//         }
//         var values = {
//             value2: value2,
//             result: true
//         };
//         value1.forEach(function(item1, index) {
//             if (!result) {
//                 return false;
//             }
//             var item2 = (typeof values.value2[index] !== 'undefined') ?
//                 values.value2[index] :
//                 values.value2.get(index);
//             values.result = (values.result && _compare(item1, comparator, item2, strict));
//         });
//         return values.result;
//     }
//     // Sets (not supported)
//     if (types === 128) {
//         throw new Error('Comparing Sets is not supported (yet?).');
//     }
//     // Objects
//     if (types === 256) {
//         var result = true;
//         for (var key in value1) {
//             if (!result) {
//                 return false;
//             }
//             result = (result && _compare(value1[key], comparator, value2[key], strict));
//         }
//         return result;
//     }
//     // Other types
//     return (strict) ?
//         (value1 === value2) :
//         (value1 == value2);
// }

// Get a bit mask for object
Isntit$1.getTypeBit = function(obj) {
    switch (typeof obj) {
        case 'string':
            return config.bitMasks['string'];
        case 'number':
            return config.bitMasks['number'];
        case 'boolean':
            return config.bitMasks['boolean'];
        case 'object':
            switch (true) {
                case (obj === null):
                    return config.bitMasks['null'];
                case (obj instanceof Date):
                    return config.bitMasks['date'];
                case (obj instanceof RegExp):
                    return config.bitMasks['regexp'];
                case (obj instanceof Array):
                case (obj instanceof Map):
                case (obj instanceof WeakMap):
                    return config.bitMasks['array'];
                case (obj instanceof Set):
                case (obj instanceof WeakSet):
                    return config.bitMasks['set'];
                default:
                    return config.bitMasks['object'];
            }
        default:
            return config.bitMasks['rest'];
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
    if (value instanceof Object && Object.keys(value).length === 0) {
        return true;
    }
    for (var i = 0; i < config.emptyValues.length; i++) {
        if (value === config.emptyValues[i]) {
            return true;
        }
    }
    return false;
};

Isntit$1.isOfType = function(types, value, warns) {
    warns = (typeof warns === 'undefined')? true : warns;
    if (Isntit$1.getTypeBit(types) === config.bitMasks['array']) {
        var res = false;
        types.forEach(function(type) {
            res = res || Isntit$1.isOfType(type, value, false);
        });
        types = types.join(', ');
    } else {
        var res = Isntit$1.getTypeBit(value) === config.bitMasks[types];
    }
    if (!res && warns) {
        warn(("Value is not of type " + types + ", given: " + (typeof value)));
    }
    return res;
};

Isntit$1.isNumber = function(value, warns) {
    return Isntit$1.isOfType('number', value, warns);
};

Isntit$1.isString = function(value, warns) {
    return Isntit$1.isOfType('string', value, warns);
};

/**
 * Printf 'clone'.
 * Use %{varName} in string with 'varName' as key in the `replacements` object
 */
Isntit$1.printf = function(str, replacements) {
    var replacements = replacements;
    return str.replace(/\%\{([\w\d_\.]+)\}/g, function(match, placeholder){
        if (typeof replacements[placeholder] != 'undefined') {
            return replacements[placeholder];
        }
        warn(("There is no replacement for " + match + " in " + str), replacements);
        return match;
    });
};

// Instance methods

// Validate
Isntit$1.prototype.validate = function(data, rules) {
    var this$1 = this;

    var rules = rules || this.rules;
    this.errors = {};
    // Looping on fields in data
    for (var fieldName in data) {
        if(hasOwn(data, fieldName)) {
            // Get the value to check
            var value = data[fieldName];
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
            // Looping through checkers steps
            for (var i = 0; i < config.checkersSteps.length; i++) {
                var step = config.checkersSteps[i];
                // Looping on rules for current data field
                for (var ruleName in rules[fieldName]) {
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
                    // Select the right checker
                    var checker = this$1.checkers[step][ruleName];
                    if (typeof checker !== 'undefined') {
                        var message = checker.validate.call(this$1, value, context);
                        if (message !== true) {
                            if (!hasOwn(this$1.errors, fieldName)) {
                                this$1.errors[fieldName] = [];
                            }
                            // Prepare replacements for parsing
                            var replacements = {
                                value: value,
                                label: fieldName
                            };
                            // Add properties from rule definition :
                            // length.`min = 1`, numeric.`noStrings = false`,...
                            Object.assign(replacements, context.ruleSet[ruleName]);
                            // Should the message be prepended with %{label}
                            var noPrepend = message.charAt(0) === config.noLabelChar;
                            var fullMessage = rules[fieldName][ruleName]['fullMessage'] || this$1.options.fullMessages;
                            if (fullMessage && !noPrepend) {
                                message = '%{label} ' + message;
                            }
                            if (noPrepend) {
                                message = message.substr(1);
                            }
                            // Parse message
                            message = Isntit$1.printf(message, replacements);
                            // Should the message be prepended capitalized
                            var capitalize = rules[fieldName][ruleName]['capitalize'] || this$1.options.capitalize;
                            if (capitalize) {
                                message = ucfirst(message);
                            }
                            // Set message in errors array
                            this$1.errors[fieldName].push(message);
                        }
                    }
                }
                if (typeof this$1.errors[fieldName] !== 'undefined') {
                    break;
                }
            }
        }
    }
    return this.errors;
};
// Comparing stuff
Isntit$1.prototype.compare = function(val1, comparator, val2) {
    if (!hasOwn(config.comparators, comparator)) {
        warn("Unknown comparator: " + comparator);
    }
    if (Isntit$1.getTypeBit(val1) !== Isntit$1.getTypeBit(val2)) {
        warn(("You are comparing values with different types: " + val1 + " and " + val2));
    }
    return this.config.comparators[comparator](val1, val2);
};

Isntit$1.prototype.getMessages = function() {
    return this.errors;
};

Isntit$1.prototype.registerChecker = function(checker, name, step, checkersSteps) {
    var this$1 = this;

    if (typeof checker !== 'function' && !hasOwn(checker, 'validate')) {
        if (arguments.length > 3) {
            warn('Instance methode registerChecker() signature is:\n(object[, step[, checkersSteps]]), supplemental arguments will be ignored.', Array.from(arguments));
        }
        for(var key in checker) {
            checkersSteps = step;
            if(config.checkersSteps.indexOf(key) !== -1) {
                step = key;
                for(var name in checker[step]) {
                    this$1.registerChecker(checker[step][name], name, step, checkersSteps);
                }
            } else {
                step = name;
                this$1.registerChecker(checker[key], key, step, checkersSteps);
            }
        }
    } else {
        step = step || 'during';
        if (typeof name === 'undefined') {
            throw new Error('When registering a `callback` as checker, you must provide a `name` for it: registerChecker(callable, name[, step[, checkersSteps]])');
        }
        if(!hasOwn(this.checkers, step)) {
            this.checkers[step] = {};
            if (typeof checkersSteps === 'undefined') {
                config.checkersSteps.push(step);
            }
        }
        if (hasOwn(checker, 'validate')) {
            this.checkers[step][name] = checker;
        } else {
            this.checkers[step][name] = {
                validate: checker
            };
        }
    }
};

/*  */

return Isntit$1;

})));
