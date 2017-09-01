import {_} from './placeholder';

export var mergeArguments = function (primaryArgs, secundaryArgs) {
    var merged = [].concat(primaryArgs);
    var i = 0;
    for (i; i < secundaryArgs.length; i += 1) {
        var index = merged.indexOf(_);
        if (index !== -1) {
            // log(index);
            // log(merged);
            // log(secundaryArgs[i]);
            merged[index] = secundaryArgs[i];
        } else {
            merged.push(secundaryArgs[i]);
        }
    };
    return merged;
};