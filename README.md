# gulp-brancher
Helps to work and automate with complex branches via gulp


## Installation
Require the file inside your `gulpfile.js`
	
	var gulp = require('gulp');
	
	require('gulp-brancher')(gulp);


## Preparation
Read (A successful Git branching model)[http://nvie.com/posts/a-successful-git-branching-model/]

Create a branch `dev`. This holds the development version and every task is starting from that.

If you prepare a release, create a branch `release-X` where the X is an increasing release number. Its important that its increase!


## Create and fix a release
Creating a release as to be done by hand. Because there are to much edge cases. The default way would be

	git checkout dev
	git checkout -b release-1

	#upload the release branch
	git push --set-upstream origin release-1

Now you can start to work on a fix with

	gulp fix -m "i fix something"

If you are done, call `gulp fix-done`


## Start work on a task

	git checkout dev
	gulp task -m "what are you doing"

If you are done, call `gulp task-done`


## Pro Tip
Add the following lines to your `~/.profile` file and get rid of `gulp` in every task.

	alias task='gulp task'
	alias task-done='gulp task-done'
	alias fix='gulp fix'
	alias fix-done='gulp fix-done'