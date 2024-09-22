terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.38.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4.2"
    }
  }

  required_version = ">= 1.2.0"
}

provider "aws" {
  region = var.aws_region
}

// Build the bucket for the API deployment
resource "random_pet" "lambda_bucket_name" {
  prefix = "weather-api"
  length = 4
}

resource "aws_s3_bucket" "lambda_bucket" {
  bucket = random_pet.lambda_bucket_name.id
}

resource "aws_s3_bucket_ownership_controls" "lambda_bucket" {
  bucket = aws_s3_bucket.lambda_bucket.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "lambda_bucket" {
  depends_on = [aws_s3_bucket_ownership_controls.lambda_bucket]

  bucket = aws_s3_bucket.lambda_bucket.id
  acl    = "private"
}

// Bundle the built code into a single file
data "archive_file" "lambda_weather_api" {
  type = "zip"

  source_dir  = "${path.module}/dist"
  output_path = "${path.module}/build/weather-api.zip"
}

// Copy distribution to S3 bucket
resource "aws_s3_object" "lambda_weather_api" {
  bucket = aws_s3_bucket.lambda_bucket.id

  key    = "weather-api.zip"
  source = data.archive_file.lambda_weather_api.output_path

  etag = filemd5(data.archive_file.lambda_weather_api.output_path)
}

// Provision DynamoDB tables
resource "random_pet" "dynamodo_table_name" {
  prefix = "weather-api-requests"
  length = 2
}

resource "aws_dynamodb_table" "api_request_table" {
  name         = random_pet.dynamodo_table_name.id
  billing_mode = "PAY_PER_REQUEST"
  attribute {
    name = "requestId"
    type = "S"
  }
  attribute {
    name = "date"
    type = "N"
  }
  hash_key  = "requestId"
  range_key = "date"
}

// Deploy Lambda Functions
resource "aws_lambda_function" "lambda_weather_api_current" {
  function_name = "CurrentWeather"

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_object.lambda_weather_api.key

  environment {
    variables = {
      OPENWEATHER_APIKEY = var.openweathermap_apikey
      DYNAMODB_ENABLED   = 1
      DYNAMODB_TABLE     = random_pet.dynamodo_table_name.id
    }
  }

  runtime = "nodejs20.x"
  handler = "main.current"

  timeout     = 10  // API calls can take a few seconds
  memory_size = 192 // A small buffer to stop OOM errors

  source_code_hash = data.archive_file.lambda_weather_api.output_base64sha256

  role = aws_iam_role.lambda_exec.arn
}

resource "aws_lambda_function" "lambda_weather_api_historical" {
  function_name = "HistoricalWeather"

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_object.lambda_weather_api.key

  environment {
    variables = {
      OPENWEATHER_APIKEY = var.openweathermap_apikey
      DYNAMODB_ENABLED   = 1
      DYNAMODB_TABLE     = random_pet.dynamodo_table_name.id
    }
  }

  runtime = "nodejs20.x"
  handler = "main.historical"

  timeout     = 10  // API calls can take a few seconds
  memory_size = 192 // A small buffer to stop OOM errors

  source_code_hash = data.archive_file.lambda_weather_api.output_base64sha256

  role = aws_iam_role.lambda_exec.arn
}

resource "aws_iam_role" "lambda_exec" {
  name = "serverless_lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Sid    = ""
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

// Give lambda access to the one table
resource "aws_iam_role_policy" "dynamodb_lambda_policy" {
  name = "dynamodb_lambda_policy"
  role = aws_iam_role.lambda_exec.id
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Action" : ["dynamodb:*"],
        "Resource" : "${aws_dynamodb_table.api_request_table.arn}"
      }
    ]
  })
}

// Expose the Lambda functions through an API Gateway
resource "aws_apigatewayv2_api" "weather_api" {
  name          = "serverless_weather_api_gw"
  protocol_type = "HTTP"
}

// With logging for 7 days
resource "aws_cloudwatch_log_group" "weather_api" {
  name = "/aws/lambda/weather_api"

  retention_in_days = 7
}

resource "aws_apigatewayv2_stage" "weather_api" {
  api_id = aws_apigatewayv2_api.weather_api.id

  name        = "serverless_weather_api_stage"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.weather_api.arn

    format = jsonencode({
      requestId               = "$context.requestId"
      sourceIp                = "$context.identity.sourceIp"
      requestTime             = "$context.requestTime"
      protocol                = "$context.protocol"
      httpMethod              = "$context.httpMethod"
      resourcePath            = "$context.resourcePath"
      routeKey                = "$context.routeKey"
      status                  = "$context.status"
      responseLength          = "$context.responseLength"
      integrationErrorMessage = "$context.integrationErrorMessage"
      }
    )
  }
}

resource "aws_apigatewayv2_integration" "weather_api_current" {
  api_id = aws_apigatewayv2_api.weather_api.id

  integration_uri    = aws_lambda_function.lambda_weather_api_current.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "weather_api_current" {
  api_id = aws_apigatewayv2_api.weather_api.id

  route_key = "GET /weather/{city}"
  target    = "integrations/${aws_apigatewayv2_integration.weather_api_current.id}"
}

resource "aws_apigatewayv2_integration" "weather_api_historical" {
  api_id = aws_apigatewayv2_api.weather_api.id

  integration_uri    = aws_lambda_function.lambda_weather_api_historical.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "weather_api_historical" {
  api_id = aws_apigatewayv2_api.weather_api.id

  route_key = "GET /weather/history/{city}"
  target    = "integrations/${aws_apigatewayv2_integration.weather_api_historical.id}"
}

resource "aws_cloudwatch_log_group" "api_gw" {
  name = "/aws/api_gw/${aws_apigatewayv2_api.weather_api.name}"

  retention_in_days = 7
}

resource "aws_lambda_permission" "weather_api_current" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_weather_api_current.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.weather_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "weather_api_historical" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_weather_api_historical.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.weather_api.execution_arn}/*/*"
}