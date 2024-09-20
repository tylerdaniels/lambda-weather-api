# Lambda Weather API
Sample weather API using AWS Lambda and Terraform

## Set-up
Package management is handled by NPM.

```bash
npm install
```

Framework uses NestJS to simplify building and deployment.

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Running locally

The project uses `serverless` to mimic the AWS Lambda and API Gateway interfaces:

```bash
# unbundled
$ npm run build
$ npm run start

# bundled with webpack
$ npm run build:prod
$ npm run start:prod
```