'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var express = require('express');
var browserSync = require('browser-sync');
var gutil = require('gulp-util');
var minimist = require('minimist');
var minifyCss = require('gulp-minify-css');
var buffer = require('gulp-buffer');
var uglify = require('gulp-uglify');
var imagemin = require('gulp-imagemin');
var CacheBuster = require('gulp-cachebust');

var server;
var options = minimist(process.argv);
var environment = options.environment || 'development';
var cachebust = new CacheBuster({ checksunLength: 32 });

gulp.task('html', function () {
	return gulp.src('src/html/**/*.html')
		.pipe(cachebust.references())
		.pipe(gulp.dest('dist'))
		.pipe(reload());
});

gulp.task('images', function () {
	return gulp.src('src/images/**/*.png')
		.pipe(imagemin())
		.pipe(cachebust.resources())
		.pipe(gulp.dest('dist'))
		.pipe(reload());
});

gulp.task('styles', function () {
	return gulp.src('src/styles/**/*.scss')
		.pipe(sass( { sourceComments: environment === 'development' ? 'map' : false } )).on('error', handleError)
		.pipe(environment === 'production' ? minifyCss()  : gutil.noop())
		.pipe(gulp.dest('dist/styles'))
		.pipe(reload());
});

gulp.task('scripts', function() {
	return browserify('./src/scripts/main.js', {debug: environment === 'development'})
		.bundle().on('error', handleError)
		.pipe(source('bundle.js'))
		.pipe(environment === 'production' ? buffer() : gutil.noop())
		.pipe(environment === 'production' ? uglify() : gutil.noop())
		.pipe(gulp.dest('dist/scripts'))
		.pipe(reload());
});

gulp.task('server', function() {
	server = express();
	server.use(express.static('dist'));
	server.listen(8000);
	browserSync({ proxy: 'localhost:8000' });
});

gulp.task('build', ['html', 'images', 'styles', 'scripts']);

gulp.task('watch', function() {
	gulp.watch('src/html/**/*.html', ['html']);
	gulp.watch('src/images/**/*.png', ['images']);
	gulp.watch('src/styles/**/*.scss', ['styles']);
	gulp.watch('src/scripts/**/*.js', ['scripts']);
});

// When you are working on this app, you will want to do three things:
// 
// 1. Build your project
// 2. Watch for changes
// 3. Start your development server
gulp.task('default', ['build', 'watch', 'server']);

function handleError(err) {
	console.log(err.toString());
	this.emit('end');
}

function reload() {
	if(server) {
		return browserSync.reload({ stream: true});
	}
	return gutil.noop();
}