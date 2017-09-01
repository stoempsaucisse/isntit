export var getType = function (value) {
    return Object.prototype.toString.apply(value).slice(8, -1);
};