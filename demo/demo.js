(function( $, _, Backbone, undefined ) {
  'use strict';

  var Post = Backbone.Model.extend({
    defaults: function() {
      return {
        id: _.uniqueId(),
        title: '',
        text: '',
        color: 'black'
      };
    }
  });

  var Posts = Backbone.Collection.extend({
    model: Post
  });

  var PostsView = Backbone.View.extend({
    template: _.template( $( '#posts-view-template' ).html() ),

    initialize: function() {
      _.bindAll( this, 'render' );
      this.listenTo( this.collection, 'change add remove reset', this.render );
    },

    render: function() {
      this.$el.html( this.template({ posts: this.collection.models }) );
      return this;
    }
  });

  var posts = new Posts();
  posts.comparator = function( post ) {
    return parseInt( post.id, 10 );
  };

  var postsView = new PostsView({
    el: '#posts-view',
    collection: posts
  });

  var manager = new Backbone.Flashback();

  // Generate history.
  manager.begin( posts );
  posts.add({ title: 'Post 1', text: '', color: '#e43' });
  manager.end();

  manager.begin( posts );
  posts.add({ title: 'Post 2', text: '', color: '#1a8' });
  manager.end();

  manager.begin( posts.at(0) );
  posts.at(0).set( 'text', 'Hello world!' );
  manager.end();

  manager.begin( posts.at(1) );
  posts.at(1).set( 'text', 'And hello to you too!' );
  manager.end();

  manager.begin( posts );
  posts.add({ title: 'Post 3', text: 'Blah blah blah.', color: '#28b' });
  manager.end();

  manager.begin( posts.at(1) );
  posts.at(1).set( 'text', 'See you later!' );
  manager.end();

  manager.begin( posts );
  posts.remove( posts.at(1) );
  manager.end();

  manager.begin( posts.at(0) );
  posts.at(0).set( 'text', 'All alone now!' );
  manager.end();

  manager.save( posts.at(0) );

  posts.at(0).set( 'text', 'All alone now! One' );
  manager.save( posts.at(0) );

  posts.at(0).set( 'text', 'All alone now! One, two' );
  manager.save( posts.at(0) );

  posts.at(0).set( 'text', 'All alone now! One, two, three!' );
  manager.save( posts.at(0) );

  // Revert back to original state.
  while( manager.canUndo() ) {
    manager.undo();
  }

  var names    = [ 'undo', 'redo' ],
      canNames = [ 'canUndo', 'canRedo' ];

  var duration = 500;

  var state = 1;
  setInterval(function() {
    if ( manager[ canNames[ state ] ]() ) {
      manager[ names[ state ] ]();
    } else {
      state = ( state + 1 ) % 2;
    }
  }, duration );

}) ( $, _, Backbone );
