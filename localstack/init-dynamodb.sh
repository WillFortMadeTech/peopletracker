#!/bin/bash

# wait for dynamodb to be ready
sleep 2

# Create Users table
awslocal dynamodb create-table \
  --table-name Users \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=email,AttributeType=S \
    AttributeName=username,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --global-secondary-indexes \
    '[{"IndexName":"email-index","KeySchema":[{"AttributeName":"email","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}},{"IndexName":"username-index","KeySchema":[{"AttributeName":"username","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}]' \
  --billing-mode PAY_PER_REQUEST

# Create LoginLogs table
awslocal dynamodb create-table \
  --table-name LoginLogs \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --global-secondary-indexes \
    '[{"IndexName":"userId-timestamp-index","KeySchema":[{"AttributeName":"userId","KeyType":"HASH"},{"AttributeName":"timestamp","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}]' \
  --billing-mode PAY_PER_REQUEST

# Create FriendRequests table
awslocal dynamodb create-table \
  --table-name FriendRequests \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=senderId,AttributeType=S \
    AttributeName=receiverId,AttributeType=S \
    AttributeName=status,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --global-secondary-indexes \
    '[{"IndexName":"senderId-index","KeySchema":[{"AttributeName":"senderId","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}},{"IndexName":"receiverId-status-index","KeySchema":[{"AttributeName":"receiverId","KeyType":"HASH"},{"AttributeName":"status","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}]' \
  --billing-mode PAY_PER_REQUEST

# Create Friendships table
awslocal dynamodb create-table \
  --table-name Friendships \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --global-secondary-indexes \
    '[{"IndexName":"userId-index","KeySchema":[{"AttributeName":"userId","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}]' \
  --billing-mode PAY_PER_REQUEST

# Create Notifications table
awslocal dynamodb create-table \
  --table-name Notifications \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --global-secondary-indexes \
    '[{"IndexName":"userId-createdAt-index","KeySchema":[{"AttributeName":"userId","KeyType":"HASH"},{"AttributeName":"createdAt","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}]' \
  --billing-mode PAY_PER_REQUEST

# Create Locations table
awslocal dynamodb create-table \
  --table-name Locations \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --global-secondary-indexes \
    '[{"IndexName":"userId-timestamp-index","KeySchema":[{"AttributeName":"userId","KeyType":"HASH"},{"AttributeName":"timestamp","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}]' \
  --billing-mode PAY_PER_REQUEST

# Create S3 bucket for profile images
awslocal s3 mb s3://profile-images

echo "DynamoDB tables created: Users, LoginLogs, FriendRequests, Friendships, Notifications, Locations"
echo "S3 bucket created: profile-images"
