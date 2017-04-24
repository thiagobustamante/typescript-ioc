var gulp = require('gulp');
var ts = require('gulp-typescript');
var merge = require('merge2');  
var sourcemaps = require('gulp-sourcemaps');
var runSequence = require('run-sequence');
var del = require('del');
var rename = require('gulp-rename');
var jasmine = require('gulp-jasmine');
var JasmineConsoleReporter = require('jasmine-console-reporter');
var typedoc = require("gulp-typedoc");
var processEnv = require('gulp-process-env')

var tsProject = ts.createProject('tsconfig.json', { 
	declaration: true,
	target: "es5",
	noResolve: false
}, ts.reporter.fullReporter(true));

var tsProjectES6 = ts.createProject('tsconfig.json', { 
	declaration: true,
	target: "es6",
	noResolve: false
}, ts.reporter.fullReporter(true));

gulp.task('compile', function() {
	var tsResult = gulp.src('typescript-ioc.ts')
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(tsProject());
 
	return merge([
		tsResult.dts.pipe(rename("index.d.ts")).pipe(gulp.dest('./')),
		
		tsResult.js
				.pipe(rename("es5.js")) 
				.pipe(sourcemaps.write('./')) 
				.pipe(gulp.dest('./'))
	]);
});

gulp.task('compile-es6', function() {
	var tsResult = gulp.src('typescript-ioc.ts')
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(tsProjectES6());
 
	return merge([
//		tsResult.dts.pipe(rename("es6.d.ts")).pipe(gulp.dest('./')),
		
		tsResult.js
				.pipe(rename("es6.js")) 
				.pipe(sourcemaps.write('./'))
				.pipe(gulp.dest('./'))
	]);
});

gulp.task('clean', function() {
	return del(['spec/**/*.js', 'es*.js', 'es*.d.ts', , 'es*.js.map']);
});

gulp.task('docs-clean', function() {
	return del(['doc/']);
});

gulp.task('test-compile', function(done) {
 	return tsResult = gulp.src('spec/*.ts')
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(tsProject())
		.pipe(sourcemaps.write('./')) 
		.pipe(gulp.dest('./spec'));
});

gulp.task('test-compile-es6', function(done) {
 	return tsResult = gulp.src('spec/*.ts')
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(tsProjectES6())
		.pipe(sourcemaps.write('./')) 
		.pipe(gulp.dest('spec'));
});
 
gulp.task('test-run', function() {
	return gulp.src('spec/*.js')
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

gulp.task('test-run-es6', function() {
var env = processEnv({
		ES6: 'true'
	});
	return gulp.src('spec/*.js')
		.pipe(env)
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
	    }))
		.pipe(env.restore());
});

gulp.task('test', function(done) {
    runSequence('test-compile', 'test-run', function() {
        console.log('Release tested.');
        done();
    });
});

gulp.task('test-es6', function(done) {
    runSequence('test-compile-es6', 'test-run-es6', function() {
        console.log('Release tested.');
        done();
    });
});

gulp.task("docs", ['docs-clean'], function() {
    return gulp
        .src(["./typescript-ioc.ts"])
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
			version: true
			// json: "output/to/file.json"
 
			// theme: "/path/to/my/theme",
			// ignoreCompilerErrors: false
        }))
    ;
});

gulp.task('release', function(done) {
    runSequence('clean', 'compile', 'compile-es6', 'test', 'test-es6', 'docs', function() {
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