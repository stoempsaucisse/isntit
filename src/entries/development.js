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

function _pushMessageTypes(obj) {
    if (!hasOwn(obj, 'message')) {
        obj['message'] = messageTypes;
        if (hasOwn(obj, '__all')) {
            obj['__others'] = obj['__all'];
            delete obj['__all'];
        }
    }
    return obj;
}

function _addDefaultTypes(constraints) {
    switch(true) {
        case typeof constraints === 'string':
            constraints = [constraints, { message: messageTypes }];
            break;
        case constraints instanceof Array:
            var found = false;
            for (var i = 0; i < constraints.length; i++) {
                if (isObject(constraints[i])) {
                    constraints[i] = _pushMessageTypes(constraints[i]);
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
            constraints = _pushMessageTypes(constraints);
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
    Isntit.prototype.checkRules = function(rules) {
        var I = this;
        for (var field in rules) {
            for (var prop in rules[field]) {
                var step = I.getStep(prop);
                var constraints = (checkers[step][prop].types) ? checkers[step][prop].types : checkers[step][prop];
                constraints = _addDefaultTypes(constraints);
                var res = checkType(rules[field][prop], constraints);
                if (!res) {
                    warn('At least one constraint of "' + prop + '" on "' + field + '" do not comply with following type constraints: ' + JSON.stringify(constraints));
                }
            }
        }
    }
}

export default Isntit