# gulp-brancher
Helps to work and automate with complex branches via gulp


## Installation
Require the file inside your `gulpfile.js`
	
	var gulp = require('gulp');
	
	require('gulp-brancher')(gulp);


## Preparation
Read "A successful Git branching model" (http://nvie.com/posts/a-successful-git-branching-model/)


## Create and fix a release
Creating a release as to be done by hand. Because there are to much edge cases. The default way would be

	git checkout dev
	git checkout -b release-1

	#upload the release branch
	git push --set-upstream origin release-1

Now you can start to work on a fix with

	gulp fix -m "i fix something"

