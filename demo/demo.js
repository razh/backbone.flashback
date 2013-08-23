(function( $, _, Backbone, undefined ) {
  'use strict';

  var Post = Backbone.Model.extend({
    defaults: function() {
      return {
        id: _.uniqueId(),
        title: '',
        text: ''
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

  var posts = new Posts([
    { title: 'Post 1', text: 'Hello world!' },
    { title: 'Post 2', text: 'Goodbye world!' }
  ]);

  var postsView = new PostsView({
    el: '#posts-view',
    collection: posts
  });

  var manager = new Backbone.Flashback();

  manager.begin( posts.at(0) );
  posts.at(0).set( 'text', 'Thank you world!' );
  manager.end();

  manager.begin( posts.at(1) );
  posts.at(1).set( 'text', 'See you later!' );
  manager.end();

  manager.begin( posts );
  posts.remove( posts.at(1) );
  manager.end();

  var names    = [ 'undo', 'redo' ],
      canNames = [ 'canUndo', 'canRedo' ];

  var state = 0;
  setInterval(function() {
    if ( manager[ canNames[ state ] ]() ) {
      manager[ names[ state ] ]();
    } else {
      state = ( state + 1 ) % 2;
    }
  }, 500 );

}) ( $, _, Backbone );
