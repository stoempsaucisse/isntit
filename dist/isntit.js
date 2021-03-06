/*!
 * Isntit - a simple javascript validation library
 * version: 1.1.0
 * (c) 2016-2017 stoempsaucisse
 * Released under the MIT License.
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.Isntit = factory());
}(this, (function () { 'use strict';

/**
 * Default configuration object.
 *
 * @type {Object}
 * @property {string}  env=NODE_ENV The environement for current runtime
 * @property {boolean} silent=false   Whether to silence warnings when devtools are enabled
 * @property {string[]} checkersSteps='before','during'  The list of validation steps chronolgicaly ordered.
 * @see  Step
 * @property {regexp}  confirmationRE=/(.+)_confirmation$/  The RegExp to test against to detect if a fieldname is a shorthand for the {@link Checker|confirms} checker.
 * @property {regexp}  emailRE=/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i  The RegExp to validate emails.
 * @copyright Many thanks to Jan Goyvaerts for his {@link http://www.regular-expressions.info/email.html|email regular expression}
 * @property {regexp}  emptyStringRE=/^[\s\t\n\r]+$/  The RegExp that defines which strings are considered as empty. This is used by {@link Isntit.isEmpty}
 * @property {string[]} emptyValues=null,undefined,'undefined'  The values to consider as empty. This is used by {@link Isntit.isEmpty}
 * @property {Object.<string, MessageTypes>} messages The fallback error messages tu use when validation against default checkers fails. Use the {@link Checker|checker name} as key.
 * @property {string} noLabelChar=^ Any error message starting with this chaaracter will never be prepended with the corresponding field name (even when {@link Options| options.fullMessages}) is true.
 */
