import cdk = require('aws-cdk-lib');
import s3 = require('aws-cdk-lib/aws-s3');
import ecs = require('aws-cdk-lib/aws-ecs');
import ec2 = require('aws-cdk-lib/aws-ec2');
import iam = require('aws-cdk-lib/aws-iam');
import logs = require('aws-cdk-lib/aws-logs');
import { networkingConfig } from '../config/networking'
import { cloudWatchConfig } from '../config/cloudwatch'
import { iamConfig } from '../config/iam'
import { ecsConfig } from '../config/ecs'
import ecs_patterns = require('aws-cdk-lib/aws-ecs-patterns');

export class AwsCdkEcsTemplateStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /*---------------/
    -      IAM       -
    /---------------*/
    const VPCLogsRole = new iam.Role(this, 'VPCLogsRole', iamConfig.VPCLogsRole);
    const taskDefinitionRole = new iam.Role(this, 'VPCLogsRole', iamConfig.taskDefinitionExecutionRole);
    
    /*---------------/
    -   CloudWatch   -
    /---------------*/
    const developmentVPCLogsGroup = new logs.LogGroup(this, 'developmentVPCLogsGroup', cloudWatchConfig.developmentVPCLogsGroup);
    const productionVPCLogsGroup = new logs.LogGroup(this, 'productionVPCLogsGroup', cloudWatchConfig.productionVPCLogsGroup);

    /*---------------/
    -   Networking   -
    /---------------*/
    const developmentVPC = new ec2.Vpc(this, 'developmentVPC', networkingConfig.developmentVPC)
    developmentVPC.addFlowLog('flowLogCloudWatchDevelopment', {
      destination: ec2.FlowLogDestination.toCloudWatchLogs(developmentVPCLogsGroup, VPCLogsRole),
      trafficType: ec2.FlowLogTrafficType.REJECT
    })

    const productionVPC = new ec2.Vpc(this, 'productionVPC', networkingConfig.productionVPC)
    productionVPC.addFlowLog('flowLogCloudWatchProduction', {
      destination: ec2.FlowLogDestination.toCloudWatchLogs(productionVPCLogsGroup, VPCLogsRole),
      trafficType: ec2.FlowLogTrafficType.ALL
    })

    /*---------------/
    -       ECS      -
    /---------------*/
    const developmentCluster = new ecs.Cluster(this, 'developmentCluster', {
      clusterName:  ecsConfig.developmentCluster.clusterName,
      containerInsights: ecsConfig.developmentCluster.containerInsights,
      enableFargateCapacityProviders: ecsConfig.developmentCluster.enableFargateCapacityProviders,
      vpc: developmentVPC
    });

    const productionCluster = new ecs.Cluster(this, 'productionCluster', {
      clusterName:  ecsConfig.productionCluster.clusterName,
      containerInsights: ecsConfig.productionCluster.containerInsights,
      enableFargateCapacityProviders: ecsConfig.productionCluster.enableFargateCapacityProviders,
      vpc: productionVPC
    });

    const developmentTaskDefinition = new ecs.FargateTaskDefinition(this, 'developmentTaskDefinition', {
      memoryLimitMiB: ecsConfig.developmentTaskDefinition.memoryLimitMiB,
      cpu: ecsConfig.developmentTaskDefinition.cpu,
      ephemeralStorageGiB: ecsConfig.developmentTaskDefinition.ephemeralStorageGiB,
      family: ecsConfig.developmentTaskDefinition.family,
      executionRole: taskDefinitionRole,
      taskRole: taskDefinitionRole
    });
    
    const productionTaskDefinition = new ecs.FargateTaskDefinition(this, 'productionTaskDefinition', {
      memoryLimitMiB: ecsConfig.productionTaskDefinition.memoryLimitMiB,
      cpu: ecsConfig.productionTaskDefinition.cpu,
      ephemeralStorageGiB: ecsConfig.productionTaskDefinition.ephemeralStorageGiB,
      family: ecsConfig.productionTaskDefinition.family,
      executionRole: taskDefinitionRole,
      taskRole: taskDefinitionRole
    });
  }
}