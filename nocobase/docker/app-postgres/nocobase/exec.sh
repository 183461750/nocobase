#!/bin/bash

source .env

docker build -t $FC_DEMO_IMAGE .

./setup.sh

echo iu461750 | docker login -u ${FC_ACCOUNT} --password-stdin registry.${region}.aliyuncs.com

s deploy


#######################

# 测试
s cli fc-api getFunction --serviceName NodejsCustomContainer --functionName nodejs --region ${region}