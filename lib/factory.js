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
        this.emit('create', this);
        this.validate();
    };

    Factory.type = type;
    Factory.schema = schema;

    // Create the event emitter and proxy the on and emit methods
    Factory.prototype.events = Factory.events = new EventEmitter();
    Factory.prototype.on = Factory.on = Factory.events.on.bind(Factory.events);
    Factory.prototype.emit = Factory.emit = Factory.events.emit.bind(Factory.events);

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

    Factory.register = function (plugins) {

        plugins = [].concat(plugins);
        for (var i = 0, il = plugins.length; i < il; ++i) {
            var plugin = plugins[i];
            var fn = typeof plugin === 'function' ? plugin :
                (typeof plugin === 'object' && typeof plugin.register === 'function' ? plugin.register :
                 (typeof plugin === 'object' && typeof plugin.register.register === 'function' ? plugin.register.register : undefined));

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
