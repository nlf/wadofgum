var EventEmitter = require('events').EventEmitter;
var Hoek = require('hoek');
var Joi = require('joi');
var Util = require('util');
var Utils = require('./utils');

module.exports = function (options) {

    Joi.assert(options || {}, Joi.object({
        type: Joi.string().required(),
        schema: Joi.object().required()
    }), 'Invalid options');

    var Factory = function (fields) {

        fields = fields || {};
        Hoek.merge(this, fields);
        this.validate();
        Factory.emit('create', this);
    };

    Factory.type = options.type;
    Factory.schema = options.schema.isJoi ? options.schema : Joi.object(options.schema);

    // Create the factory event emitter and proxy the on and emit methods
    Factory._events = new EventEmitter();
    Factory.on = Factory._events.on.bind(Factory._events);
    Factory.emit = Factory._events.emit.bind(Factory._events);

    // Create the model instance event emitter and proxy the on and emit methods
    Factory.prototype._events = new EventEmitter();
    Factory.prototype.on = Factory._events.on.bind(Factory.prototype._events);
    Factory.prototype.emit = Factory._events.emit.bind(Factory.prototype._events);

    // Store a reference to the constructor
    Factory.prototype.factory = Factory;

    Factory.prototype.validate = function (callback) {

        var self = this;
        self.emit('preValidate', self);
        Joi.validate(self, self.factory.schema, { abortEarly: false }, function (err, value) {

            Utils.coerce(self, err, value);
            self.emit('postValidate', self);
            if (typeof callback === 'function') {
                callback(err);
            }
        });
    };

    Factory.extend = function (obj) {

        var keys = Object.keys(obj);
        for (var i = 0, il = keys.length; i < il; ++i) {
            var key = keys[i];
            this[key] = typeof obj[key] === 'function' ? obj[key].bind(this) : obj[key];
        }
    };

    Factory.method = function (obj) {

        var keys = Object.keys(obj);
        for (var i = 0, il = keys.length; i < il; ++i) {
            var key = keys[i];
            this.prototype[key] = obj[key];
        }
    };

    Factory.listen = function (event, fn) {

        this.prototype._events.on(event, fn);
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

        return this;
    };

    return Factory;
};
