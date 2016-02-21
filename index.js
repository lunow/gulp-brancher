/*
 *	GULP BRANCHER
 *  *************
 *
 *	Version 2
 *
 *	Use the gulp tasks to start your work.
 *
 *	Working on a feature or a task: `gulp task`
 *	Working on a fix: `gulp fix`
 *
 *	Done with your work? Use `gulp task-done` or `gulp fix-done`
 *
 *
 *	WARNING: 	This file as to be synced with all repositories!
 *				If you change something here, copy-past it to 
 *				the other repos.
 *
 *	TODO: Move this script inside a package and make an own repo for it.
 */

var gulp = require('gulp');
var git = require('gulp-git');
var branch = require('git-branch');
var async = require('async');
var gitStatus = require('git-state');
var prompt = require('prompt');
var slug = require('slug');
var argv = require('yargs').argv;
var colors = require('colors');
var gutil = require('gulp-util');


module.exports = function(gulp) {
	
	//start a new fix. it has to start from a release branch
	gulp.task('fix', function(done) {

		async.waterfall([
			//supposed to work on a clean directory
			function(cleanDirCallback) {
				gitStatus.check('./', function(err, result) {
					if(err) {
						cleanDirCallback(err);
						return;
					}

					cleanDirCallback(result.dirty === 0 ? null : 'working directory is dirty. run "git add" and "git commit" to save your changes');
				});
			},

			//supposed to be on release branch
			function(checkBranchCallback) {
				var check_right_branch_result = null;

				branch(function(err, branch_name) {
					if(err) {
						checkBranchCallback(err);
						return;
					}

					if(branch_name.substr(0, 7) != 'release') {
						check_right_branch_result = 'please start the fix from release branch. currently on "'+branch_name+'". run `git checkout release-X` to switch to an existing release branch or run `gulp new-release` to create it automaticly.';
					}
					checkBranchCallback(check_right_branch_result, branch_name);
				});
			},

			//pull current state from server to make sure you work on the most current version
			function(branch_name, pullCallback) {
				git.pull('origin', branch_name, { args: '--rebase' }, function(err) {
					if(err) {
						pullCallback('warning! pull not possible: '+ err.toString());
						return;
					}

					pullCallback();
				});
			},

			//check the fix name
			function(fixNameCallback) {
				//fix name is setted via -m parameter
				if(argv.m) {
					fixNameCallback(null, 'fix/'+slug(argv.m));
					return;
				}

				//prompt the user to get the name
				prompt.start();
				prompt.get(['fix name'], function(err, res) {
					fixNameCallback(null, 'fix/'+slug(res['fix name']));
				});
			},

			//create a new branch
			function(name, newBranchCallback) {
				git.checkout(name, { args: '-b' }, newBranchCallback);
			}

		], function(err) {
			var gulpError = null;
			if(err) {
				// gutil.log('fix failed:'.bold.red, err);
				gulpError = new gutil.PluginError('gulp-brancher', err);
			}
			else {
				gutil.log('okidoki, please start the fix! call "gulp fix-done" when ready.'.bold.green, "\n");
			}
			done(gulpError);
		});
	});

	gulp.task('fix-done', function(done) {
		
		async.waterfall([
			//supposed to be on release branch
			function(checkBranchCallback) {
				branch(function(err, res) {
					if(err) {
						checkBranchCallback(err);
						return;
					}

					checkBranchCallback(res.substr(0,4) === 'fix/' ? null : 'you are not on a fix branch. currently on "'+res+'"', res);
				});
			},

			//supposed to work on a clean directory
			function(branchName, cleanDirCallback) {
				gitStatus.check('./', function(err, result) {
					if(err) {
						cleanDirCallback(err);
						return;
					}

					cleanDirCallback(result.dirty === 0 ? null : 'working directory is dirty. run git add and git commit to save your changes before', branchName);
				});
			},

			//merge into dev branch
			function(branchName, mergeToDevBranchCallback) {
				async.waterfall([
					//checkout branch
					function(checkoutBranchCallback) {
						git.checkout('dev', {}, checkoutBranchCallback);
					},

					//merge fix
					function(mergefixCallback) {
						git.merge(branchName, { args: '--no-ff' }, mergefixCallback);
					}
				], function(err) {
					mergeToDevBranchCallback(err, branchName);
				});
			},

			//merge into release branch
			function(branchName, mergeToreleaseBranchCallback) {
				async.waterfall([
					//checkout branch
					function(checkoutBranchCallback) {
						git.checkout('release', {}, checkoutBranchCallback);
					},

					//merge fix
					function(mergefixCallback) {
						git.merge(branchName, { args: '--no-ff' }, mergefixCallback);
					}
				], function(err) {
					mergeToreleaseBranchCallback(err, branchName);
				});
			}


		], function(err) {
			if(err) {
				console.log('fix failed:'.bold.red, err);
			}
			else {
				console.log('nice. thanks for the fix.'.bold.green, "\n");
			}
			done();
		});

	});



	gulp.task('task', function(done) {

		async.waterfall([
			//supposed to be on release branch
			function(checkBranchCallback) {
				branch(function(err, res) {
					if(err) {
						checkBranchCallback(err);
						return;
					}

					checkBranchCallback(res === 'dev' ? null : 'please start from dev branch. currently on "'+res+'"');
				});
			},

			//supposed to work on a clean directory
			function(cleanDirCallback) {
				gitStatus.check('./', function(err, result) {
					if(err) {
						cleanDirCallback(err);
						return;
					}

					cleanDirCallback(result.dirty === 0 ? null : 'working directory is dirty. run git add and git commit to save your changes before');
				});
			},

			//pull current state from server
			function(pullCallback) {
				git.pull('origin', 'dev', function(err) {
					if(err) {
						console.log('warning! pull not possible', err.toString());
					}

					pullCallback();
				});
			},

			//check the task name
			function(taskNameCallback) {
				if(argv.m) {
					taskNameCallback(null, 'task/'+slug(argv.m));
					return;
				}

				prompt.start();
				prompt.get(['task name'], function(err, res) {
					taskNameCallback(null, 'task/'+slug(res['task name']));
				});
			},

			//create a new branch
			function(name, newBranchCallback) {
				git.checkout(name, { args: '-b' }, newBranchCallback);
			}

		], function(err) {
			if(err) {
				console.log('task failed:'.bold.red, err);
			}
			else {
				console.log('okidoki, please start the task! call "gulp task-done" when ready.'.bold.green, "\n");
			}
			done();
		});


	});

	gulp.task('task-done', function(done) {
		
		async.waterfall([
			//supposed to be on beta branch
			function(checkBranchCallback) {
				branch(function(err, res) {
					if(err) {
						checkBranchCallback(err);
						return;
					}

					checkBranchCallback(res.substr(0,5) === 'task/' ? null : 'you are not on a task branch. currently on "'+res+'"', res);
				});
			},

			//supposed to work on a clean directory
			function(branchName, cleanDirCallback) {
				gitStatus.check('./', function(err, result) {
					if(err) {
						cleanDirCallback(err);
						return;
					}

					cleanDirCallback(result.dirty === 0 ? null : 'working directory is dirty. run git add and git commit to save your changes before', branchName);
				});
			},

			//merge into dev branch
			function(branchName, mergeToDevBranchCallback) {
				async.waterfall([
					//checkout branch
					function(checkoutBranchCallback) {
						git.checkout('dev', {}, checkoutBranchCallback);
					},

					//merge task
					function(mergetaskCallback) {
						git.merge(branchName, { args: '--no-ff' }, mergetaskCallback);
					}
				], function(err) {
					mergeToDevBranchCallback(err, branchName);
				});
			}


		], function(err) {
			if(err) {
				console.log('task failed:'.bold.red, err);
			}
			else {
				console.log('nice. thanks for the task!'.bold.green, "\n");
			}
			done();
		});

	});
};