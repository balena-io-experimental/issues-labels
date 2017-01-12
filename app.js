#!/usr/bin/env node

'use strict'

const
  _         = require("lodash"),
  Promise   = require("bluebird"),
  GitHubApi = Promise.promisifyAll(require("github"))

const regex = new RegExp(process.argv[2], 'i')

const github = new GitHubApi({
  // optional
  debug: false,
  protocol: "https",
  followRedirects: false, // default: true
  timeout: 5000
})

// set up a helper function for authenticating with github
const authenticate = () => {
  github.authenticate({
    type: "basic",
    username: process.env.GITHUB_USER,
    password: process.env.GITHUB_TOKEN
  })
}

// return a function container the user and repo
const filterCommits = (user, repo) => {
  return ([ghCommit]) => {
    return github.issues.getForRepo({
      user,
      repo,
      state: "all",
      base: "master",
      sort: "updated",
      order: "desc",
      since: ghCommit.commit.author.date
    })
  }
}

const testLabel = (l) => { return regex.test(l.name) }

const fetchCommits = (user, repo) => {
  return github.repos.getCommits({
    user,
    repo,
    sha: "production"
  })
}

const collectIssues = Promise.method((issues) => {
  let json = {}

  // iterate through each issue
  _.each(issues, (issue) => {
    // grab the labels we care about
    issue.labels.filter(testLabel).forEach((label) => {
      if (json[label.name] == null) {
        json[label.name] = []
      }

      json[label.name].push(issue)
    })
  })

  return json
})

// output the issues grouped by label
const output = (user, repo, issues) => {
  printRepo(user, repo)

  _.forOwn(issues, (messages, label) => {
    printLabel(label)

    _.each(messages, (msg) => {
      printMessage(msg)
    })
  })
}

const printRepo = (user, repo) => {
  console.log(`\n==> ${user}/${repo} ${"=".repeat(74 - (user.length + repo.length))}`)
  console.log(`    https://github.com/${user}/${repo}`)
}

const printMessage = (msg) => {
  console.log(`    - ${msg.title}\n        (${msg.url})`)
}

const printLabel = (label) => {
  console.log(`--> ${label}`)
}

// fetch the issues/labels for all passed repos
const run = () => {
  authenticate();

  while (process.argv.length > 3) {
    const [user, repo] = process.argv.pop().split("/")

    fetchCommits(user, repo)
    .then(filterCommits(user, repo))
    .then(collectIssues)
    .then(_.partial(output, user, repo))
    .catch((err) => {
      console.error(`${process.argv[1]}: error:`, err, err.stack)
      process.exit(1)
    })
  }
}

run()

