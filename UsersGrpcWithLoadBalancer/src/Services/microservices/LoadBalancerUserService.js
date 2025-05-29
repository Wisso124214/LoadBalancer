const AdvancedGrpcServer = require('../../Core/GrpcWrapperServer');
const grpcClient = require('../../Core/GrpcWrapperClient');
const LoadBalancer = require('../../Core/LoadBalancer');
const grpc = require('@grpc/grpc-js');

const { configLoadBalancerUsers } = require('../../../config/configGrpc');
const { json } = require('express');

const loadBalancer = new LoadBalancer();
const server = new AdvancedGrpcServer(configLoadBalancerUsers);

// Implementa los métodos del UserService, redirigiendo al microservicio óptimo
server.addMethods({

    registerMicroservice: (call, callback) => {
        console.log(call.request);
        const config = call.request;
        loadBalancer.record.uploadTable(config); // Agrega el microservicio a la tabla
        callback(null, { success: true });
    },

    redirectCall: (call, callback) => {
        const microservice = loadBalancer.record.getOptimalMicroservice();
        if (!microservice) {
            return callback({
                code: grpc.status.UNAVAILABLE,
                message: 'No available microservices'
            });
        }
        console.log('Redirigiendo llamada a microservicio:', microservice);
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

server.start().then(info => {
    console.log('Balanceador de carga de usuarios iniciado:', info);
});