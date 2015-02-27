var Hoek = require('hoek');
var Joi = require('joi');
var Utils = require('./utils');

module.exports = function (type, schema) {

    var Model = function (fields) {

        fields = fields || {};
        Hoek.merge(this, fields);
        this.validate();
    };

    Model.type = type;
    Model.schema = schema;
    Model.prototype._model = Model;

    Model.prototype._callHook = function (hook) {

        var self = this;
        if (!self[hook]) {
            return;
        }

        var hooks = self[hook];
        for (var i = 0, il = hooks.length; i < il; ++i) {
            hooks[i].call(self, Model);
        }
    };

    Model.prototype.validate = function (callback) {

        var self = this;
        self._callHook('preValidate');
        Joi.validate(self, self._model.schema, { abortEarly: false }, function (err, value) {

            Utils.coerce(self, err, value);
            self._callHook('postValidate');
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

    Model.on = function (event, fn) {

        if (!this.prototype[event]) {
            this.prototype[event] = [];
        }

        this.prototype[event].push(fn);
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
