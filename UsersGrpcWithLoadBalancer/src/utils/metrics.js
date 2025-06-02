// filepath: c:\Users\Juan\Desktop\Universidad\LoadBalancer\UsersGrpcWithLoadBalancer\src\utils\metrics.js
const os = require('os');
const process = require('process');
const { getActiveRequests, getAvgResponseTime, hasGPU } = require('../Services/microservices/middelwares/activeRequest');

// Calcula el uso de CPU como porcentaje (promedio durante 100ms)
// async function getCpuUsage() {
//     return new Promise(resolve => {
//         const start = process.cpuUsage();
//         const startTime = Date.now();
//         setTimeout(() => {
//             const elapTime = Date.now() - startTime;
//             const elapUsage = process.cpuUsage(start);
//             const elapUserMS = elapUsage.user / 1000;
//             const elapSystMS = elapUsage.system / 1000;
//             const cpuPercent = ((elapUserMS + elapSystMS) / (elapTime * os.cpus().length)) * 100;
//             resolve(Math.max(0, Math.min(100, cpuPercenst)));
//         }, 100);
//     });
// }

function getCPUInfo() {
  const cpus = os.cpus();

  let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;

  cpus.forEach(cpu => {
    user += cpu.times.user;
    nice += cpu.times.nice;
    sys  += cpu.times.sys;
    idle += cpu.times.idle;
    irq  += cpu.times.irq;
  });

  return {
    idle,
    total: user + nice + sys + idle + irq
  };
}
function calculateCPUUsage(interval = 800) {
  return new Promise((resolve) => {
    const start = getCPUInfo();

    setTimeout(() => {
      const end = getCPUInfo();

      const idleDelta = end.idle - start.idle;
      const totalDelta = end.total - start.total;

      const usage = 100 - (100 * idleDelta / totalDelta);
      resolve((usage.toFixed(2) * 10 )>= 100 ? 100 : (usage.toFixed(2) * 10 ));
    }, interval);
  });
}

async function getCurrentMetrics() {
    let cpuUsage = null;
    try {
        cpuUsage = await calculateCPUUsage();
        console.log(`CPU Usage: ${cpuUsage}%`);
        
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