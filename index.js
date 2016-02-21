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

var _ = require('lodash');
var git = require('gulp-git');
var branch = require('git-branch');
var async = require('async');
var gitStatus = require('git-state');
var prompt = require('prompt');
var slug = require('slug');
var argv = require('yargs').argv;
var colors = require('colors');
var gutil = require('gulp-util');
var exec = require('child_process').exec;


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
				gulpError = new gutil.PluginError('gulp-brancher', err);
			}
			else {
				gutil.log('okidoki, please start the fix! call "gulp fix-done" when ready.'.bold);
			}
			done(gulpError);
		});
	});


	gulp.task('fix-done', function(done) {
		
		async.waterfall([
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

			//supposed to be on fix branch
			function(checkBranchCallback) {
				branch(function(err, branch_name) {
					if(err) {
						checkBranchCallback(err);
						return;
					}

					checkBranchCallback(branch_name.substr(0,4) === 'fix/' ? null : 'you are not on a fix branch. currently on "'+branch_name+'"', branch_name);
				});
			},

			//find latest release branch
			function(branch_name, findLatestReleaseBranchCallback) {
				exec('git branch', {}, function(err, stdout, stderr) {
					if(err || stderr) {
						findLatestReleaseBranchCallback(err || stderr);
						return;
					}
					
					var release_branches = []
					_.each(stdout.split("\n"), function(branch) {
						branch = _.trim(branch).replace('* ', '');
						if(branch.substr(0, 7) == 'release') {
							release_branches.push(branch);
						}
					}).sort(function(a, b){return a.split('-')[1]-b.split('-')[1]});
					var latest_release = release_branches.pop();
					gutil.log('assuming latest release branch is', latest_release);
					findLatestReleaseBranchCallback(null, branch_name, latest_release);
				});
			},

			//merge into dev branch
			function(branch_name, release_branch, mergeToDevBranchCallback) {
				async.waterfall([
					//checkout dev branch
					function(checkoutBranchCallback) {
						git.checkout('dev', {}, checkoutBranchCallback);
					},

					//merge fix
					function(mergefixCallback) {
						git.merge(branch_name, { args: '--no-ff' }, mergefixCallback);
					}
				], function(err) {
					mergeToDevBranchCallback(err, branch_name, release_branch);
				});
			},

			//merge into release branch
			function(branch_name, release_branch, mergeToreleaseBranchCallback) {
				async.waterfall([
					//checkout release_branch branch
					function(checkoutBranchCallback) {
						git.checkout(release_branch, {}, checkoutBranchCallback);
					},

					//merge fix
					function(mergefixCallback) {
						git.merge(branch_name, { args: '--no-ff' }, mergefixCallback);
					}
				], function(err) {
					mergeToreleaseBranchCallback(err, branch_name);
				});
			}


		], function(err) {
			var gulpError = null;
			if(err) {
				gulpError = new gutil.PluginError('gulp-brancher', err);
			}
			else {
				gutil.log('nice. thanks for the fix.'.bold);
			}
			done(gulpError);
		});

	});



	gulp.task('task', function(done) {

		async.waterfall([
			//supposed to be on dev branch
			function(checkBranchCallback) {
				branch(function(err, res) {
					if(err) {
						checkBranchCallback(err);
						return;
					}

					checkBranchCallback(res === 'dev' ? null : 'please start from "dev" branch. currently on "'+res+'"');
				});
			},

			//supposed to work on a clean directory
			function(cleanDirCallback) {
				gitStatus.check('./', function(err, result) {
					if(err) {
						cleanDirCallback(err);
						return;
					}

					cleanDirCallback(result.dirty === 0 ? null : 'working directory is dirty. run `git add` and `git commit` to save your changes before');
				});
			},

			//pull current state from server
			function(pullCallback) {
				git.pull('origin', 'dev', { args: '--rebase' }, function(err) {
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
			var gulpError = null;
			if(err) {
				gulpError = new gutil.PluginError('gulp-brancher', err);
			}
			else {
				gutil.log('okidoki, please start the task! call `gulp task-done` when ready.'.bold);
			}
			done(gulpError);
		});


	});

	gulp.task('task-done', function(done) {
		
		async.waterfall([
			//supposed to be on task branch
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
			var gulpError = null;
			if(err) {
				gulpError = new gutil.PluginError('gulp-brancher', err);
			}
			else {
				gutil.log('nice. thanks for the task!'.bold, "\n");
			}
			done(gulpError);
		});

	});
};