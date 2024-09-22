// We will store this so that we can inspect the code or use it elsewhere
output "lambda_bucket_name" {
  description = "Name of the S3 bucket used to store built code."
  value       = aws_s3_bucket.lambda_bucket.id
}

// We will store this so we can test deployment directly
output "api_gateway_root" {
  description = "URL of the deployed root for the API."
  value       = aws_apigatewayv2_stage.weather_api.invoke_url
}

output "api_request_table" {
  description = "Name of the DynamoDB table storing request values."
  value       = aws_dynamodb_table.api_request_table.name
}