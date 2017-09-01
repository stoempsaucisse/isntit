export var getNested = function(path, obj) {
    path = (typeof path === 'string') ?
        path.split('.') :
        path;
    var i;
    for (i = 0; i < path.length; i += 1) {
        obj = obj === undefined ?
            obj :
            obj[path[i]];
    }
    return obj;
};