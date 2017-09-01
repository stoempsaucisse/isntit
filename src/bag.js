import checksTypes from './checksTypes';

var bag = function (config, my, that) {
    config = config || {};
    my = my || {};
    that = that || {};
    checksTypes(config, my, that);

    // Checking if "that" object already has bag activated
    if (my.has.bag !== true) {
        my.has.bag = true;

        var myBag,
            tree;

        var get,
            getAll,
            reset,
            set,
            union,
            unset;

        myBag = {};

        try {
            tree = my.getNested(config, 'bag.tree');
        } catch (e) {
            tree = false;
        };

        get = function (key) {
            var specs = {
                name: 'get',
                args: [key],
                types: ['String']
            };
            my.checkType(specs);

            return tree ? my.getNested(myBag, key) : myBag[key];
        };
        that.get = get;
        getAll = function () {
            return myBag;
        };
        that.getAll = getAll;
        reset = function () {
            myBag = {};
            return that;
        };
        that.reset = reset;
        set = function (key, value) {
            var specs = {
                name: 'set',
                args: [key],
                types: ['String']
            };
            my.checkType(specs);

            if (tree) {
                my.setNested(myBag, key, value);
            } else {
                myBag[key] = value;
            };
            return that;
        };
        that.set = set;
        union = function (otherBag) {
            var specs = {
                name: 'union',
                args: [otherBag],
                types: ['Object']
            };
            my.checkType(specs);

            myBag = Object.assign(myBag, otherBag);
            return that;
        };
        that.union = union;
        unset = function (key) {
            var specs = {
                name: 'unset',
                args: [key],
                types: ['String']
            };
            my.checkType(specs);

            if (tree) {
                my.unsetNested(myBag, key);
            } else {
                delete myBag[key];
            };
            return that;
        };
        that.unset = unset;
    };

    return that;
};

export default bag;