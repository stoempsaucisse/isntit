import Validation from './Validation';
import {curry} from './curry';
import {slice} from './helpers/slice';
import {_} from './placeholder';
import {getType} from './getType';
import {setNested} from './setNested';
import {getNested} from './getNested';

var Failure = Validation.Failure;
var Success = Validation.Success;
var arrayJoin;

export var writeMsg = function (field, message, value, other) {
    var replacements = {
        value: value
    }
    arrayJoin = arrayJoin || getNested('validators.arrayJoin', config) || ', ';
    if (other !== undefined) {
        Object.assign(replacements, other);
        for (name in replacements) {
            if (getType(replacements[name]) === 'Array') {
                replacements[name] = replacements[name].join(arrayJoin);
            }else if (getType(replacements[name]) !== 'string') {
                replacements[name] = replacements[name].toString();
            };
            message = message.replace('%' + name + '%', replacements[name]);
        }
    } else {
        message = message.replace('%value%', value);
    };
    var ret = {
        field: field,
        message: message
    };
    return ret;
}

var regExpStore = {
    isInteger: /^-?\d*$/,
    isNumberString: /^-?\d*([\.|,]\d+)?$/
};
export var setRegExp = function (regExp, name) {
    if (typeof regExp === 'string') {
        name = name || regExp;
        regExpStore[name] = new RegExp(regExp);
    } else if (regExp.constructor !== RegExp) {
        name = name || regExp.toString();
        regExpStore[name] = regExp;
    } else {
        throw new TypeError(regExp + " is not a RegExp.");
    };
};

// var makeRegExpValidator = function (name, regExp, message) {
//     message = message || 'doesn\'t match %re%.';
//     setRegExp(regExp, name);
//     return function (value, data, field) {
//         return regExpStore[name].test(value) ?
//             Success(value) :
//             Failure([writeMsg(field, message, value, originalData, {re: regExp})]);
//     };
// }

var _not = function(aTest) {
    return function () {
        var result = aTest.apply(null, arguments);
        return result.isSuccess ?
            Failure([]) :
            Success()
    };
};
var _and = function () {
    var tests = slice(arguments);
    return function () {
        var result = Success();
        var i = 0;
        for (i; i < tests.length; i +=1) {
            result = result.concat(tests[i].apply(null, arguments));
        };
        return result;
    };
};
var _or = function () {
    var tests = slice(arguments);
    return function () {
        var result;
        var i = 0;
        for (i; i < tests.length; i += 1) {
            result = tests[i].apply(null, arguments);
            if (result.isSuccess) {
                return result;
            }
        }
        return result;
    };
};
var _eq = function (value, standard) {
    return value === standard ?
        Success() :
        Failure([]);
};
var _lt = function (value, threshold) {
    return value < threshold ?
        Success() :
        Failure([]);
};
var _lte = function (value, threshold) {
    return _or(_lt, _eq)(value, threshold);
};
var _max = function (string, length) {
    return _lte(string.length, length);
};
var _between = function (value, min, max) {
    return _not(_lte)(value, min).concat(_lte(value, max));
};
var _type = function (value, type) {
    return getType(value) === type ?
        Success() :
        Failure([]);
};
var _regExp = function (value, regExpName) {
    return regExpStore[regExpName].test(value) ?
        Success() :
        Failure([]);
};
var _makeValidator = function (aTest, testArgs = [], message, msgData) {
    var fn = curry.apply(null, [aTest, _].concat(testArgs));
    return function (value, data, field) {
        var result = fn(value);
        // log(result);
        return result.isSuccess ?
            Success({value: value, data: data}) :
            Failure([writeMsg(field, message, value, msgData)]);
    };
};

