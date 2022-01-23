export const ecsConfig = {
    developmentCluster: {
        clusterName: 'developmentCluster',
        containerInsights: false,
        enableFargateCapacityProviders: true
    },
    productionCluster: {
        clusterName: 'productionCluster',
        containerInsights: false,
        enableFargateCapacityProviders: true
    },
    developmentTaskDefinition: {
        memoryLimitMiB: 512,
        cpu: 256,
        ephemeralStorageGiB: 10,
        family: 'development',
        executionRole: 'iam',
        taskRole: 'iam'
    },
    productionTaskDefinition: {
        memoryLimitMiB: 512,
        cpu: 256,
        ephemeralStorageGiB: 10,
        family: 'production',
        executionRole: 'iam',
        taskRole: 'iam'
    }
}