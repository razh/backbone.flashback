/*globals describe, beforeEach, it, expect*/
(function( _, Backbone, undefined ) {
  'use strict';

  describe( 'Flashback - API.', function() {

    var Flashback = Backbone.Flashback;

    var Model = Backbone.Model.extend({
      defaults: function() {
        return {
          id: _.uniqueId(),
          foo: null
        };
      }
    });

    var Collection = Backbone.Collection.extend({
      model: Model
    });

    var manager;

    beforeEach(function() {
      manager = new Flashback();
    });

    it( 'clear() empties the history stacks', function() {
      var model = new Model({
        foo: 10
      });

      manager.save( model );
      model.set( 'foo', 200 );
      manager.save( model );

      manager.undo();
      expect( manager.redoStack.length ).toBe(1);

      manager.clear();
      expect( manager.undoStack.length ).toBe(0);
      expect( manager.redoStack.length ).toBe(0);

      // Redo does nothing.
      manager.redo();
      expect( model.get( 'foo' ) ).toBe( 10 );
    });

    it( 'begin() and end() allow combining multiple minor edits into a single state', function() {
      var model = new Model({
        foo: 10
      });

      manager.begin( model );
      model.set( 'foo', 30 );
      model.set( 'foo', 50 );
      model.set( 'foo', 100 );
      manager.end();

      expect( manager.current.length ).toBe(1);
      expect( model.get( 'foo' ) ).toBe( 100 );

      manager.undo();
      expect( model.get( 'foo' ) ).toBe( 10 );

      // Doesn't do anything.
      manager.undo();
      expect( model.get( 'foo' ) ).toBe( 10 );

      manager.redo();
      expect( model.get( 'foo' ) ).toBe( 100 );
    });

    it( 'begin()/end() do not save states when there are no changes', function() {
      var collection = new Collection([
        { foo: 10, bar: 'a' },
        { foo: 20, bar: 'b' }
      ]);

      // Note: begin() will save this collection state as a baseline.
      manager.begin( collection );
      collection.at(0).set( 'foo', 30 );
      collection.at(0).set( 'foo', 10 );
      manager.end();

      expect( manager.current ).toBe( null );
      expect( manager.undoStack.length ).toBe(0);
    });

    it( 'canUndo()/canRedo()', function() {
      spyOn( manager, 'undo' ).andCallThrough();
      spyOn( manager, 'redo' ).andCallThrough();

      var model = new Model({
        foo: 10
      });

      manager.save( model );

      model.set( 'foo', 20 );
      manager.save( model );

      model.set( 'foo', 30 );
      manager.save( model );

      model.set( 'foo', 40 );
      manager.save( model );

      while ( manager.canUndo() ) {
        manager.undo();
      }

      expect( model.get( 'foo' ) ).toBe( 10 );
      expect( manager.undo.calls.length ).toBe(3);

      while ( manager.canRedo() ) {
        manager.redo();
      }

      expect( model.get( 'foo' ) ).toBe( 40 );
      expect( manager.redo.calls.length ).toBe(3);
    });
  });
}) ( _, Backbone );
