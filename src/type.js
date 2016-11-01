import { warn } from './debug'
import { swap } from './utils'

export var typeBits = {
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

var swaped = swap(typeBits);

export function getTypeBit(obj) {
    switch (typeof obj) {
        case 'undefined':
            return typeBits['undefined'];
        case 'string':
            return typeBits['string'];
        case 'number':
            return typeBits['number'];
        case 'boolean':
            return typeBits['boolean'];
        case 'function':
            return typeBits['function'];
        case 'object':
            switch (true) {
                case (obj === null):
                    return typeBits['null'];
                case (obj instanceof Date):
                    return typeBits['date'];
                case (obj instanceof RegExp):
                    return typeBits['regexp'];
                case (obj instanceof Array):
                case (obj instanceof Map):
                case (obj instanceof WeakMap):
                    return typeBits['array'];
                case (obj instanceof Set):
                case (obj instanceof WeakSet):
                    return typeBits['set'];
                default:
                    return typeBits['object'];
            }
        default:
            return typeBits['rest'];
    }
}

export function setTypeBit(obj, value) {
    if (getTypeBit(obj) === typeBits['object']) {
        typeBits = Object.assign(typeBits, obj);
    } else {
        typeBits[obj] = value;
    }
}

export function getType(obj) {
    return swaped[getTypeBit(obj)];
}

export function checkType(object, rule) {
    var result = true;
    var res;
    var typeofRule = typeof rule;
    if (typeofRule === 'string') {
        result = (getType(object) === rule);
    } else if(rule instanceof Array) {
        res = false;
        for (var i = 0; i < rule.length; i++) {
            if ((rule[i] instanceof Array) && (object instanceof Array)) {
                var rres = 0;
                for (var j = 0; j < object.length; j++) {
                    if (!checkType(object[j], rule[i])) {
                        rres += 1;
                    }
                }
                res = res || !rres;
            } else {
                res = res || checkType(object, rule[i]);
            }
        }
        result = res;
    } else if (typeofRule === 'function') {
        result = rule(object);
    } else if (rule !== null && typeofRule === 'object') {
        if (object !== null && typeof object !== 'object') {
            return false;
        }
        res = 0;
        for(var key in object) {
            var allOrRuleOrOther = rule['__all'] || rule[key] || rule['__others'];
            if (typeof rule !== 'undefined') {
                if (!checkType(object[key], allOrRuleOrOther)) {
                    res += 1;
                }
            }
        }
        result = !res;
    } else {
        warn("Oops, unknown case in checktype(). Args: ", object, rule);
    }
    return result;
}

export function isOfType(types, value, warns) {
    warns = (typeof warns === 'undefined')? true : warns;
    var res = false;
    if (getTypeBit(types) === typeBits['array']) {
        types.forEach(function(type) {
            res = res || isOfType(type, value, false);
        });
        types = types.join(', ');
    } else {
        res = getTypeBit(value) === typeBits[types];
    }
    if (!res && warns) {
        warn(`Value is not of type ${types}, given: ${typeof value}`);
    }
    return res;
}

export function isNumber(value, warns) {
    var result = (getTypeBit(value) === typeBits.number);
    if (warns && !result) {
        warn(`Value is not of type number, given: ${typeof value}`);
    }
    return result;
}

export function isString(value, warns) {
    var result = (getTypeBit(value) === typeBits.string);
    if (warns && !result) {
        warn(`Value is not of type string, given: ${typeof value}`);
    }
    return result;
}