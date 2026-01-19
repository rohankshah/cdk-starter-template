import * as cdk from 'aws-cdk-lib';
import * as apiGateway from "aws-cdk-lib/aws-apigatewayv2";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from 'constructs';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Compute } from './compute';
import { Identity } from './identity';
import { HttpJwtAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { Storage } from './storage';

interface ApiProps extends cdk.StackProps {
    environment: string;
    name: string;
    compute: Compute;
    identity: Identity;
    storage: Storage;
    region: string
}

export class Api extends Construct {
    public readonly api: apiGateway.HttpApi;

    constructor(scope: Construct, id: string, props: ApiProps) {
        super(scope, id);

        const environment = props.environment
        const name = props.name

        this.api = new apiGateway.HttpApi(this, "Api", {
            apiName: `${name}-${environment}-api`,
            corsPreflight: {
                allowHeaders: ["*"],
                allowMethods: [
                    apiGateway.CorsHttpMethod.GET,
                    apiGateway.CorsHttpMethod.HEAD,
                    apiGateway.CorsHttpMethod.OPTIONS,
                    apiGateway.CorsHttpMethod.POST,
                ],
                allowOrigins: ["*"],
                allowCredentials: false,
                maxAge: cdk.Duration.seconds(300),
            },
        })

        const authIntegration = new HttpLambdaIntegration(
            "authIntegration",
            props.compute.authLambda
        );
        const userIntegration = new HttpLambdaIntegration(
            "userIntegration",
            props.compute.userLambda
        );

        const issuer = `https://cognito-idp.${props.region}.amazonaws.com/${props.identity.userPool.userPoolId}`;

        const audience = props.identity.userPoolClient.userPoolClientId;

        const compAuthorizer = new HttpJwtAuthorizer("CognitoAuthorizer", issuer, {
            jwtAudience: [audience],
        });

        this.api.addRoutes({
            path: "/api/auth/{proxy+}",
            methods: [apiGateway.HttpMethod.POST],
            integration: authIntegration,
        });

        this.api.addRoutes({
            path: "/api/user/{proxy+}",
            methods: [apiGateway.HttpMethod.POST],
            integration: userIntegration,
            authorizer: compAuthorizer,
        });


        new cdk.CfnOutput(this, "ApiUrl", {
            value: this.api.apiEndpoint,
        });

        const authLambdaUrl = props.compute.authLambda.addFunctionUrl({
            authType: lambda.FunctionUrlAuthType.NONE,
        });
        const userLambdaUrl = props.compute.userLambda.addFunctionUrl({
            authType: lambda.FunctionUrlAuthType.NONE,
        });

        new cdk.CfnOutput(this, "AuthLambdaUrlOutput", {
            value: authLambdaUrl.url,
        });
        new cdk.CfnOutput(this, "UserLambdaUrlOutput", {
            value: userLambdaUrl.url,
        });

        new cdk.CfnOutput(this, "CompBucketName", {
            value: props.storage.bucket.bucketName,
        });
    }
}