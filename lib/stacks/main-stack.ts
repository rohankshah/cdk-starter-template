import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Storage } from '../constructs/storage';
import { Identity } from '../constructs/identity';
import { Messaging } from '../constructs/messaging';
import { Compute } from '../constructs/compute';
import { Api } from '../constructs/api';

interface StackProps extends cdk.StackProps {
  environment: string;
  name: string
}

export class Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props
    : StackProps) {
    super(scope, id, props);

    const environment = props?.environment;
    const name = props?.name;

    const storage = new Storage(this, 'Storage', { environment, name });
    const identity = new Identity(this, 'Identity', { environment, name });
    const messaging = new Messaging(this, 'Messaging', { environment, name });

    const compute = new Compute(this, 'Compute', {
      environment,
      table: storage.table,
      bucket: storage.bucket,
      queue: messaging.queue,
      userPool: identity.userPool,
      clientId: identity.userPoolClient,
      accountId: this.account
    });

    const api = new Api(this, 'Api', { environment, name, compute, identity, storage, region: this.region });
  }
}
