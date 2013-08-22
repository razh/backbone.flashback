/*globals describe, beforeEach, it, expect*/
(function( _, Backbone, undefined ) {
  'use strict';

  describe( 'History', function() {

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

    var history;

    describe( 'Backbone.Model', function() {

      var model;

      beforeEach(function() {
        history = new Flashback.History();

        model = new Model({
          foo: 10,
          bar: 20
        });
      });

      it( 'saves the state of a Backbone.Model', function() {
        history.save( model );
        model.set( 'foo', 200 );
        history.save( model );
        history.undo();

        // foo has its old value.
        expect( model.get( 'foo' ) ).toBe( 10 );
        // But not bar.
        expect( model.get( 'bar' ) ).toBe( 20 );

        // Nothing happens.
        history.undo();
        expect( model.get( 'foo' ) ).toBe( 10 );
      });

      it( 'redoes an undone state of a Model', function() {
        history.save( model );

        model.set( 'foo', 200 );
        history.save( model );

        history.undo();
        expect( model.get( 'foo' ) ).toBe( 10 );

        history.redo();
        // foo has its new value.
        expect( model.get( 'foo' ) ).toBe( 200 );

        // Nothing happens.
        history.redo();
        expect( model.get( 'foo' ) ).toBe( 200 );
      });

      it( 'multiple undos and redos', function() {
        history.save( model );
        model.set( 'foo', 200 );
        history.save( model );
        model.set( 'foo', 300 );
        history.save( model );

        // Undo.
        expect( model.get( 'foo' ) ).toBe( 300 );
        history.undo();
        expect( model.get( 'foo' ) ).toBe( 200 );
        history.undo();
        expect( model.get( 'foo' ) ).toBe( 10 );

        expect( history.redoStack.length ).toBe( 2 );

        // Redo.
        history.redo();
        expect( model.get( 'foo' ) ).toBe( 200 );
        history.redo();
        expect( model.get( 'foo' ) ).toBe( 300 );

        // Undo and redo.
        history.undo();
        expect( model.get( 'foo' ) ).toBe( 200 );
        history.redo();
        expect( model.get( 'foo' ) ).toBe( 300 );

        history.undo();
        expect( model.get( 'foo' ) ).toBe( 200 );
        history.undo();
        expect( model.get( 'foo' ) ).toBe( 10 );
        history.redo();
        expect( model.get( 'foo' ) ).toBe( 200 );
        history.redo();
        expect( model.get( 'foo' ) ).toBe( 300 );
      });

      it( 'save() erases future redo history if in the past', function() {
        history.save( model );
        model.set( 'foo', 200 );
        history.save( model );
        history.undo();

        model.set( 'foo', 100 );
        history.save( model );

        // Redo does nothing.
        history.redo();
        expect( model.get( 'foo' ) ).toBe( 100 );
      });
    });


    describe( 'Backbone.Collection', function() {

      var collection;

      beforeEach(function() {
        history = new Flashback.History();

        collection = new Collection([
          { foo: 10, bar: 50 },
          { foo: 20, bar: 60 },
          { foo: 30, bar: 70 },
          { foo: 40, bar: 80 }
        ]);
      });

      it( 'restoring a Backbone.Collection from a memento may change element order', function() {
        var model0JSON = collection.at(0).toJSON();

        var id0 = collection.at(0).id,
            id1 = collection.at(1).id,
            id2 = collection.at(2).id,
            id3 = collection.at(3).id;

        expect( collection.at(0).id ).toBe( id0 );
        expect( collection.get( id0 ) ).toBe( collection.at(0) );
        expect( collection.pluck( 'id' ) ).toEqual( [ id0, id1, id2, id3 ] );

        var memento = new Mememto( collection );
        collection.remove( collection.at(0) );
        memento.restore();
        expect( collection.pluck( 'id' ) ).toEqual( [ id1, id2, id3, id0 ] );
        expect( collection.get( id0 ).toJSON() ).toEqual( model0JSON );
      });

      it( 'restoring a Backbone.Collection from a memento does not change ids', function() {
        var test = new Model({ id: 'test' });
        expect( test.id ).toBe( 'test' );

        var id0 = collection.at(0).id;
        expect( collection.get( id0 ) ).toBe(collection.at(0));

        collection.set( collection.toJSON() );
        expect( collection.at(0).id ).toBe( id0 );

        var memento = new Mememto( collection );
        expect( memento.state[0].id ).toBe( id0 );
        memento.restore();
        expect( collection.at(0).id ).toBe( id0 );
      });

      it( 'saves the state of a Backbone.Collection', function() {
        var model0 = collection.at(0),
            model1 = collection.at(1),
            model2 = collection.at(2);

        var id0 = model0.id,
            id1 = model1.id,
            id2 = model2.id;

        expect( collection.length ).toBe(4);
        history.save( collection );

        collection.remove( collection.at(0) );
        expect( collection.length ).toBe(3);
        // It no longer exists in the array.
        expect( typeof collection.get( id0 ) ).toBe( 'undefined' );
        history.save( collection );

        history.undo();
        // Check if ids are the same.
        expect( collection.get( id0 ).id ).toBe( id0 );
        expect( collection.get( id1 ).id ).toBe( id1 );
        // Check if values are the same.
        expect( collection.get( id0 ).get( 'foo' ) ).toBe( 10 );
        expect( collection.get( id1 ).get( 'foo' ) ).toBe( 20 );
        expect( collection.length ).toBe(4);

        history.redo();
        expect( collection.at(0).id ).toBe( id1 );
        expect( collection.at(1).id ).toBe( id2 );
        expect( collection.at(0).get( 'foo' ) ).toBe( 20 );
        expect( collection.at(1).get( 'foo' ) ).toBe( 30 );
        expect( collection.length ).toBe(3);
      });

      it( 'mementos maintain references to models after collection addition/removal', function() {
        var id0 = collection.at(0).id;
        history.save( collection.at(0) );
        collection.at(0).set( 'foo', 200 );
        history.save( collection.at(0) );

        history.save( collection );
        collection.remove( collection.at(0) );
        history.save( collection );

        history.undo();
        expect( collection.length ).toBe(4);

        history.undo();
        expect( collection.get( id0 ).get( 'foo' ) ).toBe( 200 );
        history.undo();
        expect( collection.get( id0 ).get( 'foo' ) ).toBe( 10 );
      });

      it( 'batch-saving of multiple models at once', function() {
        expect( collection.at(0).get( 'foo' ) ).toBe( 10 );
        // Attempt to save an array.
        history.save( collection.models );

        collection.at(0).set( 'foo', 200 );
        collection.at(1).set( 'foo', 210 );
        history.save( collection.models );

        history.undo();
        expect( collection.at(0).get( 'foo' ) ).toBe( 10 );
        expect( collection.at(1).get( 'foo' ) ).toBe( 20 );

        history.redo();
        expect( collection.at(0).get( 'foo' ) ).toBe( 200 );
        expect( collection.at(1).get( 'foo' ) ).toBe( 210 );
      });

      it( 'batch-saving of multiple collections at once', function() {
        var tempCollection = new Collection([
          { foo: 217, bar: 300 },
          { foo: 'b', bar: 'c' }
        ]);

        var rect1 = tempCollection.at(1);

        history.begin( rect1 );
        rect1.set( 'foo', 123 );
        history.end();

        history.begin( [ collection, tempCollection ] );
        collection.remove( collection.at(0) );
        tempCollection.remove( rect1 );
        history.end();

        expect( collection.length ).toBe(3);
        expect( tempCollection.length ).toBe(1);
        expect( tempCollection.at(0).get( 'foo' ) ).toBe( 217 );

        history.undo();
        expect( collection.length ).toBe(4);
        expect( tempCollection.length ).toBe(2);
        expect( tempCollection.at(1).get( 'foo' ) ).toBe( 123 );

        history.undo();
        expect( collection.length ).toBe(4);
        expect( tempCollection.length ).toBe(2);
        expect( tempCollection.at(1).get( 'foo' ) ).toBe( 'b' );

        history.redo();
        expect( collection.length ).toBe(4);
        expect( tempCollection.length ).toBe(2);
        expect( tempCollection.at(1).get( 'foo' ) ).toBe( 123 );

        history.redo();
        expect( collection.length ).toBe(3);
        expect( tempCollection.length ).toBe(1);
        expect( tempCollection.at(0).get( 'foo' ) ).toBe( 217 );
      });
    });

    describe( 'Helper methods', function() {

      beforeEach(function() {
        history = new Flashback.History();
      });

      it( 'clear() empties the history', function() {
        var model = new Model({
          foo: 10
        });

        history.save( model );
        model.set( 'foo', 200 );
        history.save( model );
        history.undo();
        expect( history.redoStack.length ).toBe(1);

        history.clear();
        expect( history.undoStack.length ).toBe(0);
        expect( history.redoStack.length ).toBe(0);

        // Redo does nothing.
        history.redo();
        expect( model.get( 'foo' ) ).toBe( 10 );
      });

      it( 'begin() and end() allow combining multiple minor edits into a single state', function() {
        var model = new Model({
          foo: 10
        });

        history.begin( model );
        model.set( 'foo', 30 );
        model.set( 'foo', 50 );
        model.set( 'foo', 100 );
        history.end();

        expect( history.current.length ).toBe(1);
        expect( model.get( 'foo' ) ).toBe( 100 );

        history.undo();
        expect( model.get( 'foo' ) ).toBe( 10 );

        // Doesn't do anything.
        history.undo();
        expect( model.get( 'foo' ) ).toBe( 10 );

        history.redo();
        expect( model.get( 'foo' ) ).toBe( 100 );
      });

      it( 'begin()/end() do not save states when there are no changes', function() {
        var collection = new Collection([
          { foo: 10, bar: 'a' },
          { foo: 20, bar: 'b' }
        ]);

        // Note: begin() will save this collection state as a baseline.
        history.begin( collection );
        collection.at(0).set( 'foo', 30 );
        collection.at(0).set( 'foo', 10 );
        history.end();

        expect( history.current.length ).toBe(1);
        expect( history.undoStack.length ).toBe(0);
      });
    });
  });
}) ( _, Backbone );
