import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

interface MessagingProps extends cdk.StackProps {
    environment: string;
    name: string
}

export class Messaging extends Construct {
    public readonly queue: sqs.Queue;
    public readonly queueDLQ: sqs.Queue;

    constructor(scope: Construct, id: string, props: MessagingProps) {
        super(scope, id);

        const environment = props.environment
        const name = props.name

        this.queue = new sqs.Queue(this, `${name}DLQ`, {
            queueName: `${name}-${environment}-dlq`,
        });

        this.queueDLQ = new sqs.Queue(this, `${name}Queue`, {
            queueName: `${name}-${environment}-queue`,
            visibilityTimeout: cdk.Duration.seconds(60),
            deadLetterQueue: {
                queue: this.queue,
                maxReceiveCount: 3,
            },
        });
    }
}