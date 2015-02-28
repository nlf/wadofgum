var EventEmitter = require('events').EventEmitter;
var Hoek = require('hoek');
var Joi = require('joi');
var Util = require('util');
var Utils = require('./utils');

module.exports = function (type, schema) {

    var Model = function (fields) {

        fields = fields || {};
        Hoek.merge(this, fields);
        this.validate();
    };

    Model.type = type;
    Model.schema = schema;

    // Create the event emitter and proxy the on and emit methods
    Model.prototype._events = Model._events = new EventEmitter();
    Model.prototype.on = Model.on = Model._events.on.bind(Model._events);
    Model.prototype.emit = Model.emit = Model._events.emit.bind(Model._events);

    // Store a reference to the constructor
    Model.prototype._model = Model;

    Model.prototype.validate = function (callback) {

        var self = this;
        self.emit('preValidate', self);
        Joi.validate(self, self._model.schema, { abortEarly: false }, function (err, value) {

            Utils.coerce(self, err, value);
            self.emit('postValidate', self);
            if (typeof callback === 'function') {
                callback(err);
            }
        });
    };

    Model.bind = function (obj) {

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

    Model.method = function (obj) {

        var keys = Object.keys(obj);
        for (var i = 0, il = keys.length; i < il; ++i) {
            var key = keys[i];
            this.prototype[key] = obj[key];
        }
    };

    Model.register = function (plugins) {

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

            fn.call(null, Model, opts);
        }

        return this;
    };

    return Model;
};