export var validators = {
    notRequired (message) {
        message = message || 'is not required.';
        return function notRequired (value, data, field) {
            return value === undefined ?
                Success({value: value, data: data}) :
                Failure([writeMsg(field, message, value)]);
        };
    },
    number: {
        lt (threshold, message) {
            message = message || 'is not lower than %threshold%.';
            var msgData = {threshold: threshold};
            return _makeValidator(_lt, [threshold], message, msgData);
        },
        lte (threshold, message) {
            message = message || 'is not lower than or equal to %threshold%.';
            var msgData = {threshold: threshold};
            return _makeValidator(_lte, [threshold], message, msgData);
        },
        gt (threshold, message) {
            message = message || 'is not lower than %threshold%.';
            var msgData = {threshold: threshold};
            return _makeValidator(_not(_lt), [threshold], message, msgData);
        },
        gte (threshold, message) {
            message = message || 'is not lower than or equal to %threshold%.';
            var msgData = {threshold: threshold};
            return _makeValidator(_not(_lte), [threshold], message, msgData);
        },
        between (min, max, message) {
            message = message || 'should be between %min% and %max%.';
            var msgData = {min: min, max: max};
            return _makeValidator(_between, [min, max], message, msgData);
        }
    },
    string: {
        max (threshold, message) {
            message = message || 'should be maximum %threshold% characters long.';
            var msgData = {threshold: threshold};
            return _makeValidator(_max, [threshold], message, msgData);
        },
        min  (threshold, message) {
            message = message || 'hould be at least %threshold% characters long.';
            var msgData = {threshold: threshold};
            return _makeValidator(_not(_max), [threshold], message, msgData);
        },
        between (min, max, message) {
            message = message || 'should be between %min% and %max% characters long.';
            var msgData = {min: min, max: max};
            var validator = _makeValidator(_between, [min, max], message, msgData);
            return function (value, data, field) {
                return validator(value.length, data, field);
            };
        },
        length: {
            is (threshold, message) {},
            min (threshold, message) {},
            max (threshold, message) {}
        }
    },
    isNumberString (message) {
        message = message || 'is not a number-string: any number of digits optionnaly followed by one dot or comma (as decimal separator) plus any number of digits.';
        return function (value, data, field) {
            var result = _makeValidator(_regExp, ['isNumberString'], message)(value, data, field);
            if (result.isSuccess) {
                result = Success({value: value.replace(',', '.'), data: data});
            };
            return result;
        };
    },
    isString (message) {
        message = message || 'is not a string.';
        return _makeValidator(_type, ['String'], message);
    },
    length: {
        is (threshold, message) {},
        min (threshold, message) {},
        max (threshold, message) {}
    },
    regExp (regExp, message) {
        message = message || 'doesn\'t match %regExp%.';
        setRegExp(regExp);
        return function (value, data, field) {
            return regExpStore[name].test(value) ?
                Success({value: value, data: data}) :
                Failure([writeMsg(field, message, value, {regExp: regExp})]);
        };
    },
    list (list, message) {
        message = message || 'should be one of %list%.';
        return function (value, data, field) {
            return list.indexOf(value) === -1 ?
                Failure([writeMsg(field, message, value, {list: list})]) :
                Success({value: value, data: data});
        }
    },
    not (fn, message) {
        message = message || 'passes %fnName% validator.'
        return function not (value, data, field) {
            var result = fn(value, data, field);
            return (result.isFailure) ?
                Success({value: value, data: data}) :
                Failure([writeMsg(field, message, value, {fnName: fn.name})]);
        }
    },
    or () {
        var fns = slice(arguments);
        return function or (value, data, field) {
            var result;
            var i = 0;
            for (i; i < fns.length; i += 1) {
                result = fns[i](value, data, field);
                if (result.isSuccess) {
                    return result;
                }
            }
            return result;
        };
    },
    compose () {
        var fns = slice(arguments);
        return function compose (value, data, field) {
            var result = Success();
            fns.forEach(function (fn) {
                var interim = fn(value, data, field);
                value = interim.isSuccess ?
                    interim.value.value :
                    value;
                result = result.concat(interim);
            });
            return result;
        };
    },
    makeValidator: _makeValidator
};

