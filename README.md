
# CDK Starter Template

An AWS CDK starter template written in TypeScript, with Cognito, Lambda, API Gateway, and DynamoDB preconfigured for faster project bootstrapping. Includes a GitHub-based CI/CD pipeline with separate `dev` and `prod` environments.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

## Features

- AWS CDK pipeline with separate dev and prod environments.
- GitHub CI/CD using AWS CodePipeline
- Amazon Cognito for authentication
- API Gateway for exposing endpoints
- Lambda for compute
- DynamoDB for persistence
- SQS for messaging service



## Installation

Clone repo

```bash
  git clone https://github.com/rohankshah/cdk-starter-template.git
```

Install packages

```bash
  npm run install
```

## Setup & Deployment Steps

#### Prerequisite: AWS CDK CLI must be installed.

1. Add app name, AWS account ID, and AWS region in `bin/app.ts`.
2. Create a new GitHub repository and push the cloned project to this repository.
3. Generate a GitHub Personal Access Token (PAT) from GitHub settings and store it securely in AWS Secrets Manager as plaintext.
    - This token will be used by the CDK pipeline to access the GitHub repository.
4. Update `cdk.json` with:
    - The ARN of the secret stored in AWS Secrets Manager (under `context.github_token_secret_arn`)
    - The GitHub repository name (under `context.github_repo_name`)
5. Bootstrap your AWS account by running `cdk bootstrap`.
6. Synthesize the CloudFormation templates using `cdk synth`.
7. Deploy the stack by running `cdk deploy`.


## Authors

-   [@rohankshah](https://www.github.com/rohankshah)
