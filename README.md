# Lambda Weather API

Sample weather API using AWS Lambda and Terraform

## Set-up

Package management is handled by NPM.

```bash
$ npm install
```

Framework uses NestJS to simplify building and deployment.

## Run tests

```bash
# unit tests
$ npm run test
```

## Running locally

The project uses `serverless` to mimic the AWS Lambda and API Gateway interfaces:

```bash
# unbundled
$ npm run start

# bundled with webpack
$ npm run start:prod
```

If DynamoDB integration is enabled using `DYNAMODB_ENABLED=1` then you'll also need to run the local DynamoDB proxy:

```bash
$ npx sls dynamodb start
```

This will use Java to run a minimal version of DynamoDB in-memory with the correct tables set-up for these additional variables:

```bash
$ export DYNAMODB_REGION=localhost
$ export DYNAMODB_ENDPOINT="http://localhost:8096"
$ export DYNAMODB_TABLE="weather-api-requests"
```

## Deploy to AWS

Initialise and download the required terraform providers:

```bash
terraform init
```

Deployment uses AWS and requires you have previously setup your AWS credentials according
to the (provider docs)[https://registry.terraform.io/providers/hashicorp/aws/latest/docs#authentication-and-configuration].

The easiest method for testing would probably be to store the credentials in the AWS CLI (`aws configure`) or use these environment variables:

```bash
$ export AWS_ACCESS_KEY_ID="anaccesskey"
$ export AWS_SECRET_ACCESS_KEY="asecretkey"
```

By default, the terrform plan deploys to the Sydney cloud (`ap-southeast-2`).

Build the code and deploy it using terraform:

```bash
$ node run build:prod && terraform apply
```

## AWS Testing

Terraform saves the deployed URL in the output variable `api_gateway_root`. This allows for command-line testing
through cURL or another command-line HTTP client:

```bash
$ curl "$(terraform output -raw api_gateway_root)/weather/melbourne"
```
