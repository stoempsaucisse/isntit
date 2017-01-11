import { warn } from './debug'
import { swap } from './utils'

/**
 * A collection of javascript types corresponding to unique numbers.
 *
 * @ignore
 *
 * @type  {Object.<string, number>}
 */
export var typeNumber = {
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
export function getTypeNumber(obj) {
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
export function isString(obj, warns) {
    var result = (getTypeNumber(obj) === typeNumber.string);
    if (warns && !result) {
        warn(`Value is not of type string, given: ${typeof obj}`);
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
export function getType(obj) {
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
export function setTypeNumber(obj, value) {
    if (isString(obj)) {
        typeNumber[obj] = value;
        return;
    }
    var type = getType(obj);
    if (type !== undefined) {
        typeNumber[type] = value;
    } else {
        warn('Unknown object type, please pass it\'s name as a string as first argument.', obj);
    }
}

/**
 * Check that an object comply with given type rules
 *
 * @param    {*}                                      object  Any javascript object.
 * @param    {TypeRule}  typeRules    A description of allowed types.
 *
 * @returns  {boolean}  Whether if given object complies with given type rules.
 */
export function checkType(object, typeRules) {
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
export function isOfType(types, obj, warns) {
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
        warn(`Value is not of type ${types}, given: ${typeof obj}`);
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
export function isNumber(obj, warns) {
    var result = (getTypeNumber(obj) === typeNumber.number);
    if (warns && !result) {
        warn(`Value is not of type number, given: ${typeof obj}`);
    }
    return result;
}