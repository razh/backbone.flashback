'use strict';
var LIVERELOAD_PORT = 35729;
var lrSnippet = require('connect-livereload')({port: LIVERELOAD_PORT});
var mountFolder = function (connect, dir) {
  return connect.static(require('path').resolve(dir));
};

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to match all subfolders:
// 'test/spec/**/*.js'
// templateFramework: 'lodash'

module.exports = function (grunt) {
  // show elapsed time at the end
  require('time-grunt')(grunt);
  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  grunt.initConfig({
    pkg: grunt.file.readJSOn('package.json'),
    watch: {
      options: {
        nospawn: true
      },
      coffee: {
        files: ['<%= pkg.app %>/scripts/{,*/}*.coffee'],
        tasks: ['coffee:dist']
      },
      coffeeTest: {
        files: ['test/spec/{,*/}*.coffee'],
        tasks: ['coffee:test']
      },
      compass: {
        files: ['<%= pkg.app %>/styles/{,*/}*.{scss,sass}'],
        tasks: ['compass']
      },
      livereload: {
        options: {
          livereload: LIVERELOAD_PORT
        },
        files: [
          '<%= pkg.app %>/*.html',
          '{.tmp,<%= pkg.app %>}/styles/{,*/}*.css',
          '{.tmp,<%= pkg.app %>}/scripts/{,*/}*.js',
          '<%= pkg.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp}'
        ]
      },
      jst: {
        files: [
          '<%= pkg.app %>/scripts/templates/*.ejs'
        ],
        tasks: ['jst']
      }
    },
    connect: {
      options: {
        port: 9000,
        // change this to '0.0.0.0' to access the server from outside
        hostname: 'localhost'
      },
      livereload: {
        options: {
          middleware: function (connect) {
            return [
              lrSnippet,
              mountFolder(connect, '.tmp'),
              mountFolder(connect, pkg.app)
            ];
          }
        }
      },
      test: {
        options: {
          middleware: function (connect) {
            return [
              mountFolder(connect, '.tmp'),
              mountFolder(connect, 'test'),
              mountFolder(connect, pkg.app)
            ];
          }
        }
      },
      dist: {
        options: {
          middleware: function (connect) {
            return [
              mountFolder(connect, pkg.dist)
            ];
          }
        }
      }
    },
    open: {
      server: {
        path: 'http://localhost:<%= connect.options.port %>'
      }
    },
    clean: {
      dist: ['.tmp', '<%= pkg.dist %>/*'],
      server: '.tmp'
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: [
        'Gruntfile.js',
        '<%= pkg.app %>/scripts/{,*/}*.js',
        '!<%= pkg.app %>/scripts/vendor/*',
        'test/spec/{,*/}*.js'
      ]
    },
    mocha: {
      all: {
        options: {
          run: true,
          urls: ['http://localhost:<%= connect.options.port %>/index.html']
        }
      }
    },
    coffee: {
      dist: {
        files: [{
          // rather than compiling multiple files here you should
          // require them into your main .coffee file
          expand: true,
          cwd: '<%= pkg.app %>/scripts',
          src: '{,*/}*.coffee',
          dest: '.tmp/scripts',
          ext: '.js'
        }]
      },
      test: {
        files: [{
          expand: true,
          cwd: '.tmp/spec',
          src: '*.coffee',
          dest: 'test/spec'
        }]
      }
    },
    compass: {
      options: {
        sassDir: '<%= pkg.app %>/styles',
        cssDir: '.tmp/styles',
        imagesDir: '<%= pkg.app %>/images',
        javascriptsDir: '<%= pkg.app %>/scripts',
        fontsDir: '<%= pkg.app %>/styles/fonts',
        importPath: '<%= pkg.app %>/bower_components',
        relativeAssets: true
      },
      dist: {},
      server: {
        options: {
          debugInfo: true
        }
      }
    },
    requirejs: {
      dist: {
        // Options: https://github.com/jrburke/r.js/blob/master/build/example.build.js
        options: {
          // `name` and `out` is set by grunt-usemin
          baseUrl: '<%= pkg.app %>/scripts',
          optimize: 'none',
          paths: {
            'templates': '../../.tmp/scripts/templates'
          },
          // TODO: Figure out how to make sourcemaps work with grunt-usemin
          // https://github.com/pkg/grunt-usemin/issues/30
          //generateSourceMaps: true,
          // required to support SourceMaps
          // http://requirejs.org/docs/errors.html#sourcemapcomments
          preserveLicenseComments: false,
          useStrict: true,
          wrap: true
          //uglify2: {} // https://github.com/mishoo/UglifyJS2
        }
      }
    },
    useminPrepare: {
      html: '<%= pkg.app %>/index.html',
      options: {
        dest: '<%= pkg.dist %>'
      }
    },
    usemin: {
      html: ['<%= pkg.dist %>/{,*/}*.html'],
      css: ['<%= pkg.dist %>/styles/{,*/}*.css'],
      options: {
        dirs: ['<%= pkg.dist %>']
      }
    },
    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= pkg.app %>/images',
          src: '{,*/}*.{png,jpg,jpeg}',
          dest: '<%= pkg.dist %>/images'
        }]
      }
    },
    cssmin: {
      dist: {
        files: {
          '<%= pkg.dist %>/styles/main.css': [
            '.tmp/styles/{,*/}*.css',
            '<%= pkg.app %>/styles/{,*/}*.css'
          ]
        }
      }
    },
    htmlmin: {
      dist: {
        options: {
          /*removeCommentsFromCDATA: true,
          // https://github.com/pkg/grunt-usemin/issues/44
          //collapseWhitespace: true,
          collapseBooleanAttributes: true,
          removeAttributeQuotes: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeOptionalTags: true*/
        },
        files: [{
          expand: true,
          cwd: '<%= pkg.app %>',
          src: '*.html',
          dest: '<%= pkg.dist %>'
        }]
      }
    },
    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= pkg.app %>',
          dest: '<%= pkg.dist %>',
          src: [
            '*.{ico,txt}',
            '.htaccess',
            'images/{,*/}*.{webp,gif}'
          ]
        }]
      }
    },
    bower: {
      all: {
        rjsConfig: '<%= pkg.app %>/scripts/main.js'
      }
    },
    jst: {
      options: {
        amd: true
      },
      compile: {
        files: {
          '.tmp/scripts/templates.js': ['<%= pkg.app %>/scripts/templates/*.ejs']
        }
      }
    },
    rev: {
      dist: {
        files: {
          src: [
            '<%= pkg.dist %>/scripts/{,*/}*.js',
            '<%= pkg.dist %>/styles/{,*/}*.css',
            '<%= pkg.dist %>/images/{,*/}*.{png,jpg,jpeg,gif,webp}',
            '<%= pkg.dist %>/styles/fonts/*'
          ]
        }
      }
    }
  });

  grunt.registerTask('createDefaultTemplate', function () {
    grunt.file.write('.tmp/scripts/templates.js', 'this.JST = this.JST || {};');
  });

  grunt.registerTask('server', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['build', 'open', 'connect:dist:keepalive']);
    }

    grunt.task.run([
      'clean:server',
      'coffee:dist',
      'createDefaultTemplate',
      'jst',
      'compass:server',
      'connect:livereload',
      'open',
      'watch'
    ]);
  });

  grunt.registerTask('test', [
    'clean:server',
    'coffee',
    'createDefaultTemplate',
    'jst',
    'compass',
    'connect:test',
    'mocha'
  ]);

  grunt.registerTask('build', [
    'clean:dist',
    'coffee',
    'createDefaultTemplate',
    'jst',
    'compass:dist',
    'useminPrepare',
    'requirejs',
    'imagemin',
    'htmlmin',
    'concat',
    'cssmin',
    'uglify',
    'copy',
    'rev',
    'usemin'
  ]);

  grunt.registerTask('default', [
    'jshint',
    'test',
    'build'
  ]);
};
