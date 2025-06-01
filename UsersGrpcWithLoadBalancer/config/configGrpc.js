const path = require('path');

const configLoadBalancerUsers = {
    protoPath: path.join(__dirname, '../src/protos/loadbalancer.proto'),
    packageName: 'loadbalancer',
    serviceName: 'LoadBalancer',
    serverUrl: '192.168.2.104:6000', // URL del balanceador de carga
    address: '192.168.2.104:6000', // Dirección del balanceador de carga
    timeout: 5000, 
    retry: {
        maxRetries: 0, // Deshabilitar reintentos para el balanceador de carga el numero representa el numero de reintentos
        retryDelay: 100, // Tiempo de espera entre reintentos en milisegundos
    },
};

let configUserService = {
    protoPath: path.join(__dirname, '../src/protos/user.proto'),
    packageName: 'users',
    serviceName: 'UserService',
    serverUrl: '192.168.2.104:5000', // URL del microservicio UserService
    address: '192.168.2.104:5000', // Dirección del microservicio UserService
    timeout: 5000, 
    retry: {
        maxRetries: 3, // Número de reintentos para el microservicio UserService
        retryDelay: 1000, // Tiempo de espera entre reintentos en milisegundos
    },
};

module.exports = {
    configLoadBalancerUsers,
    configUserService
};