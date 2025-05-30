// filepath: c:\Users\Juan\Desktop\Universidad\LoadBalancer\UsersGrpcWithLoadBalancer\src\utils\metrics.js
const os = require('os');
const process = require('process');
const { getActiveRequests, getAvgResponseTime, hasGPU } = require('../Services/microservices/middelwares/activeRequest');

// Calcula el uso de CPU como porcentaje (promedio durante 100ms)
async function getCpuUsage() {
    return new Promise(resolve => {
        const start = process.cpuUsage();
        const startTime = Date.now();
        setTimeout(() => {
            const elapTime = Date.now() - startTime;
            const elapUsage = process.cpuUsage(start);
            const elapUserMS = elapUsage.user / 1000;
            const elapSystMS = elapUsage.system / 1000;
            const cpuPercent = ((elapUserMS + elapSystMS) / (elapTime * os.cpus().length)) * 100;
            resolve(Math.max(0, Math.min(100, cpuPercent)));
        }, 100);
    });
}

async function getCurrentMetrics() {
    return {
        cpuUsage: await getCpuUsage(),
        memoryUsage: (1 - (os.freemem() / os.totalmem())) * 100,
        memoryAvailable: (os.freemem() / os.totalmem()) * 100,
        avgResponseTime: getAvgResponseTime(),
        activeRequests: getActiveRequests(),
        maxRequests: 100,
        hasGPU: typeof hasGPU === 'function' ? hasGPU() : false,
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        nodeVersion: process.version
    };
}

module.exports = { getCurrentMetrics };