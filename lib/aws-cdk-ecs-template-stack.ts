import cdk = require('aws-cdk-lib');
import ecs = require('aws-cdk-lib/aws-ecs');
import ec2 = require('aws-cdk-lib/aws-ec2');
import iam = require('aws-cdk-lib/aws-iam');
import logs = require('aws-cdk-lib/aws-logs');;

export class AwsCdkEcsTemplateStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /*---------------/
    -      IAM       -
    /---------------*/
    const VPCLogsRole = new iam.Role(this, 'VPCLogsRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      description: 'Role for the VPC flow logs'
    });

    const taskDefinitionRole = new iam.Role(this, 'VPCLogsRole', {
      assumedBy: new iam.ServicePrincipal('ecs.amazonaws.com'),
      description: 'Role for the ECS execution',
      managedPolicies: [
          { managedPolicyArn: 'arn:aws:iam::aws:policy/SecretsManagerReadWrite' },
          { managedPolicyArn: 'arn:aws:iam::aws:policy/CloudWatchFullAccess' },
          { managedPolicyArn: 'arn:aws:iam::aws:policy/AmazonECS_FullAccess' },
          { managedPolicyArn: 'arn:aws:iam::aws:policy/CloudWatchEventsFullAccess' },
          { managedPolicyArn: 'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess' }
      ]
    });
    
    /*---------------/
    -   CloudWatch   -
    /---------------*/
    const developmentVPCLogsGroup = new logs.LogGroup(this, 'developmentVPCLogsGroup', {
      logGroupName: 'VPCLogsDevelopment',
      retention: 3
    });

    const productionVPCLogsGroup = new logs.LogGroup(this, 'productionVPCLogsGroup', {
      logGroupName: 'VPCLogsProduction',
      retention: 14
    });

    const developmentContainerLogsGroup = new logs.LogGroup(this, 'developmentContainerLogsGroup', {
      logGroupName: 'developmentContainerLogsGroup',
      retention: 3
    });

    const productionContainerLogsGroup = new logs.LogGroup(this, 'productionContainerLogsGroup', {
      logGroupName: 'productionContainerLogsGroup',
      retention: 14
    });
    
    /*---------------/
    -   Networking   -
    /---------------*/
    const developmentVPC = new ec2.Vpc(this, 'developmentVPC', {
      cidr: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      vpcName: 'developmentVPC',
      subnetConfiguration: [{
        cidrMask: 24,
        name: 'developmentPublicSubnet',
        subnetType: ec2.SubnetType.PUBLIC,
      }]
    })

    developmentVPC.addFlowLog('flowLogCloudWatchDevelopment', {
      destination: ec2.FlowLogDestination.toCloudWatchLogs(developmentVPCLogsGroup, VPCLogsRole),
      trafficType: ec2.FlowLogTrafficType.REJECT
    })

    const productionVPC = new ec2.Vpc(this, 'productionVPC', {
      cidr: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      vpcName: 'productionVPC',
      maxAzs: 3,
      subnetConfiguration: [{
        cidrMask: 24,
        name: 'productionPublicSubnet',
        subnetType: ec2.SubnetType.PUBLIC,
      },
      {
        cidrMask: 24,
        name: 'productionPrivateSubnet',
        subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
      }]
    })

    productionVPC.addFlowLog('flowLogCloudWatchProduction', {
      destination: ec2.FlowLogDestination.toCloudWatchLogs(productionVPCLogsGroup, VPCLogsRole),
      trafficType: ec2.FlowLogTrafficType.ALL
    })

    /*---------------/
    -       ECS      -
    /---------------*/
    //clusters
    const developmentCluster = new ecs.Cluster(this, 'developmentCluster', {
      clusterName: 'developmentCluster',
      containerInsights: false,
      enableFargateCapacityProviders: true,
      vpc: developmentVPC
    });

    const productionCluster = new ecs.Cluster(this, 'productionCluster', {
      clusterName: 'productionCluster',
      containerInsights: false,
      enableFargateCapacityProviders: true,
      vpc: productionVPC
    });

    //task definitions
    const developmentTaskDefinition = new ecs.FargateTaskDefinition(this, 'developmentTaskDefinition', {
      memoryLimitMiB: 512,
      cpu: 256,
      ephemeralStorageGiB: 10,
      family: 'development',
      executionRole: taskDefinitionRole,
      taskRole: taskDefinitionRole,
    });
    
    const productionTaskDefinition = new ecs.FargateTaskDefinition(this, 'productionTaskDefinition', {
      memoryLimitMiB: 512,
      cpu: 256,
      ephemeralStorageGiB: 10,
      family: 'production',
      executionRole: taskDefinitionRole,
      taskRole: taskDefinitionRole,
    });

    //containers
    developmentTaskDefinition.addContainer('developmentcontainer', {
      image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      containerName: 'developmentcontainer',
      cpu: 256,
      environment: {},
      essential: true,
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost/ || exit 1'],
        retries: 5,
        interval: cdk.Duration.minutes(2),
        startPeriod: cdk.Duration.minutes(2),
        timeout: cdk.Duration.minutes(2)
      },
      logging: ecs.LogDriver.awsLogs({ 
        streamPrefix: '/ecs/developmentcontainer',
        logRetention: logs.RetentionDays.THREE_DAYS,
        logGroup: developmentContainerLogsGroup
      }),
      memoryLimitMiB: 512,
      portMappings: [{
          containerPort: 80,
          hostPort: 0,
          protocol: ecs.Protocol.TCP
      }],
      privileged: true,
      secrets: {},
      workingDirectory: '/'
    });

    productionTaskDefinition.addContainer('productioncontainer', {
      image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      containerName: 'productioncontainer',
      cpu: 256,
      environment: {},
      essential: true,
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost/ || exit 1'],
        retries: 5,
        interval: cdk.Duration.minutes(2),
        startPeriod: cdk.Duration.minutes(2),
        timeout: cdk.Duration.minutes(2)
      },
      logging: ecs.LogDriver.awsLogs({ 
        streamPrefix: '/ecs/productioncontainer',
        logRetention: logs.RetentionDays.THREE_DAYS,
        logGroup: developmentContainerLogsGroup
      }),
      memoryLimitMiB: 512,
      portMappings: [{
          containerPort: 80,
          hostPort: 0,
          protocol: ecs.Protocol.TCP
      }],
      privileged: true,
      secrets: {},
      workingDirectory: '/'
    });

    //services
    const developmentService = new ecs.FargateService(this, 'developmentService', {
      cluster: developmentCluster,
      taskDefinition: developmentTaskDefinition,
      capacityProviderStrategies: [{
        capacityProvider: 'FARGATE_SPOT',
        weight: 1,
      }],
      desiredCount: 1,
      healthCheckGracePeriod: cdk.Duration.minutes(2),
      maxHealthyPercent: 200,
      minHealthyPercent: 100,
      securityGroups: [],
      serviceName: 'developmentService',
      vpcSubnets: {
        subnets: developmentVPC.publicSubnets,
      }
    });

    const productionService = new ecs.FargateService(this, 'productionService', {
      cluster: productionCluster,
      taskDefinition: productionTaskDefinition,
      capacityProviderStrategies: [{
        capacityProvider: 'FARGATE',
        weight: 1,
      }],
      desiredCount: 1,
      healthCheckGracePeriod: cdk.Duration.minutes(2),
      maxHealthyPercent: 200,
      minHealthyPercent: 100,
      securityGroups: [],
      serviceName: 'productionService',
      vpcSubnets: {
        subnets: productionVPC.publicSubnets,
      }
    });
  }
}