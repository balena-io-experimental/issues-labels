#!/usr/bin/env node

const
  GitHubApi = require("github"),
  _ = require("lodash")
  ;

const
  regex = new RegExp(process.argv[2], 'i')
  ;

const github = new GitHubApi({
  // optional
  debug: false,
  protocol: "https",
  followRedirects: false, // default: true
  timeout: 5000
});

// set up a helper function for authenticating with github
let authenticate = () => {
  github.authenticate({
    type: "basic",
    username: process.env.GITHUB_USER,
    password: process.env.GITHUB_TOKEN
  });
};

// fetch the issues/labels for all passed repos
let run = () => {
  while (process.argv.length > 3) {
    const
      fqRepo = process.argv.pop(),
      [user, repo] = fqRepo.split("/")
      ;

    fetch(user, repo);
  }
};

const testLabel = (l) => {
  return regex.test(l.name);
};

let fetch = (user, repo) => {
  authenticate();
  github.repos.getCommits({
    user: user,
    repo: repo,
    sha: "production"
  }, (err, res) => {
    if (err != null) {
      throw err;
    }

    // github returns an array of commits, which have a field 'commit' as well
    let [ ghCommit ] = res;

    authenticate();
    github.issues.getForRepo({
      user: user,
      repo: repo,
      state: "all",
      base: "master",
      sort: "updated",
      order: "desc",
      since: ghCommit.commit.author.date
    }, (err, issues) => {
      if (err != null) {
        throw err;
      }

      const json = {};

      // iterate through each issue
      _.map(issues, (issue) => {
        // grab the labels we care about
        issue.labels.filter(testLabel).forEach((label) => {
          if (json[label.name] == null) {
            json[label.name] = [];
          }

          json[label.name].push(issue.title);
        });
      });

      // output the issues grouped by label
      console.log(`\n==> ${user}/${repo} ${"=".repeat(74 - (user.length + repo.length))}`);
      _.forOwn(json, (messages, label) => {
        console.log(`--> ${label}`);

        _.map(messages, (msg) => {
          console.log(`    - ${msg}`);
        });
      });
    });
  });
};

run();

