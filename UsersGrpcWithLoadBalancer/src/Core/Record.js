const dashboard = require('../utils/panelDashboard.js');
const { configLoadBalancerUsers } = require('../../config/configGrpc.js');

class Record {
    constructor(){
        this.tableMicroservices = [];
        this.acumulator = 0;
    }

    getOptimalMicroservice() {
    if (this.tableMicroservices.length === 0) {
        dashboard.addLog('\n[LoadBalancer] No hay microservicios registrados.\n');
        return null;
    }

    dashboard.addLog('\n[LoadBalancer] Filtrando microservicios viables...');


    const viableMicroservices = this.tableMicroservices.filter(metrics => {
        const m = metrics.metrics || {};
        const cpu = metrics.cpuUsage ?? m.cpuUsage ?? 100;
        const mem = metrics.memoryAvailable ?? m.memoryAvailable ?? 0;
        const act = metrics.activeRequests ?? m.activeRequests ?? Infinity;
        const max = metrics.maxRequests ?? m.maxRequests ?? 0;

        const result = cpu < configLoadBalancerUsers.maxCpuUsage && mem > configLoadBalancerUsers.maxMemoryAvailable && act < max;

        dashboard.addLog(
            `  - ${metrics.address || 'sin address'} | CPU: ${cpu}% | MemAvail: ${mem}% | ActiveReq: ${act} | MaxReq: ${max} | Viable: ${result ? '✅' : '❌'}`
        );
        return result;
    });

    if (viableMicroservices.length === 0) {
        dashboard.addLog('[LoadBalancer] Ningún microservicio es viable.\n');
        dashboard.setPanel5Data(viableMicroservices);
        return null;
    }

    dashboard.addLog(`[LoadBalancer] Microservicios viables: ${viableMicroservices.length}\n`);

    dashboard.setPanel5Data(viableMicroservices);

    const scoredMicroservices = viableMicroservices.map(metrics => {
        const m = metrics.metrics || {};

        const cpuUsage = m.cpuUsage ?? 100;
        const memoryAvailable = m.memoryAvailable ?? 0;
        const avgResponseTime = m.avgResponseTime ?? Infinity;
        const activeRequests = m.activeRequests ?? Infinity;

        const cpuWeight = 0.3;
        const memoryWeight = 0.2;
        const responseTimeWeight = 0.3;
        const activeRequestsWeight = 0.2;

        const cpuScore = (100 - cpuUsage) * cpuWeight;
        const memoryScore = memoryAvailable * memoryWeight;
        const responseTimeScore = (1 / Math.max(avgResponseTime, 1)) * responseTimeWeight * 1000;
        const activeRequestsScore = (1 / (activeRequests + 1)) * activeRequestsWeight * 100;

        const totalScore = cpuScore + memoryScore + responseTimeScore + activeRequestsScore;


        dashboard.addLog(
            `[Scoring] ${metrics.address}: ` +
            `CPU=${cpuScore.toFixed(2)}, Mem=${memoryScore.toFixed(2)}, RT=${responseTimeScore.toFixed(2)}, Act=${activeRequestsScore.toFixed(2)} ` +
            `=> TOTAL=${totalScore.toFixed(2)}`
        );

        return {
            microservice: metrics,
            score: totalScore
        };
    });

    // Orden descendente: mayor score es mejor

    // console.log(scoredMicroservices);

    scoredMicroservices.sort((a, b) => b.score - a.score);

    const elegido = scoredMicroservices[0].microservice;
    dashboard.addLog(`\n[LoadBalancer] Microservicio elegido como óptimo: ${elegido.address}\n`);
    return elegido;
}

showMicroservicesStatus() {
    if (this.tableMicroservices.length === 0) {
        console.log('  Ninguno.\n');
        return;
    }
    dashboard.setPanel3Data(this.tableMicroservices);
    // this.tableMicroservices.forEach((microservice, idx) => {
    //     console.log(
    //         `  [${idx + 1}] ${microservice.address}\n` +
    //         `      Último Heartbeat: ${new Date(microservice.lastHeartbeat).toLocaleTimeString()}\n` +
    //         `      Métricas: ${microservice.metrics ? JSON.stringify(microservice.metrics, null, 2) : 'No metrics available'}\n`
    //     );
    // });
    // console.log('==========================================\n');
}

showMicrosservicesStatusWithMetricsSpecific(address) {
    const microservices = this.tableMicroservices.find(m => m.address === address);
    if (microservices) {
        console.log(
            `\n[LoadBalancer] Microservicio: ${microservices.address}\n` +
            `      Último Heartbeat: ${new Date(microservices.lastHeartbeat).toLocaleTimeString()}\n` +
            `      Métricas: ${microservices.metrics ? JSON.stringify(microservices.metrics, null, 2) : 'No metrics available'}\n`
        );
    } else {
        console.log(`No microservice found with address: ${address}`);
    }
}

    uploadTable(configMicroservice) {
        
    if (configMicroservice) {
        configMicroservice.lastHeartbeat = Date.now();

        let index = -1;

        for (let t in this.tableMicroservices) {
            if (this.tableMicroservices[t].address === configMicroservice.address) index = t;
        }

        if (index === -1) {
            this.tableMicroservices.push(configMicroservice);
            return this.tableMicroservices;
        } else {
            this.tableMicroservices[index] = configMicroservice;
            return this.tableMicroservices;
        }
    }
}

    updateHeartbeat(address, metrics) { 
    
        const record = this.tableMicroservices.find(m => m.address === address);
        if (record) {
            record.lastHeartbeat = Date.now();
            // Actualiza solo las métricas, sin crear un nuevo objeto
            this.uploadTable(metrics)
        }
    }

    // Método para limpiar microservicios inactivos
    removeInactive(thresholdmetrics = 15000) {
        const now = Date.now();
        this.tableMicroservices = this.tableMicroservices.filter(
            m => now - m.lastHeartbeat < thresholdmetrics
        );
    }
}

module.exports = Record;