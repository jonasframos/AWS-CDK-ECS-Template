export const cloudWatchConfig = {
    developmentVPCLogsGroup: {
        logGroupName: 'VPCLogsDevelopment',
        retention: 3
    },
    productionVPCLogsGroup: {
        logGroupName: 'VPCLogsProduction',
        retention: 14
    }
}