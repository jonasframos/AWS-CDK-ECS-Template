import ec2 = require('aws-cdk-lib/aws-ec2');

export const networkingConfig = {
    developmentVPC: {
        cidr: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        vpcName: 'DevelopmentVPC',
        subnetConfiguration: [{
            cidrMask: 24,
            name: 'PublicSubnet',
            subnetType: ec2.SubnetType.PUBLIC,
        }]
    },
    productionVPC: {
        cidr: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        maxAzs: 3,
        subnetConfiguration: [{
            cidrMask: 24,
            name: 'PublicSubnet',
            subnetType: ec2.SubnetType.PUBLIC,
        },
        {
            cidrMask: 24,
            name: 'PrivateSubnet',
            subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        }]
    }
}