import Isntit from '../index'
import { checkers } from '../isntit'
import { config } from '../config'
import { warn } from '../debug'
import { noop, hasOwn, isObject } from '../utils'
import { checkType } from '../type'

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

Isntit.prototype.checkRules = noop;
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
    Isntit.prototype.checkRules = function(rules) {
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
    }
}

export default Isntit