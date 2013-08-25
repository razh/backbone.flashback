/*globals describe, beforeEach, it, expect*/
(function( _, Backbone, undefined ) {
  'use strict';

  /**
   * Check if edits on heterogeneous data types produce valid histories.
   */
  describe( 'Flashback — Sequence of edits.', function() {

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

    var Collection = Backbone.Collection.extend({
      model: Model
    });

    var collection, manager;

    beforeEach(function() {
      manager = new Backbone.Flashback();

      collection = new Collection([
        { foo: 'a', bar: 'b' },
        { foo: 'c', bar: 'd' },
        { foo: 'e', bar: 'f' }
      ]);
    });

    it( 'editing a model and then a collection', function() {
      var model0 = collection.at(0),
          id0    = collection.at(0).id;

      manager.begin( model0 );
      model0.set( 'foo', 1 );
      manager.end();

      manager.begin( collection );
      collection.remove( model0 );
      manager.end();

      expect( collection.length ).toBe(2);

      manager.undo();
      expect( collection.length ).toBe(3);
      expect( collection.get( id0 ).get( 'foo' ) ).toBe(1);

      manager.undo();
      expect( collection.get( id0 ).get( 'foo' ) ).toBe( 'a' );

      manager.redo();
      expect( collection.get( id0 ).get( 'foo' ) ).toBe(1);

      manager.redo();
      expect( collection.get( id0 ) ).toBe( undefined );
    });

    it( 'editing a collection and then a model', function() {
      var id0 = collection.at(0).id,
          id1 = collection.at(1).id;

      // Add a model.
      manager.begin( collection );
      collection.add({
        foo: 'g',
        bar: 'h'
      });
      manager.end();

      // Remove a model.
      manager.begin( collection );
      collection.remove( collection.at(0) );
      manager.end();

      // Change a model.
      expect( collection.at(0).id ).toBe( id1 );
      manager.begin( collection.at(0) );
      collection.at(0).set( 'foo', 'x' );
      manager.end();

      manager.undo();
      expect( collection.size() ).toBe(3);
      expect( collection.get( id1 ).get( 'foo' ) ).toBe( 'c' );
      expect( collection.get( id0 ) ).toBe( undefined );

      manager.undo();
      expect( collection.size() ).toBe(4);
      expect( collection.get( id0 ).get( 'foo' ) ).toBe( 'a' );

      manager.undo();
      expect( collection.size() ).toBe(3);

      manager.redo();
      expect( collection.size() ).toBe(4);
      expect( collection.get( id0 ).get( 'foo' ) ).toBe( 'a' );

      manager.redo();
      expect( collection.size() ).toBe(3);
      expect( collection.get( id0 ) ).toBe( undefined );
      expect( collection.get( id1 ).get( 'foo' ) ).toBe( 'c' );

      manager.redo();
      expect( collection.get( id1 ).get( 'foo' ) ).toBe( 'x' );
    });

    it( 'editing a model and then an array of models', function() {
      var model0 = collection.at(0),
          model1 = collection.at(1),
          model2 = collection.at(2);

      // Edit the first model.
      manager.begin( model0 );
      model0.set( 'foo', 1 );
      manager.end();

      // The current state has one memento.
      expect( manager.current.length ).toBe(1);
      expect( model0.get( 'foo' ) ).toBe(1);

      manager.undo();
      expect( model0.get( 'foo' ) ).toBe( 'a' );

      manager.redo();
      expect( model0.get( 'foo' ) ).toBe(1);

      // Now edit the second and third models.
      var array = collection.slice( 1, 3 );

      manager.begin( array );
      array[0].set( 'foo', 2 );
      array[1].set( 'foo', 3 );
      manager.end();

      expect( model0.get( 'foo' ) ).toBe(1);
      expect( model1.get( 'foo' ) ).toBe(2);
      expect( model2.get( 'foo' ) ).toBe(3);

      manager.undo();
      expect( model0.get( 'foo' ) ).toBe(1);
      expect( model1.get( 'foo' ) ).toBe( 'c' );
      expect( model2.get( 'foo' ) ).toBe( 'e' );

      manager.undo();
      expect( model0.get( 'foo' ) ).toBe( 'a' );
      expect( model1.get( 'foo' ) ).toBe( 'c' );
      expect( model2.get( 'foo' ) ).toBe( 'e' );

      manager.redo();
      expect( model0.get( 'foo' ) ).toBe(1);
      expect( model1.get( 'foo' ) ).toBe( 'c' );
      expect( model2.get( 'foo' ) ).toBe( 'e' );

      manager.redo();
      expect( model0.get( 'foo' ) ).toBe(1);
      expect( model1.get( 'foo' ) ).toBe(2);
      expect( model2.get( 'foo' ) ).toBe(3);
    });

    it( 'editing an array of models and then each model', function() {
      var model0 = collection.at(0),
          model1 = collection.at(1);

      // Select the first two elements.
      var array = collection.slice( 0, 2 );

      manager.begin( array );
      array[0].set( 'foo', 1 );
      array[1].set( 'foo', 2 );
      manager.end();

      manager.begin( model0 );
      model0.set( 'foo', 3 );
      manager.end();

      manager.begin( model1 );
      model1.set( 'foo', 4 );
      manager.end();

      expect( model0.get( 'foo' ) ).toBe(3);
      expect( model1.get( 'foo' ) ).toBe(4);

      manager.undo();
      expect( model0.get( 'foo' ) ).toBe(3);
      expect( model1.get( 'foo' ) ).toBe(2);

      manager.undo();
      expect( model0.get( 'foo' ) ).toBe(1);
      expect( model1.get( 'foo' ) ).toBe(2);

      manager.undo();
      expect( model0.get( 'foo' ) ).toBe( 'a' );
      expect( model1.get( 'foo' ) ).toBe( 'c' );

      manager.redo();
      expect( model0.get( 'foo' ) ).toBe(1);
      expect( model1.get( 'foo' ) ).toBe(2);

      manager.redo();
      expect( model0.get( 'foo' ) ).toBe(3);
      expect( model1.get( 'foo' ) ).toBe(2);

      manager.redo();
      expect( model0.get( 'foo' ) ).toBe(3);
      expect( model1.get( 'foo' ) ).toBe(4);
    });
  });
}) ( _, Backbone );
