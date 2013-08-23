function Flashback() {

  this.current = null;

  this.undoStack = [];
  this.redoStack = [];

  this.previousState = null;

  this.byId = [];

  var that = this;
  // Create custom Memento class that is bound to this Flashback object.
  this.Memento = (function() {
    function Memento( target ) {
      this.id = target ? target.id : undefined;
      this.state = target ? target.toJSON() : {};
    }

    Memento.prototype = {
      restore: function() {
        if ( typeof this.id !== 'undefined' ) {
          that.byId[ this.id ].set( this.state );
        }
      }
    };

    return Memento;
  }) ();
}

Flashback.prototype = {
  save: function( target ) {
    if ( !target ) {
      return;
    }

    if ( this.current ) {
      this.undoStack.push( this.current );
    }

    this.current = this.snapshot( target );
    this.redoStack = [];
  },

  snapshot: function( target ) {
    if ( !target ) {
      return;
    }

    var Memento = this.Memento;

    if ( _.isArray( target ) ) {
      return target.map(function( element ) {
        return new Memento( element );
      });
    }

    return [ new Memento( target ) ];
  },

  begin: function( target ) {
    if ( !target || _.isEmpty( target ) ) {
      return;
    }

    this.previousState = this.snapshot( target );
  },

  end: function() {
    if ( !this.previousState ) {
      return;
    }

    var mementos = this.previousState.filter(function( memeto ) {
      return !_.isEqual( memento.state, this.byId[ memento.id ].toJSON() );
    });

    var ids = mementos.map(function( memento ) {
      return memento.id;
    });

    if ( ids.length ) {
      this.current = this.previousState.concat( mementos );

      var that = this;
      var targets = ids.forEach(function( id ) {
        return that.byId[ id ];
      });

      this.save( targets );
    }
  },

  timeTravel: function( forwardStack, backwardStack ) {
    if ( !forwardStack || !backwardStack || !forwardStack.length ) {
      return;
    }

    if ( this.current ) {
      backwardStack.push( this.current );
    }

    this.current = forwardStack.pop();

    this.current.forEach(function( memento ) {
      memento.restore();
    });

    return this;
  },

  undo: function() { return this.timeTravel( this.undoStack, this.redoStack ); },
  redo: function() { return this.timeTravel( this.redoStack, this.undotack ); }

};

describe( 'Flashback', function() {

  var Model = Backbone.Model.extend({
    defaults: function() {
      return {
        id: _.uniqueId(),
        foo: 'foo'
      };
    }
  });

  var Collection = Backbone.Collection.extend({
    model: Model
  });

  var history, Memento, memento;

  beforeEach(function() {
    history = new Flashback();
  });

  it('', function() {
    history.save();
  });
});
