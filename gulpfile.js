'use strict';

var pkg     = require('./package.json'),
    stand   = require('./tasks/gulp-stand.js'),
    gulp    = require('gulp'),
    kitty   = require('gulp-conkitty'),
    less    = require('gulp-less'),
    concat  = require('gulp-concat'),
    connect = require('gulp-connect'),
    filter  = require('gulp-filter'),
    uglify  = require('gulp-uglify'),
    rename  = require('gulp-rename'),
    eslint  = require('gulp-eslint'),
    wrapper = require('gulp-wrapper'),
    path    = require('path'),
    del     = require('del'),
    argv    = require('yargs').argv,
    autoprefixer = require('gulp-autoprefixer'),
    mochaPhantomJS = require('gulp-mocha-phantomjs'),

    types   = ['ctpl','less','js','css','html'],
    techs   = {},
    DEST    = path.join(__dirname, pkg.directories.dest),

    Meta    = {
                'name':     pkg.name,
                'version':  pkg.version,
                'author':   pkg.author,
                'license':  pkg.license
            },

    getMetaPkg = function(pkg){
        return {
            name:       pkg.title || pkg.name,
            version:    pkg.version
        };
    },

    getMeta = function(){
        return {

            'qex'  : getMetaPkg(pkg),

            'kitty': getMetaPkg(require('./node_modules/conkitty/package.json')),

            'frameworks':
                [
                    require('./node_modules/backbone/package.json'),
                    require('./node_modules/exoskeleton/package.json')
                ].map(getMetaPkg),

            '$': [
                    require('./node_modules/jquery/package.json'),
                    require('./node_modules/zepto/package.json'),
                ].map(getMetaPkg)
        };
    };



gulp.task(
    'stand', ['clean', 'deps'],
    function() {

        var libs = {
                'controls': require('./index.js'),
                'prism': require('./node_modules/qex-prism/index.js')
            },

            libs_controls_filter_js = filter(
                path.join(libs.controls.LIB, '**/*.js')
            ),

            templates_filter_js = filter(
                'templates.js'
            ),

            libs_templates_filter_js = filter(
                [
                    path.join(libs.controls.LIB, '**/*.js'),
                    'templates.js'
                ]
            ),

            controls_ns = 'qex_controls';

        types.forEach(
            function(tech){
                return techs[tech] = filter('**/*.' + tech);
            }
        );

        gulp
            .src(
                path.join("./", pkg.directories.example, '/**/*.ctpl'),
                {base: __dirname}
            )

            .pipe(
                stand(
                    path.join("./", pkg.directories.dest, '/blocks.json'),
                    getMeta()
                )
            )

            .pipe(techs.ctpl)

            .pipe(
                kitty(
                    {
                        common:    'conkitty.js',
                        templates: 'templates.js',
                        libs: libs,
                        deps: true
                    }
                )
            )
            .pipe(techs.ctpl.restore())

            .pipe(libs_controls_filter_js)

            .pipe(
                wrapper(
                    {
                        header: '(function (ns, window, Backbone, $){\n',
                        footer: '})(' + controls_ns + ', window, Backbone, $);\n'
                    }
                )
            )
            .pipe(libs_controls_filter_js.restore())

            .pipe(templates_filter_js)
            .pipe(
                wrapper(
                    {
                        header: '(function(ns){\n',
                        footer: '})(' + controls_ns + ');\n'
                    }
                )
            )
            .pipe(templates_filter_js.restore())

            .pipe(libs_templates_filter_js)
            .pipe(concat('libs-templates.js'))
            .pipe(
                wrapper(
                    {
                        header: '(function(){\n"use strict";\nvar ' + controls_ns + ' = {}; \n\n',
                        footer: '\n\n})();\n'
                    }
                )
            )
            .pipe(libs_templates_filter_js.restore())


            .pipe(techs.less)
            .pipe(less())
            .pipe(techs.less.restore())

            .pipe(techs.css)
            .pipe(autoprefixer({
                browsers: ['last 2 versions']
            }))
            .pipe(concat('styles.css'))
            .pipe(techs.css.restore())

            .pipe(techs.js)
            .pipe(concat('scripts.js'))
            .pipe(techs.js.restore())

            .pipe(techs.html)
            .pipe(rename("index.html"))
            .pipe(techs.html.restore())

            .pipe(gulp.dest(DEST))
            ;
    }
);

gulp.task(
    'clean',
    function(cb) {
        del([DEST,DEST+'/**', DEST+'/deps/**'], cb);
    }
);



gulp.task(
    'deps',['clean'],
    function() {
        var DEPS = DEST + '/deps';

        gulp.src(
            [
                path.join("./", pkg.directories.example, '/phantom.js'),
            ]
        )
        .pipe(gulp.dest(DEPS));

        gulp
            .src([

                    "./node_modules/zepto/src/zepto.js",
                    "./node_modules/zepto/src/ajax.js",
                    "./node_modules/zepto/src/event.js"
            ])
            .pipe(wrapper({header: ';\n'}))
            .pipe(concat('zepto.js'))
            .pipe(gulp.dest(DEPS))

        gulp
            .src([
                    "./node_modules/jquery/dist/jquery.js"
            ])
            .pipe(wrapper({header: ';\n'}))
            .pipe(concat('jquery.js'))
            .pipe(gulp.dest(DEPS))

        gulp
            .src([
                    "./node_modules/backbone/node_modules/underscore/underscore.js",
                    "./node_modules/backbone/backbone.js"
            ])
            .pipe(wrapper({header: ';\n'}))
            .pipe(concat('backbone.js'))
            .pipe(gulp.dest(DEPS))

        gulp
            .src([
                    "./node_modules/sinon/pkg/sinon.js",
                    "./node_modules/chai/chai.js",
                    "./node_modules/mocha/mocha.js"
            ])
            .pipe(wrapper({header: ';\n'}))
            .pipe(concat('tests.js'))
            .pipe(gulp.dest(DEPS))

        gulp
            .src([
                    "./node_modules/exoskeleton/exoskeleton.js",
            ])
            .pipe(wrapper({header: ';\n'}))
            .pipe(concat('exojs.js'))
            .pipe(gulp.dest(DEPS))
    }
);

gulp.task(
    'watch',
    function() {
        gulp.watch(
            [
                path.join("./", pkg.directories.example, '/**/*.*'),
                path.join("./", pkg.directories.lib,     '/**/*.*'),
            ],
            ['default', 'reload']
        );
    }
);

gulp.task('reload', function () {
    gulp.src(
        [
            path.join("./", pkg.directories.example, '/**/*.*'),
            path.join("./", pkg.directories.lib,     '/**/*.*')
        ]
    )
    .pipe(connect.reload());
});

gulp.task(
    'connect',
    function() {
        connect.server(
            {
                port: pkg.config.port,
                host: pkg.config.host,
                root: pkg.directories.dest,
                livereload: true
            }
        );
    }
);



gulp.task(
    'mochatest', ['stand', 'connect'],
    function(cb) {
        var stream = mochaPhantomJS(),
            url = 'http://localhost:'+pkg.config.port+'/index.html?runtest' + (argv.one ? '&one='+argv.one : '');
        stream.write({path: url + '&exoskeleton&zepto'});
        stream.write({path: url + '&backbone&jQuery'});
        stream.end(
            function (){process.exit()}
        );
        return stream;
    }
);



gulp.task('default', ['stand']);
gulp.task('run', ['watch', 'connect']);
gulp.task('test', ['mochatest']);

module.exports = gulp;
