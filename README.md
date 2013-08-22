backbone.flashback
==================

A simple undo/redo manager for Backbone Models and Collections.

Usage
===

    var history = new Backbone.Flashback();
    var model = new Backbone.Model({ foo: 'foo' });

    history.begin(model);
    model.set('foo', 'bar');
    history.end();

    model.get('foo'); // 'bar'

    history.undo();
    model.get('foo'); // 'foo'

    history.redo();
    model.get('foo'); // 'bar'

Methods
===

`begin(target)`
---
Begins tracking changes to the `target`.

The `target` can be a Backbone Model or Collection, or an array of Models or Collections.


`end()`
---
Stops tracking the target, saving the current state of the target if any changes were made since `begin()` was called.

`save(target)`
---

Saves a snapshot of the current state of the target and deletes all states stored in the redo stack.

`undo()`
---

Undoes the last saved history state.

`redo()`
---

Redoes the last undone history state.
