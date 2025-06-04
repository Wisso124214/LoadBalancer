const AdvancedGrpcServer = require('../../Core/GrpcWrapperServer');
const grpcClient = require('../../Core/GrpcWrapperClient');
const LoadBalancer = require('../../Core/LoadBalancer');
const grpc = require('@grpc/grpc-js');

const { configLoadBalancerUsers } = require('../../../config/configGrpc');

const loadBalancer = new LoadBalancer();
const server = new AdvancedGrpcServer(configLoadBalancerUsers);

let requestsQueue = [];

const addRequestToQueue = (call, callback, retries = 0) => {
    requestsQueue.push({ call, callback, retries });
    const response = 'Llamada agregada a la cola. Total en cola: ' + requestsQueue.length;
    console.log(response);
    
    if (requestsQueue.length === 1) {
        console.log('Procesando la primera llamada en la cola...');
        processQueue();
    }
};

const processQueue = () => {
    if (requestsQueue.length === 0) {
        const message = 'No hay llamadas en la cola para procesar.';
        console.log(message);
        return {
            code: grpc.status.OK,
            message: message
        };
    }

    const { call, callback, retries } = requestsQueue.shift();
    console.log('Procesando llamada de la cola. Llamadas restantes:', requestsQueue.length);

    const microservice = loadBalancer.record.getOptimalMicroservice();
    
    if (!microservice) {
        console.log('No hay microservicios disponibles.');
        if (retries < configLoadBalancerUsers.retriesRequest) {
            console.log(' Reintentando...', retries)
            addRequestToQueue(call, callback, retries + 1);
        }

        return callback({
            code: grpc.status.UNAVAILABLE,
            message: 'No hay microservicios disponibles en este momento.'
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

    setTimeout(() => {
        processQueue();
    }, 100);
};

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
        addRequestToQueue(call, callback);
    },
    // Puedes agregar aquí los demás métodos del UserService igual que arriba
});

setInterval(() => {
    if (loadBalancer.record.tableMicroservices.length === 0) {
        console.log('No hay microservicios registrados. Esperando...');
        return;
    } else {
        loadBalancer.record.removeInactive(); // Limpia microservicios inactivos
        console.log('=== Estado de los microservicios ===');
        loadBalancer.record.showMicroservicesStatus();

        // console.log(`Total registrados: ${loadBalancer.record.tableMicroservices.length}`);
        // console.log('Microservicios activos:');
        // loadBalancer.record.tableMicroservices.forEach((ms, idx) => {
        //     console.log(
        //         `  [${idx + 1}] ${ms.address} | Último heartbeat: ${new Date(ms.lastHeartbeat).toLocaleTimeString()}`
        //     );
        // });
        // console.log('====================================\n');
    }
}, 5000); // Cada 5 segundos

server.start().then(info => {
    console.log('Balanceador de carga de usuarios iniciado:', info);
});