import { warn } from './debug'
import { config } from './config'
import { hasOwn, isObject, noop } from './utils'
import { printf, ucfirst } from './string'

/**
 * A simple javascript validation library
 *
 * @param        {Rules}    [rules={}]    Validation rules
 * @param        {Options}  [options={}]  Runtime options
 *
 * @constructor
 */
function Isntit(rules, options) {
    // called as function
    if (!(this instanceof Isntit)) {
        warn('Isntit([rules [, options]]) is a constructor and should be called with the "new" keyword.');
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
}

/**
 * Check that a field is not empty (uses {@link Isntit.isEmpty}).
 *
 * @type  {(boolean|Constraints)}
 * @property {ErrorMessageProvider} [message] A customized error message.
 */
var required = {
    validate: function(value) {
        return !Isntit.isEmpty(value);
    },
    types: 'boolean'
}

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
}

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
}

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
}

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
}

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
Isntit.prototype.options = {
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
export var checkers = {
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
}

/**
 * Get the collection of steps and checkers currently in use.
 *
 * @returns  {Checkers}     The current Checkers.
 *
 * @see  Step
 */
Isntit.getCheckers = function() {
    return checkers;
}

/**
 * Register a checker. You may add a checker to a new or existing step or override an existing checker.
 *
 * @param    {Checker}  checker        The checker to register.
 * @param    {string}   name           The name to use.
 * @param    {string}   step           The step to register this checker to
 * @param    {string[]} checkersSteps  A list of steps to use dureing validation. Note that the order matters.
 * @see  Step
 */
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
}

/**
 * Check if an object is considered as empty.
 *
 * @param    {*}        obj  Any javascript object
 *
 * @returns  {boolean}  Return if given object is empty or not.
 *
 * @see {@link Config|config.emptyStringRE}
 */
Isntit.isEmpty = function(obj) {
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
}

// Wraper to string.printf
// Documentation: see './string.printf'
Isntit.printf = printf;

// Wraper to string.ucfirst
// Documentation: see './string.ucfirst'
Isntit.ucfirst = ucfirst;

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
        label: context.fieldName
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
 * @property {string}                       `fieldName`  The name of the field under valoidation.
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

/**
 * Validate given data.
 *
 * @param    {Object.<string, *>}  data   The data to validate.
 * @param    {Rules}  [rules=this.rules]  The rules to validate aginst. If omited, the rules passed to the constructor are used.
 *                                                      
 * @returns  {boolean|Object.<string, string>}         Returns true if all data validates or a collection of fieldName-errorMessage pairs.
 */
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
            // Check if it is a shorthand for confirms
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