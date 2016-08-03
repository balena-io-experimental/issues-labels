#!/usr/bin/env node

const
  GitHubApi = require("github"),
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
let authenticate = ()=> {
  github.authenticate({
    type: "basic",
    username: process.env.GITHUB_USER,
    password: process.env.GITHUB_TOKEN
  });
};

// fetch the issues/labels for all passed repos
let run = ()=> {
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

let fetch = (user, repo)=> {
  authenticate();
  github.repos.getCommits({
    user: user,
    repo: repo,
    sha: "production"
  }, (err, res)=> {
    if (err != null) {
      throw err;
    }

    let commit = res[0];

    authenticate();
    github.issues.getForRepo({
      user: user,
      repo: repo,
      state: "all",
      base: "master",
      sort: "updated",
      order: "desc",
      since: commit.commit.author.date
    }, (err, issues)=> {
      if (err != null) {
        throw err;
      }

      const json = {};

      // iterate through each issue
      for (let i = 0; i < issues.length; i++) {
        let issue = issues[i];

        // grab the labels we care about
        const matchingLabels = issue.labels.filter(testLabel);

        // iterate through each label
        for (let label of matchingLabels) {
          if (json[label.name] == null) {
            json[label.name] = [];
          }

          json[label.name].push(issue.title);
        }
      }

      // output the issues grouped by label
      console.log(`\n==> ${user}/${repo} ${"=".repeat(74 - (user.length + repo.length))}`);
      for (let key in json) {
        if (json.hasOwnProperty(key)) {
          console.log(`--> ${key}`);

          for (i = 0; i < json[key].length; i++) {
            console.log(`    - ${json[key][i]}`);
          }
        }
      }
    });
  });
};

run();

