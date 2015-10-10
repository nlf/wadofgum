'use strict';

let Model = require('..');

let lab = exports.lab = require('lab').script();
let expect = require('code').expect;
let it = lab.test;

it('can create a model instance', function (done) {

    class User extends Model {};
    let user = new User({ name: 'test', age: '30' });
    expect(user).to.exist();
    expect(user.name).to.equal('test');
    expect(user.age).to.equal('30');
    done();
});

it('can create an instance with no fields', function (done) {

    class User extends Model {};
    let user = new User();
    expect(Object.keys(user).length).to.equal(0);
    done();
});

it('can set metadata on a class', function (done) {

    class User extends Model {};
    User.meta.set('key', 'value');
    expect(User.meta.get('key')).to.equal('value');
    User.meta.set('object', { some: 'thing' });
    expect(User.meta.get('object')).to.deep.equal({ some: 'thing' });
    done();
});

it('can see if a key exists in metadata', function (done) {

    class User extends Model {};
    expect(User.meta.has('key')).to.equal(false);
    User.meta.set('key', 'value');
    expect(User.meta.has('key')).to.equal(true);
    done();
});

it('returns undefined when getting metadata that has not been set', function (done) {

    class User extends Model {};
    expect(User.meta.get('test')).to.not.exist();
    done();
});

it('can extend a class with a mixin', function (done) {

    let mixin = function (baseClass) {

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

it('can extend a class with multiple mixins', function (done) {

    let mixin = function (baseClass) {

        class SubModel extends baseClass {

            static extended () {

                return true;
            };
        };

        return SubModel;
    };

    let mixin2 = function (baseClass) {

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
