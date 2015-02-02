var Model = require('./lib/model');
var Schema = require('./lib/schema');

module.exports = function (options) {

    options = options || {};

    var self = this;
    self._preValidate = [];

    Schema.validate(options, function (err, schema) {

        if (err) {
            throw err;
        }

        self.name = options.name;
        self.schema = schema;
    });

    return Model(self);
};
