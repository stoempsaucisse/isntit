import { config } from './config'
import { warn } from './debug'
import { hasOwn, ucfirst } from './utils'

var defaultOptions = {
    /**
     * Whether to suppress warnings.
     */
    silent: false,
    /**
     * Whether to enable devtools.
     */
    devtools: process.env.NODE_ENV !== 'production',
    /**
     * Whether to prefix erro messages with the field name.
     */
    fullMessages: false,
    /**
     * Whether to capitalize error messages.
     */
    capitalize: true
}


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
}

function Isntit(rules, options) {
    // called as function
    if (!(this instanceof Isntit)) {
        warn('`Isntit([rules [, options]])` is a constructor and should be called with the `new` keyword.');
        return new Isntit(rules, options);
    }
    this.options = Object.assign(defaultOptions, options || {});
    this.rules = rules || {};
    this.config = config;
    this.errors = {};
}

Isntit.prototype.currentContext = {};
Isntit.prototype.config = config;

Isntit.prototype.checkers = {
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
                if (Isntit.isEmpty(value)) {
                    return _getMsg.call(I, context, 'required');
                }
                return true;
            }
        }
    },
    during: {
        email: {
            validate: function(value, context){
                Isntit.isString(value);
                var I = this;
                if (!config.emailRE.test(value)) {
                    return _getMsg.call(I, context, 'email');
                }
                return true;
            }
        },
        format: {
            validate: function(value, context) {
                Isntit.isOfType(['string', 'number'], value);
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
                Isntit.isOfType(['string', 'number', 'array'], value);
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
                Isntit.isOfType(['string', 'number'], value);
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
}
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
Isntit.getTypeBit = function(obj) {
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
    if (value instanceof Object && Object.keys(value).length === 0) {
        return true;
    }
    for (var i = 0; i < config.emptyValues.length; i++) {
        if (value === config.emptyValues[i]) {
            return true;
        }
    }
    return false;
}

Isntit.isOfType = function(types, value, warns) {
    warns = (typeof warns === 'undefined')? true : warns;
    if (Isntit.getTypeBit(types) === config.bitMasks['array']) {
        var res = false;
        types.forEach(function(type) {
            res = res || Isntit.isOfType(type, value, false);
        });
        types = types.join(', ');
    } else {
        var res = Isntit.getTypeBit(value) === config.bitMasks[types];
    }
    if (!res && warns) {
        warn(`Value is not of type ${types}, given: ${typeof value}`);
    }
    return res;
}

Isntit.isNumber = function(value, warns) {
    return Isntit.isOfType('number', value, warns);
}

Isntit.isString = function(value, warns) {
    return Isntit.isOfType('string', value, warns);
}

/**
 * Printf 'clone'.
 * Use %{varName} in string with 'varName' as key in the `replacements` object
 */
Isntit.printf = function(str, replacements) {
    var replacements = replacements;
    return str.replace(/\%\{([\w\d_\.]+)\}/g, function(match, placeholder){
        if (typeof replacements[placeholder] != 'undefined') {
            return replacements[placeholder];
        }
        warn(`There is no replacement for ${match} in ${str}`, replacements);
        return match;
    });
}

// Instance methods

// Validate
Isntit.prototype.validate = function(data, rules) {
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
                    }
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
                    var checker = this.checkers[step][ruleName];
                    if (typeof checker !== 'undefined') {
                        var message = checker.validate.call(this, value, context);
                        if (message !== true) {
                            if (!hasOwn(this.errors, fieldName)) {
                                this.errors[fieldName] = [];
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
                            var fullMessage = rules[fieldName][ruleName]['fullMessage'] || this.options.fullMessages;
                            if (fullMessage && !noPrepend) {
                                message = '%{label} ' + message;
                            }
                            if (noPrepend) {
                                message = message.substr(1);
                            }
                            // Parse message
                            message = Isntit.printf(message, replacements);
                            // Should the message be prepended capitalized
                            var capitalize = rules[fieldName][ruleName]['capitalize'] || this.options.capitalize;
                            if (capitalize) {
                                message = ucfirst(message);
                            }
                            // Set message in errors array
                            this.errors[fieldName].push(message);
                        }
                    }
                }
                if (typeof this.errors[fieldName] !== 'undefined') {
                    break;
                }
            }
        }
    }
    return this.errors;
}
// Comparing stuff
Isntit.prototype.compare = function(val1, comparator, val2) {
    if (!hasOwn(config.comparators, comparator)) {
        warn("Unknown comparator: " + comparator);
    }
    if (Isntit.getTypeBit(val1) !== Isntit.getTypeBit(val2)) {
        warn(`You are comparing values with different types: ${val1} and ${val2}`);
    }
    return this.config.comparators[comparator](val1, val2);
}

Isntit.prototype.getMessages = function() {
    return this.errors;
}

Isntit.prototype.registerChecker = function(checker, name, step, checkersSteps) {
    if (typeof checker !== 'function' && !hasOwn(checker, 'validate')) {
        if (arguments.length > 3) {
            warn('Instance methode registerChecker() signature is:\n(object[, step[, checkersSteps]]), supplemental arguments will be ignored.', Array.from(arguments));
        }
        for(var key in checker) {
            checkersSteps = step;
            if(config.checkersSteps.indexOf(key) !== -1) {
                step = key;
                for(var name in checker[step]) {
                    this.registerChecker(checker[step][name], name, step, checkersSteps);
                }
            } else {
                step = name;
                this.registerChecker(checker[key], key, step, checkersSteps);
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
}

export default Isntit;