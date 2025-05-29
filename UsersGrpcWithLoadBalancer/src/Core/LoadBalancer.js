const Record = require('./Record');
const grpcClient = require('../Core/GrpcWrapperClient.js');

class LoadBalancer {
    constructor() {
        this.record = new Record();
        this.config = {
            maxRetries: 3,
            retryDelay: 1000,
            timeout: 5000,
            loadBalancingStrategy: 'roundRobin', // roundRobin, leastConnections, random
        };
    }

    balanceCall(){
        console.log(1);
        
        const microservice = this.record.getOptimalMicroservice();
        console.log(microservice);

    }

}

// ejemplo de uso
const loadBalancer = new LoadBalancer();
loadBalancer.balanceCall();

module.exports = LoadBalancer;