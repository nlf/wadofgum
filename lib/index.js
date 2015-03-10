var Joi = require('joi');
var Spit = require('spit');

var internals = {};
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

    context._events = new Spit();
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

internals.schema = {};
internals.schema.plugins = Joi.array().items(Joi.func(), Joi.object({
    register: Joi.alternatives().try(Joi.func(), Joi.object({ register: Joi.func().required() })).required(),
    options: Joi.object().default({})
})).single().default([]);

internals.schema.options = Joi.object({
    type: Joi.string(),
    schema: Joi.object(),
    plugins: internals.schema.plugins
}).and('type', 'schema').when('type', { is: Joi.any().valid(undefined), then: Joi.object({ plugins: Joi.array().min(1) }) });

internals.createFactory = function (options) {

    var settings = Joi.validate(options, internals.schema.options);
    if (settings.error) {
        throw new Error('Invalid options');
    }

    var Factory = function (fields) {

        internals.setValues(this, null, fields || {}, this.factory.keys);
        this.validate();
        this.factory.emit('create', this);
    };

    Factory.type = settings.value.type;
    Factory.schema = settings.value.schema.isJoi ? settings.value.schema : Joi.object(settings.value.schema);
    Factory.keys = internals.schemaKeys(Factory);

    Factory.prototype.factory = Factory;

    internals.addEmitter(Factory);
    internals.addEmitter(Factory.prototype);

    Factory.prototype.validate = function (callback) {

        callback = callback || function () {};
        var self = this;
        self.emit('preValidate', self, function (err) {

            if (err) {
                return callback(err);
            }

            Joi.validate(self, self.factory.schema, { abortEarly: false, allowUnknown: true }, function (err, value) {

                internals.setValues(self, err, value, Factory.keys);
                self.emit('postValidate', self, function (er) {

                    if (er) {
                        return callback(er);
                    }

                    callback(err);
                });
            });
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

    Factory.register = function (plugins) {

        var settings = Joi.validate(plugins, internals.schema.plugins);
        if (settings.error) {
            throw new Error('Invalid plugin');
        }

        for (var i = 0, il = settings.value.length; i < il; ++i) {
            var plugin = settings.value[i];
            var opts = typeof plugin === 'object' ? plugin.options : {};
            var fn = typeof plugin === 'function' ? plugin : (typeof plugin.register === 'function' ? plugin.register : plugin.register.register);

            fn.call(null, Factory, opts);
        }
    };

    for (var i = 0, il = settings.value.plugins.length; i < il; ++i) {
        Factory.register(settings.value.plugins[i]);
    }

    return Factory;
};

module.exports = internals.createFactory;
