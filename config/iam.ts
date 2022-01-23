import iam = require('aws-cdk-lib/aws-iam');

export const iamConfig = {
    VPCLogsRole: {
        assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
        description: 'Role for the VPC flow logs'
    },
    taskDefinitionExecutionRole: {
        assumedBy: new iam.ServicePrincipal('ecs.amazonaws.com'),
        description: 'Role for the ECS execution',
        managedPolicies: [
            { managedPolicyArn: 'arn:aws:iam::aws:policy/SecretsManagerReadWrite' },
            { managedPolicyArn: 'arn:aws:iam::aws:policy/CloudWatchFullAccess' },
            { managedPolicyArn: 'arn:aws:iam::aws:policy/AmazonECS_FullAccess' },
            { managedPolicyArn: 'arn:aws:iam::aws:policy/CloudWatchEventsFullAccess' },
            { managedPolicyArn: 'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess' }
        ]
    }
}
