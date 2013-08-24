backbone.flashback
==================

A simple undo/redo manager for Backbone Models and Collections.

About
===

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

// On undo, the first model is restored to the end of the collection.
// Hence, why the result is ['b', 'c'] instead of ['c', 'b'].
manager.undo();
collection.pluck('foo'); // ['b', 'c']

manager.undo();
collection.pluck('foo'); // ['b', 'a']

manager.redo();
collection.pluck('foo'); // ['b', 'c']
```

By default, order is **not** maintained when deleted models are restored to collections. Backbone will keep your models sorted if you define a `comparator` function on the collection.

```javascript
var collection = new Collection();

// For example, if your model's idAttribute is an integer represented as a string:
collection.comparator = function(model) {
  return parseInt(model.id, 10);
};
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

Methods
===

`begin(target)`
---
Begins tracking changes to the `target`.

The `target` can be a Backbone Model or Collection, or an array of Models or Collections.


`end()`
---
Stops tracking the `target` and call `save()` on its current state if any changes were made to `target` since `begin()` was called.


`save(target)`
---
Saves a snapshot of the current state of the `target` and deletes all states stored in the redo stack.


`undo()`
---
Undoes the last saved history state.


`redo()`
---
Restores the last undone history state.


`canUndo()`
---
Returns the number of states currently on the undo stack.


`canRedo()`
---
Returns the number of states currently on the redo stack.
