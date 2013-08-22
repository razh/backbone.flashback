'use strict';

module.exports = function (grunt) {
  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    uglify: {
      default: {
        options: {
          sourceMap: 'src/flashback.min.map'
        },
        files: {
          'src/flashback.min.js': ['src/flashback.js']
        }
      }
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: [
        'Gruntfile.js',
        'src/flashback.js',
        'test/spec/**/*.js'
      ]
    },

    karma: {
      options: {
        configFile: 'karma.conf.js'
      },
      continuous: {
        singleRun: true
      },
      browser: {
        browsers: ['Chrome']
      }
    }
  });

  grunt.registerTask('test', [
    'karma:continuous'
  ]);

  grunt.registerTask('build', [
    'uglify'
  ]);

  grunt.registerTask('default', [
    'jshint',
    'test',
    'build'
  ]);
};
