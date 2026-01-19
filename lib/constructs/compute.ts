import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as path from 'path';
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from 'constructs';

interface ComputeProps {
    environment: string;
    table: dynamodb.ITable;
    bucket: s3.IBucket;
    queue: sqs.IQueue;
    userPool: cognito.IUserPool;
    clientId: cognito.IUserPoolClient;
    accountId: string;
}

export class Compute extends Construct {
    public readonly authLambda: lambda.Function;
    public readonly userLambda: lambda.Function;
    public readonly emailWorker: lambda.Function;

    constructor(scope: Construct, id: string, props: ComputeProps) {
        super(scope, id);

        const bundlingConfig = {
            image: lambda.Runtime.PYTHON_3_10.bundlingImage,
            command: [
                "bash", "-c",
                "pip install -r requirements.txt -t /asset-output && cp -au . /asset-output",
            ],
            user: "root",
        };

        const apiLambdaProps = {
            runtime: lambda.Runtime.PYTHON_3_10,
            handler: "lambda_function.lambda_handler",
            timeout: cdk.Duration.seconds(30),
            environment: {
                TABLE_NAME: props.table.tableName,
                UPLOAD_BUCKET: props.bucket.bucketName,
                EMAIL_QUEUE_URL: props.queue.queueUrl,
                USER_POOL_ID: props.userPool.userPoolId,
                CLIENT_ID: props.clientId.userPoolClientId
            },
        };

        this.authLambda = new lambda.Function(this, 'AuthLambda', {
            ...apiLambdaProps,
            code: lambda.Code.fromAsset(path.join(__dirname, "../../src/auth"), { bundling: bundlingConfig }),
        });

        this.userLambda = new lambda.Function(this, 'UserLambda', {
            ...apiLambdaProps,
            code: lambda.Code.fromAsset(path.join(__dirname, "../../src/user"), { bundling: bundlingConfig }),
        });

        this.emailWorker = new lambda.Function(this, 'EmailWorker', {
            runtime: lambda.Runtime.PYTHON_3_10,
            handler: "lambda_function.lambda_handler",
            code: lambda.Code.fromAsset(path.join(__dirname, "../../src/email_worker"), { bundling: bundlingConfig }),
            timeout: cdk.Duration.seconds(30),
        });

        // SQS Trigger
        this.emailWorker.addEventSource(new lambdaEventSources.SqsEventSource(props.queue, {
            batchSize: 10,
            reportBatchItemFailures: true
        }));

        props.table.grantReadWriteData(this.authLambda);
        props.table.grantReadWriteData(this.userLambda);
        props.bucket.grantReadWrite(this.authLambda);
        props.bucket.grantReadWrite(this.authLambda);
        props.queue.grantSendMessages(this.authLambda);
        props.queue.grantSendMessages(this.userLambda);

        props.queue.grantConsumeMessages(this.emailWorker);


        props.table.grantReadData(this.authLambda)
        props.table.grantReadData(this.userLambda)

        this.authLambda.addEnvironment("EMAIL_QUEUE_URL", props.queue.queueUrl);
        this.userLambda.addEnvironment("EMAIL_QUEUE_URL", props.queue.queueUrl);

        this.authLambda.addEnvironment("UPLOAD_BUCKET", props.bucket.bucketName);
        this.userLambda.addEnvironment("UPLOAD_BUCKET", props.bucket.bucketName);

        const sharedResources = [
            props.userPool.userPoolArn,
            props.table.tableArn,
            props.bucket.bucketArn,
            props.bucket.arnForObjects('*'),
            `arn:aws:ses:ap-south-1:${props.accountId}:identity/*`,
        ];

        const commonActions = [
            'cognito-idp:AdminGetUser',
            'cognito-idp:ListUsers',
            'dynamodb:*',
            's3:PutObject',
            's3:GetObject',
            's3:ListBucket',
        ];


        this.authLambda.addToRolePolicy(
            new iam.PolicyStatement({
                actions: [
                    ...commonActions,
                    'cognito-idp:AdminConfirmSignUp',
                    'cognito-idp:AdminCreateUser',
                    'cognito-idp:AdminSetUserPassword',
                ],
                resources: sharedResources,
            })
        );

        this.userLambda.addToRolePolicy(
            new iam.PolicyStatement({
                actions: commonActions,
                resources: sharedResources,
            })
        );

    }
}