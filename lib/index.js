var EventEmitter = require('events').EventEmitter;
var Joi = require('joi');

var internals = {};

internals.flatten = function (array, target) {

    var result = target || [];
    for (var i = 0, il = array.length; i < il; ++i) {
        if (Array.isArray(array[i])) {
            internals.flatten(array[i], result);
        }
        else {
            result.push(array[i]);
        }
    }

    return result;
};

internals.schemaKeys = function (parent) {

    var keys = {};
    for (var i = 0, il = parent.schema._inner.children.length; i < il; ++i) {
        var child = parent.schema._inner.children[i];
        if (child.schema._type === 'object') {
            keys[child.key] = internals.schemaKeys(child);
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

internals.copy = function (target, source, errs, valid) {

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
            internals.copy(target[key], source[key], errs[key], valid[key]);
        }
    }
};

internals.setValues = function (obj, err, coerced, valid) {

    internals.copy(obj, coerced, err ? internals.parseErrors(err) : {}, valid);
};

internals.addEmitter = function (context) {

    context._events = new EventEmitter();
    context.on = context._events.on.bind(context._events);
    context.emit = context._events.emit.bind(context._events);
};

internals.extend = function (context, obj) {

    var keys = Object.keys(obj);
    for (var i = 0, il = keys.length; i < il; ++i) {
        var key = keys[i];
        context[key] = obj[key];
    }
};

internals.createFactory = function (options) {

    Joi.assert(options || {}, Joi.object({
        type: Joi.string().required(),
        schema: Joi.object().required()
    }), 'Invalid options');

    var Factory = function (fields) {

        internals.setValues(this, null, fields || {}, this.factory.keys);
        this.validate();
        this.factory.emit('create', this);
    };

    Factory.type = options.type;
    Factory.schema = options.schema.isJoi ? options.schema : Joi.object(options.schema);
    Factory.keys = internals.schemaKeys(Factory);

    Factory.prototype.factory = Factory;

    internals.addEmitter(Factory);
    internals.addEmitter(Factory.prototype);

    Factory.prototype.validate = function (callback) {

        var self = this;
        self.emit('preValidate', self);
        Joi.validate(self, self.factory.schema, { abortEarly: false, allowUnknown: true }, function (err, value) {

            internals.setValues(self, err, value, Factory.keys);
            self.emit('postValidate', self);

            if (typeof callback === 'function') {
                callback(err);
            }
        });
    };

    Factory.extendSchema = function () {

        Factory.schema = Factory.schema.concat.apply(Factory.schema, arguments);
        Factory.keys = internals.schemaKeys(Factory);
    };

    Factory.extend = function (obj) {

        internals.extend(Factory, obj);
    };

    Factory.prototype.extend = function (obj) {

        internals.extend(Factory.prototype, obj);
    };

    Factory.register = function () {

        var plugins = internals.flatten(Array.prototype.slice.call(arguments));
        for (var i = 0, il = plugins.length; i < il; ++i) {
            var plugin = plugins[i];
            var opts = typeof plugin === 'object' ? plugin.options : {};
            var fn = typeof plugin === 'function' ? plugin :
                (typeof plugin === 'object' && typeof plugin.register === 'function' ? plugin.register :
                 (typeof plugin.register === 'object' && typeof plugin.register.register === 'function' ? plugin.register.register : undefined));

            if (!fn) {
                throw new Error('Invalid plugin');
            }

            fn.call(null, Factory, opts);
        }
    };

    return Factory;
};

module.exports = internals.createFactory;