var config = {
    env: "development",
    silent: false,
    checkersSteps: ['before', 'during'],
    confirmationRE: /(.+)_confirmation$/,
    /**
     * Many thanks to Jan Goyvaerts for his email regular expression
     * @url : http://www.regular-expressions.info/email.html
     */
    emailRE: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    emptyStringRE: /^[\s\t\n\r]+$/,
    emptyValues: [null, undefined, 'undefined'],
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
 *
 * @ignore
 */
function noop$1() {}

/**
 * Check whether the object has the property.
 *
 * @param {Object} obj The object for which the presence of a property with name = key.
 * @param {string} key The name of the property for which the presence is being checked.
 *
 * @returns {boolean} Whether given object has a property named as given key.
 * 
 * @ignore
 */
function hasOwn (obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}
// const hasOwnProperty = Object.prototype.hasOwnProperty

/**
 * Quick object check - this is primarily used to tell
 * Objects from primitive values when we know the value
 * is a JSON-compliant type.
 * 
 * @param {Object} obj An object that needs to be checked if it actualy is one.
 *
 * @returns {boolean} Whether given object actualy is an object.
 * 
 * @ignore
 */
function isObject (obj) {
  return obj !== null && typeof obj === 'object'
}

/**
 * Swap key-values pairs from object
 *
 * @param {Object} json  A flat object from which key-values should be swaped.
 *
 * @returns {Object}  An new object where the keys are the values from given object and the values are the keys from given object.
 *
 * @ignore
 */
function swap (json) {
    var ret = {};
    for(var key in json) {
        ret[json[key]] = key;
    }
    return ret;
}

var warn = noop$1;
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
 * Parse a string to replace placeholders.
 *
 * @param    {string}                   str           The string to parse for
 *                                                    `%{placeholder}`.
 * @param    {Object.<string, string>}  replacements  A collection of
 *                                                    placeholder: value.
 *
 * @returns  {string}                                 The string with
 *                                                    placeholders replaced with
 *                                                    corresponding values.
 *                                                    If there is no match for
 *                                                    placeholder: value in 
 *                                                    replacements, then `%{placeholder}`
 *                                                    will remain in the string.
 *
 * @alias Isntit.printf
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
 * Uppercase the first character of given string
 *
 * @ignore
 *
 * @param    {string}  str  The string to capitalize.
 *
 * @returns  {string}  The capitalized string.
 */
function ucfirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * A simple javascript validation library
 *
 * @param        {Rules}    [rules={}]    Validation rules
 * @param        {Options}  [options={}]  Runtime options
 *
 * @constructor
 */
function Isntit$2(rules, options) {
    // called as function
    if (!(this instanceof Isntit$2)) {
        warn('Isntit([rules [, options]]) is a constructor and should be called with the "new" keyword.');
        return new Isntit$2(rules, options);
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

/**
 * The validation rules object to pass to the {@link Isntit} constructor or to Isntit's validate method.
 *
 * @typedef   {Object.<string, Object>}  Rules
 * @property  {(Object.<string, Constraints>|boolean)}  `fieldName`  The rules to validate the value of field.
 * @property  {Constraints|boolean}  `fieldName`.`checkerName`  The constraints to pass to the checker.
 */

/**
 * The constraints to pass to corresponding {@link Checker|checker}.
 *
 * @typedef   {Object.<string, *>}  Constraints
 * @property {ErrorMessageProvider} [message] A customized error message.
 * @property {string|number|boolean} [`constraintName`]  The value of a constraint to pass to the checker.
 * @see  confirms|required|email|format|length|numeric
 */

/**
 * Check that the value is the same as the value in another field.
 *
 * @type {Constraints}
 * @property {string}               field     The field this field should confirm.
 * @property {boolean}              [strict]  Whether to compare strictly ('===') both field values or not ('==').
 * @property {ErrorMessageProvider} [message] A customized error message.
 * @example
 * "password_confirmation": true
 * // is converted to
 * "password_confirmation": {
 *     confirms: {
 *         field: "password"
 *     }
 * }
 */
var confirms = {
    validate: function(value, context) {
        var data = context.data;
        var _confirms = context.ruleSet.confirms;
        _confirms['otherValue'] = data[_confirms.field];
        return (_confirms.strict) ?
            (value === _confirms.otherValue) :
            (value == _confirms.otherValue);
    },
    types: ['boolean', { field: 'string' }]
};

/**
 * Check that a field is not empty (uses {@link Isntit.isEmpty}).
 *
 * @type  {(boolean|Constraints)}
 * @property {ErrorMessageProvider} [message] A customized error message.
 */
var required = {
    validate: function(value) {
        return !Isntit$2.isEmpty(value);
    },
    types: 'boolean'
};

/**
 * Check that the value is formated as an email (uses {@link Config|config.emailRE}).
 *
 * @name email
 * @type  {Constraints}
 * @property {ErrorMessageProvider} [message] A customized error message.
 */
var email = {
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
};

/**
 * Check that the value matches against given RegExp.
 *
 * @name format
 * @type  {(regexp|Constraints)}
 * @property {regexp} pattern The RegExp to test against.
 * @property {ErrorMessageProvider} [message] A customized error message.
 */
var format = {
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
};

/**
 * Check that value comply with legth constraints.
 *
 * @name length
 * @type  {Constraints}
 * @property {number} [is] The exact length of the value.
 * @property {number} [min] The minimum length of the value.
 * @property {number} [max] The maximum length of the value.
 * @property {ErrorMessageProvider} [message] A customized error message.
 */
var length = {
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
};

/**
 * Check value by comparing it with given constraints.
 *
 * @name numeric
 * @type  {Constraints}
 * @property {number} [equalTo]
 * @property {number} [notEqualTo]
 * @property {number} [greaterThan]
 * @property {number} [greaterThanOrEqualTo]
 * @property {number} [lessThan]
 * @property {number} [lessThanOrEqualTo]
 * @property {number} [greaterThan]
 * @property {boolean} [noStrings]  Whether to accept numbers as strings
 * @property {boolean} [onlyIntegers]  Whether to accept only integers.
 * @property {ErrorMessageProvider} [message] A customized error message.
 */
var numeric = {
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
};

/**
 * To customize the error messages you can either provide a string,
 * a function that returns a string or an object with `constraintName`s
 * as keys to a appropriated error message string. All error messages strings
 * are parsed by {@link Isntit.printf} to replace any `%{placeholders}`
 * with corresponding value taken from {@Constraints} properties (other than `message`).
 *
 * @typedef {(MessageString|MessageFunction|MessageObject)} ErrorMessageProvider
 */
/**
 * The message to show if corresponding checker fails.
 * This string is passed to {@link Isntit.printf} to replace `%{placeholders}`
 * with corresponding value taken from {@Constraints} properties (other than message).
 *
 * @typedef {string} MessageString  The string to show when the value is not valid.
 */
/**
 * A function that returns an error message should corresponding checker validation fail.
 *
 * @typedef {function}  MessageFunction
 * @param {Context} context  The context in which the failed checker has been called.
 * @param {string} [constraint]  The name of the constraint that failed for which a error message should be returned.
 * @returns {MessageString}
 */
/**
 * An object with `constraintName`s as keys and {@link MessageString}s or {@link MessageFunction}s as value.
 *
 * @typedef {Object.<string, (MessageString|MessageFunction)>}  MessageObject
 * @property {MessageString} [{@link Checker|`constraintName`}] A constraintName-MessageString pair.
 */

/**
 * The options object to pass to the {@link Isntit} constructor.
 *
 * @typedef   {Object}   Options
 * @property  {boolean}  [capitalize=true]    Whether to capitalize the first character of error messages.
 * @property  {boolean}  [devtools=true]      Whether to enable devtools (only for development build).
 * @property  {boolean}  [fullMessages=false]  Whether to prefix error messages with corresponding field name.
 * @property  {Object}   [config]        The {@link config} properties to override.
 */
Isntit$2.prototype.options = {
    capitalize: true,
    devtools: config.env !== 'production',
    fullMessages: false
};

/**
 * Collection of {@link Checker|checker}s ordered in separated steps.
 * The validation process simply loops over this Object. Step names have no effect
 * on the order.
 *
 * @typedef   {Object}  Checkers
 * @property  {Step}    before  A collection of checkers to call 'before' validation.
 * @property  {Step}    during  A collection of checkers called 'during' validation.
 * @property  {Step}    [`stepName`]  A collection of checkers to call in the 'stepName'.
 */

/**
 * A collection of {@link Checker|checker}s. Validation happens by steps. If one rule fails during current step, validation ends at the end of this step.
 *
 * @typedef  {Object.<string, Checker>}  Step
 */

/**
 * A checker is responsible for the validation of data. It holds the validation logic and the optional pre-validation check and type rules.
 *
 * @typedef  {Object.<string, (Object|function)>}  Checker
 * @property {(function|Object.<string, function>)} validate  The logic that validates the value. Receives value and the current {@link Context|context} as arguments.
 * @property {function} [preporcess]  A function that is called before actually validating the value. This is generaly used to check the type of given value and fail if the type is wrong without even trying to validate it.
 * @property {TypeRule} [types] When devtools are enabled, {@link Constraints|field rules} are checked with {@link checkType} to enforce the right types of constraints values.
 * @example
 * length: {
 *      validate: {
 *          is: function(value, context) {
 *              return (value.length == context.ruleSet['length'].is);
 *          },
 *          min: function(value, context) {
 *              return (value.length >= context.ruleSet['length'].min);
 *          },
 *          max: function(value, context) {
 *              return (value.length <= context.ruleSet['length'].max);
 *          }
 *      },
 *      preprocess: function(value, context) {
 *          var I = this;
 *          if (value.length === undefined) {
 *              I.cache.messages['length::preprocess'] = 'Values checked for length MUST have a length property. Given: ' + value;
 *              return false;
 *          }
 *          return true;
 *      },
 *      types: {
 *          __all: 'number'
 *      }
 *  }
 */

/**
 * The default checker collection.
 *
 * @type      {Checkers}
 * @property  {Step}    before    Checkers that are called before any other validation.
 * @property  {Checker} before.confirms  Check that the current field value is equal to the value of the field constraint. {@link confirms}
 * @property  {Checker} before.require Check that given value {@link Isntit.isEmpty|is not empty}. {@link require}
 * @property {Step} during The main validation step.
 * @property {Checker} during.email Check given value against the {@link Config|config.emailRE} RegExp.  {@link email}
 * @property {Checker} during.format Check given value against the pattern constraint.  {@link format}
 * @property {Checker} during.length Check the length of given value.  {@link length}
 * @property {Checker} during.numeric Compare given value against the rule constraints.  {@link numeric}
 * @see  Constraints
 */
var checkers = {
    before: {
        confirms: confirms,
        required: required
    },
    during: {
        email: email,
        format: format,
        length: length,
        numeric: numeric
    }
};

/**
 * Get the collection of steps and checkers currently in use.
 *
 * @returns  {Checkers}     The current Checkers.
 *
 * @see  Step
 */
Isntit$2.getCheckers = function() {
    return checkers;
};

/**
 * Register a checker. You may add a checker to a new or existing step or override an existing checker.
 *
 * @param    {Checker}  checker        The checker to register.
 * @param    {string}   name           The name to use.
 * @param    {string}   step           The step to register this checker to
 * @param    {string[]} checkersSteps  A list of steps to use dureing validation. Note that the order matters.
 * @see  Step
 */
Isntit$2.registerChecker = function(checker, name, step, checkersSteps) {
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
            throw new Error('When registering a callback as checker, you must provide a name for it: registerChecker(callable, name[, step[, checkersSteps]])');
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

/**
 * Check if an object is considered as empty.
 *
 * @param    {*}        obj  Any javascript object
 *
 * @returns  {boolean}  Return if given object is empty or not.
 *
 * @see {@link Config|config.emptyStringRE}
 */
Isntit$2.isEmpty = function(obj) {
    var typeOf = typeof obj;
    if ((typeOf === 'string' || typeOf === 'array') && obj.length === 0) {
        return true;
    }
    if ((typeOf === 'string') && config.emptyStringRE.test(obj)) {
        return true;
    }
    if (isObject(obj) && Object.keys(obj).length === 0) {
        return true;
    }
    for (var i = 0; i < config.emptyValues.length; i++) {
        if (obj === config.emptyValues[i]) {
            return true;
        }
    }
    return false;
};

// Wraper to string.printf
// Documentation: see './string.printf'
Isntit$2.printf = printf;

// Wraper to string.ucfirst
// Documentation: see './string.ucfirst'
Isntit$2.ucfirst = ucfirst;

/**
 * Set that an error occured in given context durring current validation.
 *
 * @param    {Context}  context          The Context in which the error occured.
 * @param    {string}   fieldName        The name of the field under validation.
 * @param    {string}   ruleName         The name of the checker currently called.
 * @param    {string}   [constraintName] The name of the constraint of the checker currently called.
 *
 * @private
 */
function _setError(context, fieldName, ruleName, constraintName) {
    var I = this;
    if (!hasOwn(I.errors, fieldName)) {
        I.errors[fieldName] = {};
    }
    if (constraintName) {
        if (!hasOwn(I.errors[fieldName], ruleName)) {
            I.errors[fieldName][ruleName] = {};
        }
        I.errors[fieldName][ruleName][constraintName] = true;
    } else {
        I.errors[fieldName][ruleName] = true;
    }
}

/**
 * Check given value against given {@link Checker|checker} or its appropriated {@link Constraints|constraints}.
 *
 * @param    {Checker}  checker  The Checker currently to call.
 * @param    {*}        value    The value that must be checked.
 * @param    {Context}  context  The context in which the value has to be checked.
 *
 * @private
 */
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

/**
 * Get the appropriated error message in given {@link Context|context}.
 * Error messages are cached if not already and retrieved from cache.
 *
 * @param    {Context}  context       The Context in which the error happened.
 * @param    {string}   [constraint]  The name of the Constraint where the error happened.
 *
 * @returns  {string}                 The appropriated error message.
 *
 * @private
 */
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

/**
 * Handle, prepare and set error messages for display.
 *
 * @param    {string}   fieldName  The name of the field currently under validation.
 * @param    {*}        value      The value of the field currently under validation.
 * @param    {Context}  context    The current Context in which value is validated.
 *
 * @private
 */
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
        label: context.ruleSet.label || context.fieldName
    };
    // Add properties from rule definition :
    // length.min = 1, numeric.noStrings = false,...
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


/**
 * The context in which the validate function of a checker is called (passed as second argument).
 *
 * @typedef  {Object}                       Context
 * @property {*}                            value        The value of the field under validation.
 * @property {string}                       `fieldName`  The name of the field under validation.
 * @property {Object.<string, *>}           data         The whole data object that is currently validated.
 * @property {string}                       `ruleName`   The name of the checker currently called.
 * @property {Object.<string, Constraints>}  ruleSet      The collection of rules to check current field against.
 * @property {Rules}                        rules        All the rules curently used during validation.
 * @property {string}                       step         The name of the current {@link Step|step}.
 * 
 * @see  Checker
 */
/**
 * Looping through all registered checkers, step by step, to validate the given value.
 *
 * @param    {*}  value      The value under validation.
 * @param    {string}  fieldName  The name of the field under validation.
 * @param    {Object.<string, *>}  data       The data under validation.
 * @param    {Rules}  rules      The rules the data must comply with.
 *
 * @private
 */
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

/**
 * Validate given data.
 *
 * @param    {Object.<string, *>}  data   The data to validate.
 * @param    {Rules}  [rules=this.rules]  The rules to validate aginst. If omited, the rules passed to the constructor are used.
 *                                                      
 * @returns  {boolean|Object.<string, string>}         Returns true if all data validates or a collection of fieldName-errorMessage pairs.
 */
Isntit$2.prototype.validate = function(data, rules) {
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
            // Check if it is a shorthand for confirms
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
    return (Isntit$2.isEmpty(I.errors)) ? true : I.errors;
};

Isntit$2.prototype.getCheckers = function() {
    return checkers;
};

Isntit$2.prototype.getMessages = function() {
    return this.errors;
};

Isntit$2.prototype.getStep = function(ruleName) {
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

Isntit$2.version = '1.1.0';

/**
 * A collection of javascript types corresponding to unique numbers.
 *
 * @ignore
 *
 * @type  {Object.<string, number>}
 */
var typeNumber = {
    'undefined': 1,
    string: 2,
    number: 4,
    'boolean': 8,
    'function': 16,
    // typeof == 'object' variations
    'null': 32,
    date: 64,
    regexp: 128,
    array: 256,
    set: 512,
    object: 1024,
    // anything else ?
    rest: (1 << 30)
};

/**
 * The swaped version of {@link typeNumber}
 *
 * @ignore
 *
 * @type  {Object.<number, string>}
 */
var swaped = swap(typeNumber);

/**
 * Get the type bit from {@link typeNumber} for given object
 *
 * @ignore
 *
 * @param    {*}       obj  The object to get the type number from.
 *
 * @returns  {number}       The number corresponding to given object in {@link typeNumber}
 */
function getTypeNumber(obj) {
    switch (typeof obj) {
        case 'undefined':
            return typeNumber['undefined'];
        case 'string':
            return typeNumber['string'];
        case 'number':
            return typeNumber['number'];
        case 'boolean':
            return typeNumber['boolean'];
        case 'function':
            return typeNumber['function'];
        case 'object':
            switch (true) {
                case (obj === null):
                    return typeNumber['null'];
                case (obj instanceof Date):
                    return typeNumber['date'];
                case (obj instanceof RegExp):
                    return typeNumber['regexp'];
                case (obj instanceof Array):
                case (obj instanceof Map):
                case (obj instanceof WeakMap):
                    return typeNumber['array'];
                case (obj instanceof Set):
                case (obj instanceof WeakSet):
                    return typeNumber['set'];
                default:
                    return typeNumber['object'];
            }
        default:
            return typeNumber['rest'];
    }
}

/**
 * Check if given object is a string.
 *
 * @ignore
 *
 * @param    {*}         obj           The object to check.
 * @param    {boolean}   [warns=true]  Whether to warn if check fails.
 *
 * @returns  {boolean}  Whether given object is a string.
 */
function isString(obj, warns) {
    var result = (getTypeNumber(obj) === typeNumber.string);
    if (warns && !result) {
        warn(("Value is not of type string, given: " + (typeof obj)));
    }
    return result;
}

/**
 * Get the javascript type for given object
 *
 * @ignore
 *
 * @param    {*}      obj  Any javascript object
 *
 * @returns  {string}      The type name of given object
 */
function getType(obj) {
    return swaped[getTypeNumber(obj)];
}

/**
 * Set the number for a javascript type in {@link typeNumber}
 *
 * @ignore
 *
 * @param  {(Object|string)}  obj    An example object or the javascript
 *                                   type name (as a string) for which to set the number.
 * @param  {number}           value  The (new) corresponding number for given obj
 */


/**
 * Check that an object comply with given type rules
 *
 * @param    {*}                                      object  Any javascript object.
 * @param    {TypeRule}  typeRules    A description of allowed types.
 *
 * @returns  {boolean}  Whether if given object complies with given type rules.
 */
function checkType(object, typeRules) {
    var result = true;
    var res;
    var typeofRule = typeof typeRules;
    if (typeofRule === 'string') {
        result = (getType(object) === typeRules);
    } else if(typeRules instanceof Array) {
        res = false;
        for (var i = 0; i < typeRules.length; i++) {
            if ((typeRules[i] instanceof Array) && (object instanceof Array)) {
                var rres = 0;
                for (var j = 0; j < object.length; j++) {
                    if (!checkType(object[j], typeRules[i])) {
                        rres += 1;
                    }
                }
                res = res || !rres;
            } else {
                res = res || checkType(object, typeRules[i]);
            }
        }
        result = res;
    } else if (typeofRule === 'function') {
        result = typeRules(object);
    } else if (typeRules !== null && typeofRule === 'object') {
        if (object !== null && typeof object !== 'object') {
            return false;
        }
        res = 0;
        for(var key in object) {
            var allOrRuleOrOther = typeRules['__all'] || typeRules[key] || typeRules['__others'];
            if (typeof typeRules !== 'undefined') {
                if (!checkType(object[key], allOrRuleOrOther)) {
                    res += 1;
                }
            }
        }
        result = !res;
    } else {
        warn("Oops, unknown case in checktype(). Args: ", object, typeRules);
    }
    return result;
}

/**
 * A set of rules defining the allowed types to check an object against.
 *
 * @typedef  {(string|Array.<TypeRule>|Object.<string, TypeRule>)}  TypeRule
 * @example
 * 'number'                             // The object should be a number.
 * or
 * ['boolean', ['string', 'number']]    // The object should either be a boolean
 *                                      // or an array of string and/or numbers.
 * or
 * {                                    // noStrings and onlyIntegers should be
 *     noStrings: 'boolean',            // booleans, all other properties should
 *     onlyIntegers: 'boolean',         // be numbers. Use __all instead of __others
 *     __others: 'numbers'              // if all properties should comply with
 * }                                    // given TypeRule.
 */

/**
 * Check if given object is of given javascript type.
 *
 * @ignore
 *
 * @param    {(string|string[])}  types         The javascript type name(s) to check against.
 * @param    {*}                  obj           The object that needs to be checked if of givven type(s).
 * @param    {boolean}            [warns=true]  Whether to warn if check fails.
 *
 * @returns  {boolean}   Whether given object is (one) of given type(s).
 */
function isOfType(types, obj, warns) {
    warns = (typeof warns === 'undefined')? true : warns;
    var res = false;
    if (getTypeNumber(types) === typeNumber['array']) {
        types.forEach(function(type) {
            res = res || isOfType(type, obj, false);
        });
        types = types.join(', ');
    } else {
        res = getTypeNumber(obj) === typeNumber[types];
    }
    if (!res && warns) {
        warn(("Value is not of type " + types + ", given: " + (typeof obj)));
    }
    return res;
}

/**
 * Check if given object is a number.
 *
 * @ignore
 *
 * @param    {*}         obj           The object to check.
 * @param    {boolean}   [warns=true]  Whether to warn if check fails.
 *
 * @returns  {boolean}  Whether given object is a number.
 */

var messageTypes = [
    'string',
    'function',
    {
        __all: ['string', 'function']
    }
];

var labelTypes = 'string';

/**
 * Add 'message types' on top of given type checking object.
 *
 * @param    {Object}  obj  An object holding the allowed types for a type check.
 *
 * @returns {Object} Given object augmented with 'message types'
 * 
 * @private
 */
function _addMessageTypes(obj) {
    if (!hasOwn(obj, 'message')) {
        obj['message'] = messageTypes;
        if (hasOwn(obj, '__all')) {
            obj['__others'] = obj['__all'];
            delete obj['__all'];
        }
    }
    return obj;
}

/**
 * Add the default types from given Constraints.
 * Default types are those provided by the type property of each checker to
 * which we add the 'message types' who are always needed.
 *
 * @param    {string | Array | Object}  constraints     The name of the current Checker or its type property.
 *
 * @returns {Array | Object}    A usable Array or Object for type checking augmented with 'message types'.
 * 
 * @private
 */
function _addDefaultTypes(constraints) {
    switch(true) {
        case typeof constraints === 'string':
            constraints = [constraints, { message: messageTypes }];
            break;
        case constraints instanceof Array:
            var found = false;
            for (var i = 0; i < constraints.length; i++) {
                if (isObject(constraints[i])) {
                    constraints[i] = _addMessageTypes(constraints[i]);
                    found = true;
                    break;
                } else if (typeof constraints[i] === 'function') {
                    found = true;
                    break;
                }
            }
            if (!found) {
                constraints.push({ message: messageTypes });
            }
            break;
        case (isObject(constraints)):
            constraints = _addMessageTypes(constraints);
            break;
        // 'function' MUST cover all cases internaly
        default:
            break;
    }
    return constraints;
}

Isntit$2.prototype.checkRules = noop$1;
// devtools enabled?
if ( config.env !== 'production') {
    /**
     * Check that the format of given {@link Rules|rules} comply with the 
     * registered {@link Checker|checker}s's {@link TypeRule} definitions.
     * <br/>Note : this method is only enabled when the source code is build with `config.env !== 'production'`
     *
     * @param    {Rules}  rules  The Rules set to check
     *
     * @returns  {boolean}         Whether given Rules set comply with the Checkers type definitions.
     */
    Isntit$2.prototype.checkRules = function(rules) {
        var I = this;
        for (var field in rules) {
            for (var prop in rules[field]) {
                var constraints;
                if (prop === 'label') {
                    constraints = labelTypes;
                } else {
                    var step = I.getStep(prop);
                    constraints = (checkers[step][prop].types) ? checkers[step][prop].types : checkers[step][prop];
                    constraints = _addDefaultTypes(constraints);
                }
                var res = checkType(rules[field][prop], constraints);
                if (!res) {
                    warn('At least one constraint of "' + prop + '" on "' + field + '" do not comply with following type constraints: ' + JSON.stringify(constraints));
                }
            }
        }
        return res;
    };
}

return Isntit$2;

})));
