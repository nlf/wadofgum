var Hoek = require('hoek');
var Joi = require('joi');
var Model = require('./lib/model');

module.exports = function (options) {

    options = options || {};
    Hoek.assert(typeof options.name === 'string' && options.name.length > 0, 'must provide a name');
    Hoek.assert(typeof options.schema === 'object', 'must provide a schema');

    var schema = options.schema.isJoi ? options.schema : Joi.object().keys(options.schema);
    return Model(options.name, schema);
};
