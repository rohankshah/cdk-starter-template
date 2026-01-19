import 'dotenv/config';

import * as cdk from 'aws-cdk-lib';
import { PipelineStack } from '../lib/stacks/pipeline-stack';

const app = new cdk.App();

new PipelineStack(app, 'PipelineStack', {
  accountId: '', // Add your AWS Account ID here (e.g. 123456789012)
  region: '',    // Add the AWS region to deploy to (e.g. us-east-1)
  name: 'DemoApp' // Add your application name here (this will be used to name certain resources)
});
