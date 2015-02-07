var Hoek = require('hoek');
var Joi = require('joi');
var Utils = require('./utils');

module.exports = function (collection) {

    var Model = function (fields) {

        fields = fields || {};
        Hoek.merge(this, fields);
        this.validate();
    };

    Model.prototype._callHook = function (hook) {

        if (!Array.isArray(this[hook])) {
            return;
        }

        var self = this;
        self[hook].forEach(function (fn) {

            fn.call(self, collection);
        });
    };

    Model.prototype.validate = function (callback) {

        var self = this;
        self._callHook('preValidate');
        Joi.validate(self, collection.schema, { abortEarly: false }, function (err, value) {

            Utils.coerce(self, err, value);
            self._callHook('postValidate');
            if (typeof callback === 'function') {
                callback(err);
            }
        });
    };

    Model.use = function (plugin, options) {

        Hoek.assert(typeof plugin === 'function', 'Plugin must be a constructor method');

        Object.keys(plugin).forEach(function (key) {

            Model[key] = plugin[key];
        });

        ['preValidate', 'postValidate'].forEach(function (hook) {

            if (plugin.prototype[hook]) {
                plugin.prototype[hook] = [].concat(plugin.prototype[hook]);
            }
        });

        Hoek.merge(Model.prototype, plugin.prototype);
        plugin.call(this, collection, options);

        return this;
    };

    Model.prototype._model = Model;

    return Model;
};