// export var validators = {
//     /*/lt (threshold, message) {
//         message = message || 'is not lower than %threshold%.';
//         // message = message.replace('%threshold%', threshold);
//         return function lt (value, data, field) {
//             var result = _lte(value, threshold + 1);
//             return result.isSuccess ?
//                 Success(value) :
//                 Failure([writeMsg(field, message, value, {threshold: threshold})]);
//         };
//     },/*/
//     lt (threshold, message) {
//         message = message || 'is not lower than %threshold%.';
//         var msgData = {threshold: threshold};
//         return _makeValidator(_lt, [threshold], message, msgData);
//     },/*/
//     le (threshold, message) {
//         message = message || 'is not lower than or equal to %threshold%.';
//         message = message.replace('%threshold%', threshold);
//         return validators.lt(threshold + 1, message);
//     },/*/
//     lte (threshold, message) {
//         message = message || 'is not lower than or equal to %threshold%.';
//         var msgData = {threshold: threshold};
//         return _makeValidator(_lte, [threshold], message, msgData);
//     },/*/
//     gt (threshold, message) {
//         message = message || 'is not greater than %threshold%.';
//         message = message.replace('%threshold%', threshold);
//             return value > threshold ?
//                 Success(value) :
//                 Failure([writeMsg(field, message, value)]);
//         };
//     },/*/
//     gt (threshold, message) {
//         message = message || 'is not lower than %threshold%.';
//         var msgData = {threshold: threshold};
//         return _makeValidator(_not(_lt), [threshold], message, msgData);
//     },/*/
//     ge (threshold, message) {
//         message = message || 'is not greater or equal to %threshold%.';
//         message = message.replace('%threshold%', threshold);
//         return validators.gt(threshold - 1, message);
//     },/*/
//     ge (threshold, message) {
//         message = message || 'is not lower than or equal to %threshold%.';
//         var msgData = {threshold: threshold};
//         return _makeValidator(_not(_lte), [threshold], message, msgData);
//     },
//     notRequired () {
//         return function notRequired (value, data, field) {
//             return value === undefined ?
//                 Success(value) :
//                 Failure([writeMsg(field, 'is not required.', value)]);
//         };
//     },/*/
//     isString (message) {
//         message = message || 'is not a string.';
//         return function isString (value, data, field) {
//             return typeof value === 'string' ?
//                 Success(value) :
//                 Failure([writeMsg(field, message, value)]);
//         }
//     },/*/
//     isString (message) {
//         message = message || 'is not a string.';
//         return _makeValidator(_type, ['String'], message);
//     },/*/
//     isInteger (message) {
//         message = message || 'is not an integer.';
//         return makeRegExpValidator('isInteger', /^-?\d*$/, message);
//     },/*/
//     isInteger (message) {
//         message = message || 'is not an integer.';
//         return _makeValidator(_regExp, ['isInteger'], message);
//     },/*/
//     isNumberString: isNumberString,/*/
//     isNumberString (message) {
//         message = message || 'is not a number-string: any number of digits optionnaly followed by one dot or comma (as decimal separator) plus any number of digits.';
//         return _makeValidator(_regExp, ['isNumberString'], message);
//     },/*/
//     isNumber (message) {
//         message = message || 'is not a number.';
//         return function isNumber (value, data, field) {
//             return typeof value === 'number' && isFinite(value) ?
//                 Success(value) :
//                 Failure([writeMsg(field, message, value)])
//         };
//     },
//     min (threshold, message) {
//         message = message || 'should be at least %threshold% characters long.';
//         return function min (value, data, field) {
//             var msg = message.replace('%value%', value);
//             return validators.ge(threshold, msg)(field, value.length);
//         }
//     },/*/
//     min (threshold, message) {
//         message = message || 'hould be at least %threshold% characters long.';
//         var msgData = {threshold: threshold};
//         return _makeValidator(_not(_max), [threshold], message, msgData);
//     },/*/
//     max (threshold, message) {
//         message = message || 'should be maximum %threshold% characters long.';
//         return function max (value, data, field) {
//             var msg = message.replace('%value%', value);
//             return validators.le(threshold, msg)(field, value.length);
//         }
//     },/*/
//     max (threshold, message) {
//         message = message || 'should be maximum %threshold% characters long.';
//         var msgData = {threshold: threshold};
//         return _makeValidator(_max, [threshold], message, msgData);
//     },
//     between (min, max, message) {
//         // message = message || 'should be between ' + min + ' and ' + max;
//         return validators.compose(validators.min(min, message), validators.max(max, message));
//     },
//     not (fn, message) {
//         message = message || 'passes %fnName% validator.'
//         return function not (value, data, field) {
//             var result = fn(value, data, field);
//             return (result.isFailure) ?
//                 Success(value) :
//                 Failure([writeMsg(field, message, value, {fnName: fn.name})]);
//         }
//     },
//     or () {
//         var fns = slice(arguments);
//         return function or (value, data, field) {
//             var result;
//             var i = 0;
//             for (i; i < fns.length; i += 1) {
//                 result = fns[i](value, data, field);
//                 if (result.isSuccess) {
//                     return result;
//                 }
//             }
//             return result;
//         };
//     },
//     compose () {
//         var fns = slice(arguments);
//         return function compose (value, data, field) {
//             var result = Success();
//             fns.forEach(function (fn) {
//                 result = result.concat(fn(value, data, field));
//             });
//             return result;
//         };
//     },
//     makeRegExpValidator: makeRegExpValidator
// }