(function( _, Backbone, undefined ) {
  'use strict';

  function Memento( target ) {
    this.target = target || null;
    this.state  = target ? target.toJSON() : {};
  }

  Memento.prototype = {
    restore: function() {
      if ( this.target ) {
        this.target.set( this.state );
      }
    },

    /**
     * Makes sure that our target references the same object in collection.
     * Don't do anything if the target is not in the collection.
     */
    reference: function( collection ) {
      if ( !collection || this.target instanceof Backbone.Collection ) {
        return;
      }

      var target = collection.get( this.state.id );
      if ( !target ) {
        return;
      }

      this.target = target;
    }
  };

  function Flashback() {
    this.current = null;

    this.undoStack = [];
    this.redoStack = [];

    // Store a state to determine whether we've changed a model/collection.
    this.previous = null;
  }

  Backbone.Flashback = Flashback;
  Flashback.Memento  = Memento;

  /**
   * There are four types of history states:
   * - A Backbone.Model.
   * - A Backbone.Collection.
   * - An array of Backbone.Models.
   * - An array of Backbone.Collections.
   *
   * These states are all stored as an array of Mementos.
   */
  Flashback.prototype = {
    /**
     * Save the target's attributes.
     * Wipes the redo stack.
     */
    save: function( target ) {
      this.store( this.snapshot( target ) );
    },

    /**
     * Saves an array of mementos.
     * Wipes the redo stack.
     */
    store: function( state ) {
      if ( this.current ) {
        this.undoStack.push( this.current );
      }

      this.current = state;
      this.redoStack = [];
    },

    /**
     * Take a snapshot of the current state of the target.
     * Returns an array of mementos.
     */
    snapshot: function( target ) {
      if ( _.isArray( target ) ) {
        return target.map(function( element ) {
          return new Memento( element );
        });
      }

      return [ new Memento( target ) ];
    },

    /**
     * Begin tracking a target.
     */
    begin: function( target ) {
      // Can't track nothing.
      if ( _.isEmpty( target ) ) {
        return;
      }

      this.previous = this.snapshot( target );
    },

    /**
     * Stop tracking a target and push changes to history if anything changed.
     */
    end: function() {
      if ( !this.previous ) {
        return;
      }

      // Get all mementos that have changed since begin() was called.
      var mementos = this.previous.filter(function( memento ) {
        return !_.isEqual( memento.state, memento.target.toJSON() );
      });

      var targets = mementos.map(function( memento ) {
        return memento.target;
      });

      // Save only if we have anything to save.
      if ( targets.length ) {
        if ( !this.current ) {
          this.current = [];
        }

        // Save the previous state if current does not already know about it.
        this.current = this.current.concat( mementos );
        this.save( targets );
      }
    },

    /**
     * Time travel towards the forwardStack and away from the backwardStack.
     */
    timeTravel: function( forwardStack, backwardStack ) {
      // Don't do anything if we can't time travel further.
      if ( !forwardStack || !backwardStack || !forwardStack.length ) {
        return;
      }

      if ( this.current ) {
        backwardStack.push( this.current );
      }

      this.current = forwardStack.pop();

      var that = this;
      this.current.forEach(function( memento ) {
        memento.restore();

        // Restore model references in mementos.
        if ( memento.target instanceof Backbone.Collection ) {
          that.reference( memento.target );
        }
      });

      return this;
    },

    undo: function() { return this.timeTravel( this.undoStack, this.redoStack ); },
    redo: function() { return this.timeTravel( this.redoStack, this.undoStack ); },

    canUndo: function() { return this.undoStack.length; },
    canRedo: function() { return this.redoStack.length; },

    clear: function() {
      this.undoStack = [];
      this.redoStack = [];
    },

    /**
     * Goes through the undo and redo stacks and rebuilds references to models.
     * Warning: this is an O(n*m) operation, where n is the number of mementos
     * in the history stacks, and m is the size of the collection.
     */
    reference: function( collection ) {
      this.undoStack.concat( this.redoStack ).forEach(function( state ) {
        state.forEach(function( memento ) {
          memento.reference( collection );
        });
      });
    }
  };
}) ( _, Backbone );
