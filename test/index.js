'use strict';

const Model = require('..');

const lab = exports.lab = require('lab').script();
const expect = require('code').expect;
const it = lab.test;

it('can create a model instance', (done) => {

    class User extends Model {};
    const user = new User({ name: 'test', age: '30' });
    expect(user).to.exist();
    expect(user.name).to.equal('test');
    expect(user.age).to.equal('30');
    done();
});

it('can set and get type property', (done) => {

    const Test = class extends Model {};
    Test.type = 'test';
    expect(Test.type).to.equal('test');
    class User extends Model {};
    expect(User.type).to.equal('User');
    done();
});

it('can create an instance with no fields', (done) => {

    class User extends Model {};
    const user = new User();
    expect(Object.keys(user).length).to.equal(0);
    done();
});

it('can set metadata on a class', (done) => {

    class User extends Model {};
    User.meta.set('key', 'value');
    expect(User.meta.get('key')).to.equal('value');
    User.meta.set('object', { some: 'thing' });
    expect(User.meta.get('object')).to.deep.equal({ some: 'thing' });
    done();
});

it('can see if a key exists in metadata', (done) => {

    class User extends Model {};
    expect(User.meta.has('key')).to.equal(false);
    User.meta.set('key', 'value');
    expect(User.meta.has('key')).to.equal(true);
    done();
});

it('returns undefined when getting metadata that has not been set', (done) => {

    class User extends Model {};
    expect(User.meta.get('test')).to.not.exist();
    done();
});

it('can extend a class with a mixin', (done) => {

    const mixin = function (baseClass) {

        class SubModel extends baseClass {

            static extended() {

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

            static extended() {

                return true;
            };
        };

        return SubModel;
    };

    const mixin2 = function (baseClass) {

        class SubModel extends baseClass {

            static extendedAgain() {

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
