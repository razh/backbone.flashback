/*globals describe, beforeEach, it, expect*/
(function( _, Backbone, undefined ) {
  'use strict';

  describe( 'Flashback - Models.', function() {

    var Flashback = Backbone.Flashback,
        Mememto   = Flashback.Memento;

    var Model = Backbone.Model.extend({
      defaults: function() {
        return {
          id: _.uniqueId(),
          foo: null,
          bar: null
        };
      }
    });

    var manager, model;

    beforeEach(function() {
      manager = new Flashback();

      model = new Model({
        foo: 10,
        bar: 20
      });
    });

    it( 'save the state of a model', function() {
      manager.save( model );
      model.set( 'foo', 200 );
      manager.save( model );
      manager.undo();

      // foo has its old value.
      expect( model.get( 'foo' ) ).toBe( 10 );
      // But not bar.
      expect( model.get( 'bar' ) ).toBe( 20 );

      // Nothing happens.
      manager.undo();
      expect( model.get( 'foo' ) ).toBe( 10 );
    });

    it( 'redo an undone state of a Model', function() {
      manager.save( model );

      model.set( 'foo', 200 );
      manager.save( model );

      manager.undo();
      expect( model.get( 'foo' ) ).toBe( 10 );

      // foo has its new value.
      manager.redo();
      expect( model.get( 'foo' ) ).toBe( 200 );

      // Nothing happens.
      manager.redo();
      expect( model.get( 'foo' ) ).toBe( 200 );
    });

    it( 'multiple undos and redos', function() {
      manager.save( model );
      model.set( 'foo', 200 );
      manager.save( model );
      model.set( 'foo', 300 );
      manager.save( model );

      // Undo.
      expect( model.get( 'foo' ) ).toBe( 300 );
      manager.undo();
      expect( model.get( 'foo' ) ).toBe( 200 );
      manager.undo();
      expect( model.get( 'foo' ) ).toBe( 10 );

      expect( manager.redoStack.length ).toBe( 2 );

      // Redo.
      manager.redo();
      expect( model.get( 'foo' ) ).toBe( 200 );
      manager.redo();
      expect( model.get( 'foo' ) ).toBe( 300 );

      // Undo and redo.
      manager.undo();
      expect( model.get( 'foo' ) ).toBe( 200 );
      manager.redo();
      expect( model.get( 'foo' ) ).toBe( 300 );

      manager.undo();
      expect( model.get( 'foo' ) ).toBe( 200 );
      manager.undo();
      expect( model.get( 'foo' ) ).toBe( 10 );
      manager.redo();
      expect( model.get( 'foo' ) ).toBe( 200 );
      manager.redo();
      expect( model.get( 'foo' ) ).toBe( 300 );
    });

    it( 'save() erases future redo states if in the past', function() {
      manager.save( model );
      model.set( 'foo', 200 );
      manager.save( model );
      manager.undo();

      model.set( 'foo', 100 );
      manager.save( model );

      // Redo does nothing.
      manager.redo();
      expect( model.get( 'foo' ) ).toBe( 100 );
    });
  });
}) ( _, Backbone );
