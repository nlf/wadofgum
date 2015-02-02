var Hoek = require('hoek');
var Joi = require('joi');
var Schema = require('./schema');
var Utils = require('./utils');

module.exports = function (collection) {

    var Model = function (fields) {

        var self = this;
        fields = fields || {};
        Hoek.merge(this, fields);

        Joi.validate(fields, collection.schema, function (err, value) {

            Utils.coerce(self, err, value);
        });
    };

    Model.prototype.validate = function (callback) {

        var self = this;
        collection._preValidate.forEach(function (func) {
            func.call(self, collection);
        });

        Joi.validate(self, collection.schema, { abortEarly: false }, function (err, converted) {

            Utils.coerce(self, err, converted);
            if (typeof callback === 'function') {
                callback(err);
            }
        });
    };

    Model.use = function (plugin) {

        Joi.validate(plugin || {}, Schema.Plugin, function (err) {
            if (err) {
                throw err;
            }
        });

        var self = this;
        if (plugin.methods) {
            Object.keys(plugin.methods).forEach(function (method) {
                self.prototype[method] = plugin.methods[method].bind(self);
            });
        }

        if (plugin.preValidate) {
            collection._preValidate.push(plugin.preValidate);
        }

        if (plugin.initialize) {
            plugin.initialize(collection);
        }
    };

    return Model;
};
