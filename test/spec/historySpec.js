/*globals describe, beforeEach, it, expect*/
(function( _, Backbone, undefined ) {
  'use strict';

  describe( 'Flashback', function() {

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

    var manager;

    describe( 'Backbone.Model', function() {

      var model;

      beforeEach(function() {
        manager = new Flashback();

        model = new Model({
          foo: 10,
          bar: 20
        });
      });

      it( 'saves the state of a Backbone.Model', function() {
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

      it( 'redoes an undone state of a Model', function() {
        manager.save( model );

        model.set( 'foo', 200 );
        manager.save( model );

        manager.undo();
        expect( model.get( 'foo' ) ).toBe( 10 );

        manager.redo();
        // foo has its new value.
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

      it( 'save() erases future redo manager if in the past', function() {
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


    describe( 'Backbone.Collection', function() {

      var collection;

      beforeEach(function() {
        manager = new Flashback();

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
        manager.save( collection );

        collection.remove( collection.at(0) );
        expect( collection.length ).toBe(3);
        // It no longer exists in the array.
        expect( typeof collection.get( id0 ) ).toBe( 'undefined' );
        manager.save( collection );

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

    describe( 'Helper methods', function() {

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


    describe( 'Mix of models and collections', function() {

      var collection;

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
  });
}) ( _, Backbone );
