#!/usr/bin/env node

var
  GitHubApi = require("github"),
  regex = new RegExp(process.argv[2], 'i')
  ;

var github = new GitHubApi({
  // optional
  debug: false,
  protocol: "https",
  followRedirects: false, // default: true
  timeout: 5000
});

// set up a helper function for authenticating with github
var authenticate = function() {
  github.authenticate({
    type: "basic",
    username: process.env.GITHUB_USER,
    password: process.env.GITHUB_TOKEN
  });
}

// fetch the issues/labels for all passed repos
var run = function() {
  while (process.argv.length > 3) {
    var fqRepo = process.argv.pop();
    var arr = fqRepo.split("/");

    fetch(arr[0], arr[1]);
  }
}

var fetch = function(user, repo) {
  authenticate();
  github.repos.getCommits({
    user: user,
    repo: repo,
    sha: "production"
  }, function(err, res) {
    if (err != null) {
      throw err;
    }

    commit = res[0];

    authenticate();
    github.issues.getForRepo({
      user: user,
      repo: repo,
      state: "all",
      base: "master",
      sort: "updated",
      order: "desc",
      since: commit.commit.author.date
    }, function(err, issues) {
      var json = {};

      // iterate through each issue
      for (var i = 0; i < issues.length; i++) {
        var issue = issues[i];

        // iterate through each label
        for (var j = 0; j < issue.labels.length; j++) {
          label = issue.labels[j];

          // only grab labels matching the regex
          if (regex.test(label.name) == true) {
            if (json[label.name] == null) {
              json[label.name] = []
            }

            json[label.name].push(issue.title);
          }
        }
      }

      // output the issues grouped by label
      console.log("\n==> " + user + "/" + repo + "  ===================");
      for (var key in json) {
        if (json.hasOwnProperty(key)) {
          console.log("--> " + key);

          for (i = 0; i < json[key].length; i++) {
            console.log("    - " + json[key][i]);
          }
        }
      }
    });
  });
}

run();

