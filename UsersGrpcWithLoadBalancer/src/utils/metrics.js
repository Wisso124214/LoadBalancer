// filepath: c:\Users\Juan\Desktop\Universidad\LoadBalancer\UsersGrpcWithLoadBalancer\src\utils\metrics.js
const os = require('os');
const process = require('process');
const { exec } = require('child_process');
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
async function getCpuUsageWindows() {
    return new Promise((resolve, reject) => {
        exec('wmic cpu get loadpercentage', (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                reject(`Stderr: ${stderr}`);
                return;
            }
            const match = stdout.match(/(\d+)/);
            if (!match) {
                reject('No se pudo extraer el porcentaje de CPU.');
                return
            }
                resolve(parseInt(match[1], 10));
        });
    });
}
async function getCurrentMetrics() {
    let cpuUsage = null;
    try {
        cpuUsage = await getCpuUsageWindows();
    } catch (err) {
        console.error('Error obteniendo CPU:', err);
        cpuUsage = 100;
    }
    return {
        cpuUsage,
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