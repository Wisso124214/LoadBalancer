class Record {
    constructor(){
        this.tableMicroservices = [];
        this.acumulator = 0;
    }

    getOptimalMicroservice() {
        if (this.tableMicroservices.length === 0) {
            return null;
        }

        // Filtramos microservicios que no cumplen con requisitos mínimos
        const viableMicroservices = this.tableMicroservices.filter(metrics => {
    const cpu = metrics.cpuUsage !== undefined ? metrics.cpuUsage : (metrics.metrics ? metrics.metrics.cpuUsage : undefined);
    const mem = metrics.memoryUsage !== undefined ? metrics.memoryUsage : (metrics.metrics ? metrics.metrics.memoryUsage : undefined);
    const act = metrics.activeRequests !== undefined ? metrics.activeRequests : (metrics.metrics ? metrics.metrics.activeRequests : undefined);
    const max = metrics.maxRequests !== undefined ? metrics.maxRequests : (metrics.metrics ? metrics.metrics.maxRequests : undefined);

    const result = cpu < 90 && mem > 10 && act < max;
    console.log(`[Filtro] Microservicio ${metrics.address || 'sin address'}: cpuUsage=${cpu}, memoryUsage=${mem}, activeRequests=${act}, maxRequests=${max} => ${result}`);
    return result;
});
console.log(`Viable microservices: ${viableMicroservices.length}`);
        

        if (viableMicroservices.length === 0) {
            return null; // Todos los microservicios están sobrecargados
        }

        // Calculamos un score para cada microservicio viable
        const scoredMicroservices = viableMicroservices.map(metrics => {
            // Pesos para cada métrica (ajustables según necesidades)
            const cpuWeight = 0.3;
            const memoryWeight = 0.2;
            const responseTimeWeight = 0.3;
            const activeRequestsWeight = 0.2;

            // Normalizamos los valores (a menor valor, mejor)
            const cpuScore = (100 - metrics.cpuUsage) * cpuWeight;
            const memoryScore = metrics.memoryUsage * memoryWeight;
            const responseTimeScore = (1 / Math.max(metrics.avgResponseTime, 1)) * responseTimeWeight * 1000;
            const activeRequestsScore = (1 / (metrics.activeRequests + 1)) * activeRequestsWeight * 100;

            const totalScore = cpuScore + memoryScore + responseTimeScore + activeRequestsScore;

            return {
                microservice: metrics,
                score: totalScore
            };
        });

        // Ordenamos por score descendente
        scoredMicroservices.sort((a, b) => b.score - a.score);

        // Seleccionamos el microservicio con mayor score
        return scoredMicroservices[0].microservice;
    }

    showMicroservicesStatus(){
        console.log("Microservices in live:");
        this.tableMicroservices.forEach(microservice => {
            console.log(microservice);
            
            console.log(`Address: ${microservice.address}, 
Last Heartbeat: ${new Date(microservice.lastHeartbeat)}, 
Metrics: ${microservice.metrics ? JSON.stringify(microservice.metrics) : 'No metrics available'}`);
        });
    }

    showMicrosservicesStatusWithMetricsSpecific(address){
        const microservices = this.tableMicroservices.find(m => m.address === address);
        if (microservices) {
            console.log(`Address: ${microservices.address}, 
                Last Heartbeat: ${new Date(microservices.lastHeartbeat)}, 
                Metrics: ${microservices.metrics ? JSON.stringify(microservices.metrics) : 'No metrics available'}`);
        } else {
            console.log(`No microservice found with address: ${address}`);
        }
    }

    uploadTable(configMicroservice){
        if(configMicroservice){
            configMicroservice.lastHeartbeat = Date.now();
            this.tableMicroservices.push(configMicroservice);
        }
    }

    updateHeartbeat(address, metrics) {
        const record = this.tableMicroservices.find(m => m.address === address);
        if (record) {
            record.lastHeartbeat = Date.now();
            Object.assign(record, metrics); // actualiza métricas
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