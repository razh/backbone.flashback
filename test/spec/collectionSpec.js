/*globals describe, beforeEach, it, expect*/
(function( _, Backbone, undefined ) {
  'use strict';

  describe( 'Flashback - Collections.', function() {

    var Flashback = Backbone.Flashback,
        Memento   = Flashback.Memento;

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

    var collection, manager;

    beforeEach(function() {
      manager = new Flashback();

      collection = new Collection([
        { foo: 10, bar: 50 },
        { foo: 20, bar: 60 },
        { foo: 30, bar: 70 },
        { foo: 40, bar: 80 }
      ]);
    });

    it( 'restoring a collection from a memento may change element order', function() {
      var model0JSON = collection.at(0).toJSON();

      var id0 = collection.at(0).id,
          id1 = collection.at(1).id,
          id2 = collection.at(2).id,
          id3 = collection.at(3).id;

      expect( collection.at(0).id ).toBe( id0 );
      expect( collection.get( id0 ) ).toBe( collection.at(0) );
      expect( collection.pluck( 'id' ) ).toEqual( [ id0, id1, id2, id3 ] );

      var memento = new Memento( collection );
      collection.remove( collection.at(0) );

      memento.restore();
      expect( collection.pluck( 'id' ) ).toEqual( [ id1, id2, id3, id0 ] );
      expect( collection.get( id0 ).toJSON() ).toEqual( model0JSON );
    });

    it( 'restoring a collection from a memento does not change ids', function() {
      var test = new Model({ id: 'test' });
      expect( test.id ).toBe( 'test' );

      var id0 = collection.at(0).id;
      expect( collection.get( id0 ) ).toBe(collection.at(0));

      collection.set( collection.toJSON() );
      expect( collection.at(0).id ).toBe( id0 );

      var memento = new Memento( collection );
      expect( memento.state[0].id ).toBe( id0 );
      memento.restore();
      expect( collection.at(0).id ).toBe( id0 );
    });

    it( 'save the state of a collection', function() {
      var model0 = collection.at(0),
          model1 = collection.at(1),
          model2 = collection.at(2);

      var id0 = model0.id,
          id1 = model1.id,
          id2 = model2.id;

      expect( collection.length ).toBe(4);

      manager.save( collection );
      collection.remove( collection.at(0) );
      manager.save( collection );

      expect( collection.length ).toBe(3);
      // It no longer exists in the array.
      expect( typeof collection.get( id0 ) ).toBe( 'undefined' );

      manager.undo();
      // Check if ids are the same.
      expect( collection.get( id0 ).id ).toBe( id0 );
      expect( collection.get( id1 ).id ).toBe( id1 );
      // Check if values are the same.
      expect( collection.get( id0 ).get( 'foo' ) ).toBe( 10 );
      expect( collection.get( id1 ).get( 'foo' ) ).toBe( 20 );
      expect( collection.length ).toBe(4);

      manager.redo();
      expect( collection.at(0).id ).toBe( id1 );
      expect( collection.at(1).id ).toBe( id2 );
      expect( collection.at(0).get( 'foo' ) ).toBe( 20 );
      expect( collection.at(1).get( 'foo' ) ).toBe( 30 );
      expect( collection.length ).toBe(3);
    });

    it( 'mementos maintain references to models after collection addition/removal', function() {
      var id0 = collection.at(0).id;

      manager.save( collection.at(0) );
      collection.at(0).set( 'foo', 200 );
      manager.save( collection.at(0) );

      manager.save( collection );
      collection.remove( collection.at(0) );
      manager.save( collection );

      manager.undo();
      expect( collection.length ).toBe(4);

      manager.undo();
      expect( collection.get( id0 ).get( 'foo' ) ).toBe( 200 );
      manager.undo();
      expect( collection.get( id0 ).get( 'foo' ) ).toBe( 10 );
    });

    it( 'batch-saving of multiple models at once', function() {
      expect( collection.at(0).get( 'foo' ) ).toBe( 10 );
      // Attempt to save an array.
      manager.save( collection.models );

      collection.at(0).set( 'foo', 200 );
      collection.at(1).set( 'foo', 210 );
      manager.save( collection.models );

      manager.undo();
      expect( collection.at(0).get( 'foo' ) ).toBe( 10 );
      expect( collection.at(1).get( 'foo' ) ).toBe( 20 );

      manager.redo();
      expect( collection.at(0).get( 'foo' ) ).toBe( 200 );
      expect( collection.at(1).get( 'foo' ) ).toBe( 210 );
    });

    it( 'batch-saving of multiple collections at once', function() {
      var tempCollection = new Collection([
        { foo: 217, bar: 300 },
        { foo: 'b', bar: 'c' }
      ]);

      var rect1 = tempCollection.at(1);

      manager.begin( rect1 );
      rect1.set( 'foo', 123 );
      manager.end();

      manager.begin( [ collection, tempCollection ] );
      collection.remove( collection.at(0) );
      tempCollection.remove( rect1 );
      manager.end();

      expect( collection.length ).toBe(3);
      expect( tempCollection.length ).toBe(1);
      expect( tempCollection.at(0).get( 'foo' ) ).toBe( 217 );

      manager.undo();
      expect( collection.length ).toBe(4);
      expect( tempCollection.length ).toBe(2);
      expect( tempCollection.at(1).get( 'foo' ) ).toBe( 123 );

      manager.undo();
      expect( collection.length ).toBe(4);
      expect( tempCollection.length ).toBe(2);
      expect( tempCollection.at(1).get( 'foo' ) ).toBe( 'b' );

      manager.redo();
      expect( collection.length ).toBe(4);
      expect( tempCollection.length ).toBe(2);
      expect( tempCollection.at(1).get( 'foo' ) ).toBe( 123 );

      manager.redo();
      expect( collection.length ).toBe(3);
      expect( tempCollection.length ).toBe(1);
      expect( tempCollection.at(0).get( 'foo' ) ).toBe( 217 );
    });
  });
}) ( _, Backbone );
