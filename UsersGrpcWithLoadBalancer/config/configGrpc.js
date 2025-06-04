const path = require('path');
const os = require('os');

const localIP = Object.values(os.networkInterfaces()).flat().find(iface => iface.family === 'IPv4' && !iface.internal)?.address;
    
const configLoadBalancerUsers = {
    protoPath: path.join(__dirname, '../src/protos/loadbalancer.proto'),
    packageName: 'loadbalancer',
    serviceName: 'LoadBalancer',
    serverUrl: `192.168.140.124:6000`, // URL del balanceador de carga
    address:  `192.168.140.124:6000`, // Dirección del balanceador de carga
    timeout: 5000, 
    retry: {
        maxRetries: 0, // Deshabilitar reintentos para el balanceador de carga el numero representa el numero de reintentos
        retryDelay: 100, // Tiempo de espera entre reintentos en milisegundos
    },
    maxCpuUsage: 90, // Porcentaje máximo de uso de CPU permitido para el balanceador de carga
    maxMemoryAvailable: 10, // Porcentaje mínimo de memoria disponible permitido para el balanceador de carga
    checkQueueInterval: 100,
    retriesRequest: 5, 
};

const configUserService = {
    protoPath: path.join(__dirname, '../src/protos/user.proto'),
    packageName: 'users',
    serviceName: 'UserService',
    serverUrl:  `192.168.140.124:5000`, // URL del microservicio UserService
    address:  `192.168.140.124:5000`, // Dirección del microservicio UserService
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