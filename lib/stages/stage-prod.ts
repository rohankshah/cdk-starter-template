import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Stack } from "../stacks/main-stack";

interface ProdStageProps extends cdk.StageProps {
    name: string;
}

export class ProdStage extends cdk.Stage {
    constructor(scope: Construct, id: string, props: ProdStageProps) {
        super(scope, id, props);

        const name = props?.name

        new Stack(this, `${name}-prod-stack`, {
            environment: "prod",
            name: name
        });
    }
}
