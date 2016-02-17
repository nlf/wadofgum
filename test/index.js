'use strict';

const Model = require('..');

const lab = exports.lab = require('lab').script();
const expect = require('code').expect;
const it = lab.test;

it('can create a model instance', (done) => {

  class User extends Model {};
  const user = new User({ someflag: true, schema: 'hi' });
  expect(user).to.exist();
  expect(user.schema).to.equal('hi');
  expect(user.someflag).to.equal(true);
  done();
});

it('can create model instance with no options', (done) => {

  class User extends Model {};
  const user = new User();
  expect(Object.keys(user).length).to.equal(0);
  done();
});

it('can use capabilities', (done) => {

  class User extends Model {};
  User.capabilities.add('derp');
  const user = new User();
  expect(user.capabilities.has('derp')).to.equal(true);
  done();
});

it('can extend a class with a mixin', (done) => {

  const mixin = function (baseClass) {

    class SubModel extends baseClass {

      static extended () {

        return true;
      };
    };

    return SubModel;
  };

  class User extends Model.mixin(mixin) {};
  expect(User).to.exist();
  expect(User.extended()).to.equal(true);
  done();
});

it('can extend a class with multiple mixins', (done) => {

  const mixin = function (baseClass) {

    class SubModel extends baseClass {

      static extended () {

        return true;
      };
    };

    return SubModel;
  };

  const mixin2 = function (baseClass) {

    class SubModel extends baseClass {

      static extendedAgain () {

        return true;
      }
    };

    return SubModel;
  };

  class User extends Model.mixin(mixin, mixin2) {};
  expect(User).to.exist();
  expect(User.extended()).to.equal(true);
  expect(User.extendedAgain()).to.equal(true);
  done();
});
