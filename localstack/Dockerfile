FROM localstack/localstack:latest

COPY init-dynamodb.sh /etc/localstack/init/ready.d/
RUN chmod +x /etc/localstack/init/ready.d/init-dynamodb.sh

ENV SERVICES=dynamodb
