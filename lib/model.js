var Hoek = require('hoek');
var Joi = require('joi');
var Utils = require('./utils');

module.exports = function (collection) {

    var _validate = function (model, schema, callback) {

        collection._preValidate.forEach(function (func) {
            func.call(model, collection);
        });

        Joi.validate(model, schema, { abortEarly: false }, function (err, value) {

            Utils.coerce(model, err, value);
            if (typeof callback === 'function') {
                callback(err);
            }
        });
    };

    var Model = function (fields) {

        fields = fields || {};
        Hoek.merge(this, fields);
        _validate(this, collection.schema);
    };

    Model.prototype.validate = function (callback) {

        _validate(this, collection.schema, callback);
    };

    Model.use = function (plugin) {

        Hoek.assert(typeof plugin === 'function', 'Plugin must be a constructor method');

        Object.keys(plugin).forEach(function (key) {

            if (key === 'preValidate') {
                collection._preValidate.push(plugin.preValidate);
            }
            else {
                Model[key] = plugin[key];
            }
        });

        Hoek.merge(Model.prototype, plugin.prototype);
        plugin.call(this, collection);

        return this;
    };

    return Model;
};
