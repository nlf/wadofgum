var Hoek = require('hoek');

exports.coerce = function (obj, err, coerced) {

    var _reachDelete = function (obj, key) {

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

    if (err) {
        for (var i = 0, il = err.details.length; i < il; ++i) {
            var detail = err.details[i];
            _reachDelete(coerced, detail.path);

            if (detail.type === 'object.allowUnknown') {
                var path = detail.path === detail.context.key ? detail.path : detail.path + '.' + detail.context.key;
                _reachDelete(obj, path);
            }
        }
    }

    Hoek.merge(obj, coerced, false);
};
