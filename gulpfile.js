var gulp = require('gulp');
var brancher = require('./index.js')(gulp);

var rb = brancher.__my.getReleaseBranch("* fix/find-the-right-release-branch\n fix/something-to-fix\n master\n release-10\n release-7\n release-11\n release-04\n release-199\n task/a-small-test-task\n")
console.log();
console.log('rb is', rb);
console.log();