import { warn } from './debug'
/**
 * Perform no operation.
 */
export function noop() {}

/**
 * Always return false.
 */
export var no = function () { return false; };

/**
 * Check whether the object has the property.
 */
const hasOwnProperty = Object.prototype.hasOwnProperty
export function hasOwn (obj, key) {
    return hasOwnProperty.call(obj, key);
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
export function set (obj, key, val) {
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
export function isObject (obj) {
  return obj !== null && typeof obj === 'object'
}

/**
 * Helper that recursively merges two data objects together.
 * Data from `to` has priority on data from `from`
 * If you want to override data from `from` to `to`,
 * please use `Object.assign(to, from);`
 */
export function mergeData (to, from) {
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
export function ucfirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
/**
 * Printf clone.
 * Use %{varName} wher 'varName' is a key in `replacements`
 */
export function printf(str, replacements) {
    var replacements = replacements;
    return str.replace(/\%\{([\w\d_\.]+)\}/g, function(match, placeholder){
        return replacements[placeholder];
    });
}

export function compareNumbers(val1, comparator, val2) {
    if (!hasOwn(this.config.comparators, comparator)) {
        warn(`'${comparator}' cannot be used as comparition operator. Returning false by default.`);
        return false;
    }
    return this.config.comparators[comparator].fun(val1, val2);
}
