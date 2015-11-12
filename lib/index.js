'use strict';

const internals = {
    meta: new WeakMap()
};

class Model {
    constructor(fields) {

        fields = fields || {};
        for (const key in fields) {
            this[key] = fields[key];
        }
    };

    static set type(name) {

        internals.meta.set(this, name);
    };

    static get type() {

        return this.name || internals.meta.get(this);
    };

    static get meta() {

        return {
            has: (key) => internals.meta.has(this) && internals.meta.get(this).hasOwnProperty(key),
            get: (key) => {

                if (!internals.meta.has(this)) {
                    return undefined;
                }

                return internals.meta.get(this)[key];
            },
            set: (key, val) => {

                const meta = internals.meta.get(this) || {};
                meta[key] = val;
                internals.meta.set(this, meta);
            }
        };
    };

    static mixin() {

        const mixins = Array.from(arguments);
        class model extends Model {};
        for (let i = 0; i < mixins.length; ++i) {
            const mixin = mixins[i];
            model = mixin(model);
        }

        return model;
    };
};

Object.defineProperty(Model, 'capabilities', {
    value: new Set()
});

module.exports = Model;
