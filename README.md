# Issues/Labels

## Usage

```
npm install
./cli.js REGEXP REPO [REPO...]
```

## Examples

List all issues waiting for production:

```
./cli.js waiting-for-production resin-io/resin-repo
```

List all issues, by flow label:

```
./cli.js flow resin-io/resin-repo resin-io/other-repo
```

