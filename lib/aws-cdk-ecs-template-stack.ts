import cdk = require('aws-cdk-lib');
import s3 = require('aws-cdk-lib/aws-s3');
import ecs = require('aws-cdk-lib/aws-ecs');
import ec2 = require('aws-cdk-lib/aws-ec2');
import iam = require('aws-cdk-lib/aws-iam');
import logs = require('aws-cdk-lib/aws-logs');
import { networkingConfig } from '../config/networking'
import ecs_patterns = require('aws-cdk-lib/aws-ecs-patterns');

export class AwsCdkEcsTemplateStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /*---------------/
    -      IAM       -
    /---------------*/
    const VPCLogsRole = new iam.Role(this, 'VPCFlowLogsRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com')
    });
    
    /*---------------/
    -   CloudWatch   -
    /---------------*/
    const VPCLogsGroupDevelopment = new logs.LogGroup(this, 'VPCLogsGroupDevelopment');
    const VPCLogsGroupProduction = new logs.LogGroup(this, 'VPCLogsGroupProduction');

    /*---------------/
    -   Networking   -
    /---------------*/
    const developmentVPC = new ec2.Vpc(this, 'developmentVPC', networkingConfig.developmentVPC)
    developmentVPC.addFlowLog('FlowLogS3Development', {
      destination: ec2.FlowLogDestination.toCloudWatchLogs(VPCLogsGroupDevelopment, VPCLogsRole),
      trafficType: ec2.FlowLogTrafficType.REJECT
    })

    const productionVPC = new ec2.Vpc(this, 'productionVPC', networkingConfig.productionVPC)
    productionVPC.addFlowLog('FlowLogS3Production', {
      destination: ec2.FlowLogDestination.toCloudWatchLogs(VPCLogsGroupProduction, VPCLogsRole),
      trafficType: ec2.FlowLogTrafficType.ALL
    })
  }
}