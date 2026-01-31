#!/bin/bash

# wait for dynamodb to be ready
sleep 2

awslocal dynamodb create-table \
  --table-name TestTable \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# add test data
awslocal dynamodb put-item \
  --table-name TestTable \
  --item '{"id": {"S": "test-001"}, "name": {"S": "Test Document"}, "active": {"BOOL": true}}'

echo "done"
