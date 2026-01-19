import 'dotenv/config';

import * as cdk from 'aws-cdk-lib';
import { PipelineStack } from '../lib/stacks/pipeline-stack';

const app = new cdk.App();

new PipelineStack(app, 'PipelineStack', {
  accountId: '',
  region: '',
  name: 'DemoApp'    // Add name of the app here
});