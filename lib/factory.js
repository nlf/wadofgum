var EventEmitter = require('events').EventEmitter;
var Hoek = require('hoek');
var Joi = require('joi');
var Util = require('util');
var Utils = require('./utils');

module.exports = function (options) {

    var optionsSchema = Joi.object({
        type: Joi.string().required(),
        schema: Joi.object().required()
    });

    Joi.assert(options || {}, optionsSchema);

    var schema = options.schema.isJoi ? options.schema : Joi.object().keys(options.schema);
    var type = options.type;

    var Factory = function (fields) {

        fields = fields || {};
        Hoek.merge(this, fields);
        Factory.emit('create', this);
        this.validate();
    };

    Factory.type = type;
    Factory.schema = schema;

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
            if (typeof obj[key] === 'function') {
                this[key] = obj[key].bind(this);
            }
            else {
                this[key] = obj[key];
            }
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
        if (!plugins.length) {
            return this;
        }

        for (var i = 0, il = plugins.length; i < il; ++i) {
            var plugin = plugins[i];
            var fn = typeof plugin === 'function' ? plugin :
                (typeof plugin === 'object' && typeof plugin.register === 'function' ? plugin.register :
                 (typeof plugin.register === 'object' && typeof plugin.register.register === 'function' ? plugin.register.register : undefined));

            var opts = typeof plugin === 'object' ? plugin.options : {};

            if (!fn) {
                throw new Error('Invalid plugin');
            }

            fn.call(null, Factory, opts);
        }

        return this;
    };

    return Factory;
};
