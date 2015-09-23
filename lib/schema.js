var Joi = require('joi');

exports.plugins = Joi.array().items([
    Joi.func(),
    Joi.object({
        register: Joi.alternatives().try([
            Joi.func(),
            Joi.object({
                register: Joi.func().required()
            })
        ]).required(),
        options: Joi.object().default({})
    })
]).single().default([]);

exports.factories = Joi.array().items([
    Joi.func()
]).single().min(1).required();

exports.options = Joi.object({
    type: Joi.string().required(),
    schema: Joi.object().required(),
    plugins: exports.plugins
});
