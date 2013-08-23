backbone.flashback
==================

A simple undo/redo manager for Backbone Models and Collections.

About
===

Requirements
---
Backbone.Flashback depends on Underscore and Backbone. For Flashback to work, models must have unique ids assigned to them.

Usage
===

The following code examples assume this boilerplate code:

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

Methods
===

`begin(target)`
---
Begins tracking changes to the `target`.

The `target` can be a Backbone Model or Collection, or an array of Models or Collections.


`end()`
---
Stops tracking the `target` and saves its current state if any changes were made to `target` since `begin()` was called.

`save(target)`
---

Saves a snapshot of the current state of the `target` and deletes all states stored in the redo stack.

`undo()`
---

Undoes the last saved history state.

`redo()`
---

Restores the last undone history state.
