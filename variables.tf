variable "aws_region" {
  description = "AWS region for all resources."

  type    = string
  default = "ap-southeast-2"
}

variable "openweathermap_apikey" {
  description = "API Key to use for Open Weathermap API requests."

  type = string
}