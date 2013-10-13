backbone.flashback
==================

A simple undo/redo manager for Backbone Models and Collections.

Usage
===
Boilerplate code for the following code examples:
```javascript
var manager = new Backbone.Flashback();

var Model = Backbone.Model.extend({
  defaults: function() {
    return {
      id: _.uniqueId(),
      foo: ''
    };
  }
});

var Collection = Backbone.Collection.extend({
  model: Model
});
```

Models
---
```javascript
var model = new Model({ foo: 'a' });

manager.begin(model);
model.set('foo', 'b');
manager.end();

model.get('foo'); // 'b'

manager.undo();
model.get('foo'); // 'a'

manager.redo();
model.get('foo'); // 'b'
```

Collections
---
```javascript
var collection = new Collection([
  { foo: 'a' },
  { foo: 'b' }
]);

// Change the first model.
manager.begin(collection);
collection.at(0).set('foo', 'c');
manager.end();

manager.begin(collection);
collection.remove(collection.at(0));
manager.end();

collection.pluck('foo'); // ['b']

manager.undo();
collection.pluck('foo'); // ['c', 'b']

manager.undo();
collection.pluck('foo'); // ['a', 'b']

manager.redo();
collection.pluck('foo'); // ['c', 'b']
```

Arrays of Models
---
```javascript
var models = [
  new Model({ foo: 'a' }),
  new Model({ foo: 'b' })
];

manager.begin(models);
models[0].set('foo', 'c');
models[1].set('foo', 'd');
manager.end();

// ['c', 'd'], given:
models.map(function(model) { return model.get('foo'); })

manager.undo();
// ['a', 'b']

manager.redo();
// ['c', 'd']
```

Requirements
---
Backbone.Flashback depends on [Underscore](https://github.com/jashkenas/underscore/) and [Backbone](https://github.com/jashkenas/backbone/). For Flashback to work, models must have unique ids assigned to them.

If you're using [RequireJS](https://github.com/jrburke/requirejs), you'll need to shim Flashback and its dependencies:
```javascript
requirejs.config({
  shim: {
    'underscore': {
      exports: '_'
    },
    'backbone': {
      deps: ['jquery', 'underscore'],
      exports: 'Backbone'
    },
    'flashback': {
      deps: ['underscore', 'backbone'],
      exports: 'Backbone.Flashback'
    }
  },

  paths: {
    'jquery': 'path/to/jquery',
    'underscore': 'path/to/underscore',
    'backbone': 'path/to/backbone',
    'flashback': 'path/to/flashback'
  }
});

define(['flashback'], function(Flashback) {
  var manager = new Flashback();
});
```

Methods
===

`manager.begin(target)`
---
Begin tracking changes to the `target`.

The `target` can be a Backbone Model or Collection, or an array of Models or Collections.

`manager.end()`
---
Stop tracking the `target` and call `save()` on its current state if any changes were made to `target` since `begin()` was called.

`manager.save(target)`
---
Save a snapshot of the current state of the `target` and deletes all states stored in the redo stack.

`manager.undo()`
---
Undo the last saved history state.

`manager.redo()`
---
Restore the last undone history state.

`manager.canUndo()`
---
Return the number of states currently on the undo stack.

`manager.canRedo()`
---
Return the number of states currently on the redo stack.

Development
===

Install [NodeJS](https://github.com/joyent/node). If you have [Homebrew](http://brew.sh/):

    brew install node

Install [Grunt](https://github.com/gruntjs/grunt-cli).

    npm install -g grunt-cli

Install project dependencies.

    npm install

Install [Karma](https://github.com/karma-runner/karma) and [PhantomJS](https://github.com/ariya/phantomjs).

    npm install -g karma
    npm install -g phantomjs

Or, if you have Homebrew:

    brew install phantomjs


Building
---

    grunt

This will run [JSHint](https://github.com/jshint/jshint), execute all tests, and minify with [UglifyJS2](https://github.com/mishoo/UglifyJS2).


Running tests
---
Flashback uses [Karma](https://github.com/karma-runner/karma) (v0.10) with the [Jasmine](http://pivotal.github.io/jasmine/) testing framework and [PhantomJS](https://github.com/ariya/phantomjs) for headless testing.

To run tests with the `autoWatch` option on, where Karma will watch for file changes and run tests automatically:

    karma start

You can also run tests via Grunt tasks.

Equivalent to `karma start`:

    grunt karma:unit

Run tests once, for continuous integration:

    grunt karma:continuous

Run tests in Chrome:

    grunt karma:browser

License
---
MIT.
