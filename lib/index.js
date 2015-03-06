var EventEmitter = require('events').EventEmitter;
var Hoek = require('hoek');
var Joi = require('joi');
var Utils = require('./utils');

module.exports = function (options) {

    Joi.assert(options || {}, Joi.object({
        type: Joi.string().required(),
        schema: Joi.object().required()
    }), 'Invalid options');

    var Factory = function (fields) {

        Hoek.merge(this, fields || {});
        this.validate();
        this.factory.emit('create', this);
    };

    Factory.type = options.type;
    Factory.schema = options.schema.isJoi ? options.schema : Joi.object(options.schema);
    Factory.prototype.factory = Factory;

    var _addEmitter = function (context) {

        context._events = new EventEmitter();
        context.on = context._events.on.bind(context._events);
        context.emit = context._events.emit.bind(context._events);
    };

    _addEmitter(Factory);
    _addEmitter(Factory.prototype);

    Factory.prototype.validate = function (callback) {

        this.emit('preValidate', this);
        Joi.validate(this, this.factory.schema, { abortEarly: false }, function (err, value) {

            Utils.coerce(this, err, value);
            this.emit('postValidate', this);

            if (typeof callback === 'function') {
                callback(err);
            }
        }.bind(this));
    };

    var _extend = function (obj) {

        var keys = Object.keys(obj);
        for (var i = 0, il = keys.length; i < il; ++i) {
            var key = keys[i];
            this[key] = obj[key];
        }
    };

    Factory.extend = function () {

        _extend.apply(Factory, arguments);
    };

    Factory.prototype.extend = function () {

        _extend.apply(Factory.prototype, arguments);
    };

    Factory.register = function () {

        var plugins = Hoek.flatten(Array.prototype.slice.call(arguments));
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
