import {slice} from './helpers/slice';
import {mergeArguments} from './mergeArguments';
import {_} from './placeholder';

export var curry = function (fn) {
    var args = slice(arguments, 1);
    return function () {
        var fnArgs = mergeArguments(args, slice(arguments));
        var fnApply = fnArgs.indexOf(_) === -1;
        if (fnApply) {
            return fn.apply(null, fnArgs);
        } else {
            return curry.apply(null, [fn].concat(fnArgs));
        };
    };
};