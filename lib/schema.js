var Joi = require('joi');

var definition = Joi.object().keys({
    name: Joi.string().required(),
    schema: Joi.object().required()
});

exports.validate = function (settings, callback) {

    definition.validate(settings, function (err) {

        if (err) {
            return callback(err);
        }

        var schema = settings.schema.isJoi ? settings.schema : Joi.object().keys(settings.schema);
        return callback(null, schema);
    });
};

exports.Plugin = Joi.object().keys({
    initialize: Joi.func(),
    methods: Joi.object().pattern(/.*/, Joi.func()),
    preValidate: Joi.func()
}).or('initialize', 'methods', 'preValidate');
