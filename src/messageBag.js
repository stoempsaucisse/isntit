import bag from './bag';
import baseObject from './baseObject';

var messageBag = function (config, my, that) {
    config = config || {};
    my = my || {};
    that = that || baseObject(config, my);

    // Checking if "that" object already has messageBag activated
    if (my.has.messageBag !== true) {
        my.has.messageBag = true;

        if (config.messageBag === undefined) { config.messageBag = {}; };
        if (config.messageBag.tree === undefined) { config.messageBag.tree = false; };
        if (config.bag === undefined) { config.bag = {}; };
        if (config.bag.tree === undefined) { config.bag.tree = config.messageBag.tree; };
        var messages = bag(config, my);

        var read,
            readAll,
            getBag,
            message,
            readList,
            reset,
            write,
            erase;

        read = function (key) {
            try {
                return messages.get(key);
            } catch (e) {
                my.throwError('Error', 'Bad parameter for read(), \'' + key + '\' doesn\'t match any message. Returned an empty bag.');
                return {};
            }
        };
        my.read = that.read = read;
        readAll = function () {
            return messages.getAll();
        };
        my.readAll = that.readAll = readAll;
        getBag = function () {
            return messages;
        };
        my.getBag = that.getBag = getBag;
        message = function () {
            log(arguments);
            var portions = arguments[0].split('.');
            var ret = {
                value: arguments[2],
                name: portions[portions.length - 1],
                fullname: arguments[0]
            };
            Object.defineProperty(ret, 'message', {
                get: function() {
                    log('get');
                    log(arguments);
                }
            });
            return ret;
        };
        readList = function (list) {
            var specs = {
                name: 'readList',
                args: [list],
                types: [['Array', 'String']],
                warns: false
            };
            my.checkType(specs);

            list = typeof list === 'string' ? [list] : list;
            var ret = {};
            var i;
            for (i = 0; i < list.length; i += 1) {
                try {
                    var value = my.getNested(messages, list[i]);
                    my.setNested(ret, list[i], value);
                } catch (e) {
                    my.throwError('Error', 'Bad parameter for readList(), \'' + list[i] + '\' doesn\'t match any message.');
                }
            }
            return ret;
        };
        my.readList = that.readList = readList;
        reset = function () {
            messages.reset();
        };
        my.reset = that.reset = reset;
        write = function (key, msg, value) {
            var portions = key.split('.');
            msg = {
                message: msg,
                value: value,
                name: portions[portions.length - 1],
                fullname: key
            };
            messages.set(key, msg);
        };
        my.write = that.write = write;
        erase = function (key) {
            try {
                return messages.unset(key);
            } catch (e) {
                my.throwError('Error', 'Bad parameter for erase(), \'' + key + '\' doesn\'t match any message.');
                return {};
            }
        };
        my.erase = that.erase = erase;

    }

    return that;
};

export default messageBag;