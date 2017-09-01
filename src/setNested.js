export var setNested = function(path, obj, value) {
    path = (typeof path === 'string') ?
        path.split('.') :
        path;
    var pointer = obj;
    var i;
    for (i = 0; i < path.length; i += 1) {
        if (i === path.length - 1) {
            pointer[path[i]] = value;
        } else {
            if (pointer[path[i]] === undefined) {
                pointer[path[i]] = {};
            }
        };
        pointer = pointer[path[i]];
    }
    return obj;
};