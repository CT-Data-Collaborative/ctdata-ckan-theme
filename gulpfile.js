'use strict';
var gulp = require('gulp');

gulp.task('npm', function() {
	gulp.src([
			'./node_modules/simple-statistics/dist/simple_statistics.min.js',
			'./node_modules/simple-statistics/dist/simple_statistics.js'
		])
		.pipe(gulp.dest('./ckanext/ctdata_theme/fanstatic'))
});
