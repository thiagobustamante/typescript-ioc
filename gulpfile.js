var gulp = require('gulp');
var ts = require('gulp-typescript');
var merge = require('merge2');  
var sourcemaps = require('gulp-sourcemaps');
var runSequence = require('run-sequence');
var del = require('del');
var rename = require('gulp-rename');
var jasmine = require('gulp-jasmine');
var jasmineBrowser = require('gulp-jasmine-browser');
var JasmineConsoleReporter = require('jasmine-console-reporter');
var webpack = require('webpack-stream');
var typedoc = require("gulp-typedoc");

var tsProject = ts.createProject('tsconfig.json', { 
	sortOutput: true, 
	declaration: true,
	rootDir: "./src", 
	noExternalResolve: false
}, ts.reporter.fullReporter(true));

gulp.task('compile', function() {
	var tsResult = tsProject.src()
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(ts(tsProject, {referencedFrom:['typescript-ioc.ts']}));
 
	return merge([
		tsResult.dts.pipe(gulp.dest('release')),
		
		tsResult.js
				.pipe(sourcemaps.write('./')) 
				.pipe(gulp.dest('release'))
	]);
});

gulp.task('clean', function() {
	return del(['release/**/*']);
});

gulp.task('docs-clean', function() {
	return del(['doc/']);
});

gulp.task('test-compile', function(done) {
 	return tsResult = gulp.src('src/**/test.ts')
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(ts(tsProject))
		.pipe(rename({ extname: '_spec.js' }))
		.pipe(sourcemaps.write('./')) 
		.pipe(gulp.dest('release'));
});

 
gulp.task('test-run', function() {
	return gulp.src('release/**/*_spec.js')
		.pipe(jasmine({
	        timeout: 10000,
	        includeStackTrace: false,
	        reporter: new JasmineConsoleReporter({
				colors: 2,           // (0|false)|(1|true)|2 
				cleanStack: 1,       // (0|false)|(1|true)|2|3 
				verbosity: 4,        // (0|false)|1|2|(3|true)|4 
				listStyle: 'indent', // "flat"|"indent" 
				activity: false
			})
	    }));
});

gulp.task('test-run-browser', function() {
  var JasminePlugin = require('gulp-jasmine-browser/webpack/jasmine-plugin');
  var plugin = new JasminePlugin();
  return gulp.src('release/**/*_spec.js')
	    .pipe(webpack({output: {filename: 'browser_spec.js'}, plugins: [plugin]}))
	    .pipe(jasmineBrowser.specRunner({console: true}))
	    // .pipe(jasmineBrowser.server({port: 8888, whenReady: plugin.whenReady})); // to test on real browsers, uncomment
	    .pipe(jasmineBrowser.headless());// to test on real browsers, comment 

});

gulp.task('test', function(done) {
    runSequence('test-compile', 'test-run', function() {
        console.log('Release tested.');
        done();
    });
});

gulp.task('test-browser-only', function(done) {
    runSequence('test-compile', 'test-run-browser', function() {
        console.log('Release tested.');
        done();
    });
});

gulp.task("docs", ['docs-clean'], function() {
    return gulp
        .src(["./src/typescript-ioc.ts"])
        .pipe(typedoc({
            module: "commonjs",
            target: "es5",
            out: "./doc/",
            name: "Typescript-ioc",
			includeDeclarations: true,
			experimentalDecorators: true,
			emitDecoratorMetadata: true,
			excludeExternals: true,
			// TypeDoc options (see typedoc docs) 
			version: true,
			verbose: true
			// json: "output/to/file.json"
 
			// theme: "/path/to/my/theme",
			// ignoreCompilerErrors: false
        }))
    ;
});

gulp.task('release', function(done) {
    runSequence('clean', 'compile', 'test', 'docs', function() {
        console.log('Release deployed.');
        done();
    });
});

gulp.task('build', function(done) {
    runSequence('clean', 'compile', 'test', function() {
        console.log('Release deployed.');
        done();
    });
});

gulp.task('watch', ['compile'], function() {
    gulp.watch('src/**/*.ts', ['compile']);
});