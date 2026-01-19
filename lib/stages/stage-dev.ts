import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Stack } from "../stacks/main-stack";

interface DevStageProps extends cdk.StageProps {
  name: string;
}

export class DevStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: DevStageProps) {
    super(scope, id, props);

    const name = props?.name

    new Stack(this, `${name}-dev-stack`, {
      environment: "dev",
      name: name
    });
  }
}
