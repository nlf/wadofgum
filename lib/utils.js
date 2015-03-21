var Spit = require('spit');

var internals = {};

exports.schemaKeys = function (parent) {

    var keys = {};
    for (var i = 0, il = parent.schema._inner.children.length; i < il; ++i) {
        var child = parent.schema._inner.children[i];
        if (child.schema._type === 'object') {
            keys[child.key] = exports.schemaKeys(child);
        }
        else {
            keys[child.key] = true;
        }
    }

    return keys;
};

internals.parseErrors = function (err) {

    var errs = {};

    for (var i = 0, il = err.details.length; i < il; ++i) {
        var e = err.details[i];
        var path = e.path.split('.');
        var ref = errs;
        for (var t = 0, tl = path.length; t < tl; ++t) {
            var segment = path[t];
            if (t + 1 === tl) {
                ref[segment] = true;
            }
            else {
                ref[segment] = {};
            }

            ref = ref[segment];
        }
    }

    return errs;
};

internals.setValues = function (target, source, errs, valid) {

    errs = errs || {};
    var keys = Object.keys(valid);
    for (var i = 0, il = keys.length; i < il; ++i) {
        var key = keys[i];
        if (errs[key] ||
            !valid[key]) {

            continue;
        }

        if (valid[key] === true) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key];
            }
            else {
                delete target[key];
            }
        }
        else {
            target[key] = target[key] || {};
            internals.setValues(target[key], source[key], errs[key], valid[key]);
        }
    }
};

exports.setValues = function (obj, err, coerced, valid) {

    internals.setValues(obj, coerced, err ? internals.parseErrors(err) : {}, valid);
};

exports.addEmitter = function (context) {

    context._events = new Spit();
    context.on = context._events.on.bind(context._events);
    context.emit = context._events.emit.bind(context._events);
};

internals.blacklist = {};
internals.blacklist.factory = ['type', 'extend', 'register', 'on', 'emit', 'keys', '_schema', '_events'];
internals.blacklist.proto = ['factory', 'on', 'emit', '_events', 'validate'];

internals.extend = function (target, source, blacklist) {

    var keys = Object.keys(source);
    for (var i = 0, il = keys.length; i < il; ++i) {
        var key = keys[i];
        if (blacklist.indexOf(key) !== -1) {
            continue;
        }

        if (key === 'plugins') {
            target[key] = target[key].concat(source[key]);
        }
        else {
            target[key] = source[key];
        }
    }
};

exports.extend = function (model, base) {

    internals.extend(model, base, internals.blacklist.factory);
    internals.extend(model.prototype, base.prototype, internals.blacklist.proto);

    for (var i = 0, il = base.plugins.length; i < il; ++i) {
        model.register(base.plugins[i]);
    }

    model.keys = exports.schemaKeys(model);
};

exports.Promise = Spit.Promise;
