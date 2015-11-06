'use strict';

let internals = {
    meta: new WeakMap()
};

class Model {
    constructor (fields) {

        fields = fields || {};
        for (let key in fields) {
            this[key] = fields[key];
        }
    };

    static set type (name) {

        internals.meta.set(this, name);
    };

    static get type () {

        return this.name || internals.meta.get(this);
    };

    static get meta () {

        return {
            has: (key) => internals.meta.has(this) && internals.meta.get(this).hasOwnProperty(key),
            get: (key) => internals.meta.has(this) ? internals.meta.get(this)[key] : undefined,
            set: (key, val) => {

                let meta = internals.meta.get(this) || {};
                meta[key] = val;
                internals.meta.set(this, meta);
            }
        };
    };

    static mixin () {

        let mixins = Array.from(arguments);
        class model extends Model {};
        for (let i = 0, il = mixins.length; i < il; ++i) {
            let mixin = mixins[i];
            model = mixin(model);
        }

        return model;
    };
};

Object.defineProperty(Model, 'capabilities', {
    value: new Set()
});

module.exports = Model;
