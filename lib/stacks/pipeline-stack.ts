import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";
import { ManualApprovalStep } from "aws-cdk-lib/pipelines";
import { DevStage } from "../stages/stage-dev";
import { ProdStage } from "../stages/stage-prod";
import * as sm from "aws-cdk-lib/aws-secretsmanager";

interface PipelineStackProps extends StackProps {
  accountId: string | undefined;
  region: string | undefined;
  name: string
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id);

    const appName = props.name.toLowerCase()

    const secretArn = this.node.tryGetContext('github_token_secret_arn');
    const githubRepoName = this.node.tryGetContext('github_repo_name');

    if (!secretArn || !githubRepoName) {
      throw new Error("Missing context variables in cdk.json");
    }
    const secret = sm.Secret.fromSecretCompleteArn(this, 'secret', secretArn);

    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: "Pipeline",
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.gitHub(githubRepoName, "main", {
          authentication: secret?.secretValue,
        }),
        commands: ["npm ci", "npm run build", "npx cdk synth"],
        env: {
          GITHUB_TOKEN_SECRET_ARN: secretArn,
          GITHUB_REPO_NAME: githubRepoName
        }
      }),
    });

    // Dev Stage
    pipeline.addStage(
      new DevStage(this, "Dev", {
        env: { account: this.account, region: this.region },
        name: appName
      })
    );

    // Prod Stage
    pipeline.addStage(
      new ProdStage(this, "Prod", {
        env: { account: this.account, region: this.region },
        name: appName
      }),
      {
        pre: [new ManualApprovalStep("PromoteToProd")],
      }
    );
  }
}
