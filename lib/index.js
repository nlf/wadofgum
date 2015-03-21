var Joi = require('joi');
var Promise = require('bluebird');
var Schema = require('./schema');
var Utils = require('./utils');

var createFactory = function (options) {

    var settings = Joi.validate(options || {}, Schema.options);
    if (settings.error) {
        throw new Error('Invalid options');
    }

    var Factory = function (fields) {

        Utils.setValues(this, null, fields || {}, this.factory.keys);
        this.factory.emit('create', this);
    };

    Factory.isFactory = true;
    Factory.type = settings.value.type;
    Factory._schema = settings.value.schema.isJoi ? settings.value.schema : Joi.object(settings.value.schema);

    Object.defineProperty(Factory, 'schema', {
        enumerable: true,
        get: function () {

            return this._schema;
        },
        set: function (val) {

            this._schema = this._schema.concat(val.isJoi ? val : Joi.object(val));
            this.keys = Utils.schemaKeys(this);
        }
    });

    Factory.plugins = settings.value.plugins;
    Factory.keys = Utils.schemaKeys(Factory);

    Factory.prototype.factory = Factory;

    Utils.addEmitter(Factory);
    Utils.addEmitter(Factory.prototype);

    Factory.prototype.validate = function () {

        var self = this;
        var validate = function () {

            return new Promise(function (resolve, reject) {

                Joi.validate(self, self.factory.schema, { abortEarly: false, allowUnknown: true }, function (err, value) {

                    Utils.setValues(self, err, value, self.factory.keys);
                    if (err) {
                        return reject(err);
                    }

                    resolve();
                });
            });
        };

        return self.emit('preValidate', self).then(validate).then(function () { return self.emit('postValidate', self); });
    };

    Factory.extend = function (factories) {

        var settings = Joi.validate(factories, Schema.factories);
        if (settings.error) {
            throw new Error('Invalid factory');
        }

        for (var i = 0, il = settings.value.length; i < il; ++i) {
            var factory = settings.value[i];
            if (!factory.isFactory) {
                throw new Error('Invalid factory');
            }

            Utils.extend(Factory, factory);
        }
    };

    Factory.register = function (plugins) {

        var settings = Joi.validate(plugins, Schema.plugins.min(1));
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

createFactory.Promise = Promise;

module.exports = createFactory;
