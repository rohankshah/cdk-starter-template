import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

interface IdentityProps extends cdk.StackProps {
    environment: string;
    name: string
}

export class Identity extends Construct {
    public readonly userPool: cognito.UserPool;
    public readonly userPoolClient: cognito.UserPoolClient;

    constructor(scope: Construct, id: string, props: IdentityProps) {
        super(scope, id);

        const environment = props.environment
        const name = props.name

        this.userPool = new cognito.UserPool(this, `${name}Pool`, {
            userPoolName: `${name}-${environment}-pool`,
            selfSignUpEnabled: true,
            signInAliases: { email: true },
            autoVerify: { email: true },
            passwordPolicy: { minLength: 6, requireLowercase: false, requireUppercase: false, requireDigits: false, requireSymbols: false },
        });

        this.userPoolClient = this.userPool.addClient(`${name}PoolClient`, {
            authFlows: { userPassword: true, userSrp: true },
            accessTokenValidity: cdk.Duration.minutes(30),
        });
    }
}