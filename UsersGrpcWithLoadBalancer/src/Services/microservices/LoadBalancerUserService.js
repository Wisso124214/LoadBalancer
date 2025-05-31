const AdvancedGrpcServer = require('../../Core/GrpcWrapperServer');
const grpcClient = require('../../Core/GrpcWrapperClient');
const LoadBalancer = require('../../Core/LoadBalancer');
const grpc = require('@grpc/grpc-js');

const { configLoadBalancerUsers } = require('../../../config/configGrpc');

const loadBalancer = new LoadBalancer();
const server = new AdvancedGrpcServer(configLoadBalancerUsers);

// Implementa los métodos del UserService, redirigiendo al microservicio óptimo
server.addMethods({

    registerMicroservice: (call, callback) => {
        console.log('Registro de microservicio recibido:');
        console.log(call.request);
        const config = call.request;
        loadBalancer.record.uploadTable(config); // Agrega el microservicio a la tabla
        callback(null, { success: true });
    },

    updateHeartbeat: (call, callback) => {
        const {address} = call.request;
        const metrics = call.request
        loadBalancer.record.updateHeartbeat(address, metrics);
        loadBalancer.record.removeInactive(); // Limpia microservicios inactivos
        
        callback(null, { success: true });
    },

    redirectCall: (call, callback) => {
        const microservice = loadBalancer.record.getOptimalMicroservice();
        console.log(microservice+"MICROSERVICO\n");
        
        if (!microservice) {
            return callback({
                code: grpc.status.UNAVAILABLE,
                message: 'No available microservices'
            });
        }
        console.log('Redirigiendo llamada a microservicio:', microservice.address);
        path = require('path');

        microservice.protoPath = path.join(__dirname, '../../protos/user.proto');

        const client = new grpcClient(microservice);
       
        const methodName = call.request.methodName;
        let params;

        if(!params)  params = JSON.parse(call.request.params || '{}');
        
        client.call(methodName, params)
        .then(response => {
            callback(null, { result: JSON.stringify(response) });
        })
        .catch(err => {
            callback({
                code: grpc.status.INTERNAL,
                message: err.message || 'Unknown Error'
            });
        });
    },
    // Puedes agregar aquí los demás métodos del UserService igual que arriba
});

setInterval(() => {
    if (loadBalancer.record.tableMicroservices.length === 0) {
        console.log('No hay microservicios registrados. Esperando...');
        return;
    }else {
        loadBalancer.record.removeInactive(); // Limpia microservicios inactivos
        console.log('Estado de los microservicios:');
        loadBalancer.record.showMicroservicesStatus();

        console.log('Microservicios registrados:', loadBalancer.record.tableMicroservices.length);
        console.log(
        'Microservicios activos:',
        loadBalancer.record.tableMicroservices.map(ms => ms.address)
        );
    }
}, 3000); // Cada 15 segundos

server.start().then(info => {
    console.log('Balanceador de carga de usuarios iniciado:', info);
});