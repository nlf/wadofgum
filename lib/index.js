'use strict';

let defineCapabilities;

class Model {

  constructor ( options ) {

    options = options || {};
    Object.defineProperty(this, 'meta', {
      value: {},
      enumerable: false
    });

    for (const key of Object.keys(options)) {
      this[key] = options[key];
    }
    defineCapabilities(this);
  }

  static mixin () {

    const mixins = Array.from(arguments);
    class model extends Model {}

    for (let i = 0; i < mixins.length; ++i) {
      const mixin = mixins[i];
      model = mixin(model);
    }

    return model;
  }
};

defineCapabilities = (obj) => {

  Object.defineProperty(obj, 'capabilities', {
    get: () => {

      return Model.constructor.prototype.capabilities;
    },
    enumerable: false
  });
};

Model.constructor.prototype.capabilities = new Set();
defineCapabilities(Model);

module.exports = Model;
