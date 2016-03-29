var gulp = require('gulp');

var brancher = require('./index.js')(gulp);

brancher.on('task-done', function(err) {
	console.log('oha, the task is done!');
	console.log('it has error?', err);
});

brancher.on('fix-done', function(err) {
	console.log('uh, the fix is done.');
	console.log('it has error?', err);
});