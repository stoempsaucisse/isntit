import baseObject from './baseObject';

var app = function(config, my, that) {
    config = config || {};
    my = my || {};
    that = that || {};

    // Depending on baseObject for my.has
    baseObject(config, my, that);

    // Checking if "that" object already has app activated
    if (my.has.app !== true) {
        my.has.app = true;

        var getName,
            getVersion;

        getName = function () { return my.appName; };
        that.getName = getName;
        getVersion = function () { return my.appVersion; };
        that.getVersion = getVersion;
    };

    return that;
};

export default app;