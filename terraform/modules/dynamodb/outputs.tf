output "table_arns" {
  description = "ARNs of all DynamoDB tables"
  value = [
    aws_dynamodb_table.users.arn,
    aws_dynamodb_table.locations.arn,
    aws_dynamodb_table.friendships.arn,
    aws_dynamodb_table.friend_requests.arn,
    aws_dynamodb_table.notifications.arn,
    aws_dynamodb_table.login_logs.arn,
  ]
}

output "table_names" {
  description = "Names of all DynamoDB tables"
  value = {
    users           = aws_dynamodb_table.users.name
    locations       = aws_dynamodb_table.locations.name
    friendships     = aws_dynamodb_table.friendships.name
    friend_requests = aws_dynamodb_table.friend_requests.name
    notifications   = aws_dynamodb_table.notifications.name
    login_logs      = aws_dynamodb_table.login_logs.name
  }
}
