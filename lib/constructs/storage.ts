import { Construct } from "constructs";
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";

interface StorageProps extends cdk.StackProps {
    environment: string;
    name: string
}

export class Storage extends Construct {
    public readonly table: dynamodb.Table;
    public readonly bucket: s3.Bucket;

    constructor(scope: Construct, id: string, props: StorageProps) {
        super(scope, id);

        const environment = props.environment
        const name = props.name

        this.table = new dynamodb.Table(this, `${name}Table`, {
            partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
            removalPolicy: environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
        });

        this.table.addGlobalSecondaryIndex({
            indexName: "GSI_Inverted",
            partitionKey: { name: "SK", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "PK", type: dynamodb.AttributeType.STRING },
        });

        this.bucket = new s3.Bucket(this, "Bucket", {
            bucketName: `${name}-${environment}-bucket`,
            cors: [{
                allowedOrigins: ['*'],
                allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
                allowedHeaders: ['*'],
                exposedHeaders: ['ETag'],
            }],
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        });
    }
}