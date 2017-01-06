# Issues/Labels

## Usage

```
npm install
GITHUB_USER=<user> GITHUB_TOKEN=<token> ./check.sh REGEXP REPO [REPO...]
```

## Examples

List all issues waiting for production:

```
./check.sh waiting-for-production resin-io/resin-repo
```

List all issues, by flow label:

```
./check.sh flow resin-io/resin-repo resin-io/other-repo
```

