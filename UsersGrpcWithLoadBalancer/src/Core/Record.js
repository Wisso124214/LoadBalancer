class Record {
    constructor(){
        this.tableMicroservices = [];
        this.acumulator = 0;
    }

    getOptimalMicroservice(){
        if (this.tableMicroservices.length === 0) {
            return null;
        }
        // Implementar lógica de selección de microservicio óptimo
        // Por ejemplo, round-robin, least-connections, etc.
        return this.tableMicroservices[this.acumulator]; // Placeholder
    }
    sum(){
        this.acumulator++;
        if (this.acumulator >= this.tableMicroservices.length) {
            this.acumulator = 0; // Reiniciar el acumulador si se supera el número de microservicios
        }
        return this.acumulator;
    }

    showMicroservicesStatus(){
        console.log("Microservices in live:");
        this.tableMicroservices.forEach(microservice => {
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
    removeInactive(thresholdMs = 15000) {
        const now = Date.now();
        this.tableMicroservices = this.tableMicroservices.filter(
            m => now - m.lastHeartbeat < thresholdMs
        );
    }
}

module.exports = Record;