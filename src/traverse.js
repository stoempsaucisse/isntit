import {getType} from './getType';

export var traverse = function (obj, fn, acc, args, path) {
    var key;
    path = path || [];
    for (key in obj) {
        path.push(key);
        if (getType(obj[key]) === 'Object') {
            acc = traverse(obj[key], fn, acc, args, path);
        } else {
            acc = fn(obj[key], acc, path, args);
        }
        path.pop();
    }
    return acc;
};