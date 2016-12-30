/**
 * Perform no operation.
 *
 * @ignore
 */
export function noop() {}

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
export function hasOwn (obj, key) {
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
export function isObject (obj) {
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
export function swap (json) {
    var ret = {};
    for(var key in json) {
        ret[json[key]] = key;
    }
    return ret;
}
