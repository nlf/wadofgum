var Hoek = require('hoek');

var internals = {};
internals.reachDelete = function (obj, key) {

    var path = key.split('.');
    var ref = obj;
    for (var i = 0, il = path.length; i < il; ++i) {
        var segment = path[i];
        if (i + 1 === il) {
            delete ref[segment];
        }

        ref = ref[segment];
    }
};

exports.coerce = function (obj, err, coerced) {

    if (err) {
        for (var i = 0, il = err.details.length; i < il; ++i) {
            internals.reachDelete(coerced, err.details[i].path);
        }
    }

    Hoek.merge(obj, coerced, false);
};
