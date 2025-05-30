const grpcServer = require('../../Core/GrpcWrapperServer.js');
const grpcClient = require('../../Core/GrpcWrapperClient.js');
const { configUserService, configLoadBalancerUsers } = require('../../../config/configGrpc.js');
const metrics = require('../../utils/metrics.js');
const { activeRequestMiddleware } = require('./middelwares/activeRequest.js');
const addFakeToken = require('./middelwares/addFakeToken.js');

const server = new grpcServer(configUserService);
const balanceadorClient = new grpcClient(configLoadBalancerUsers);

server.use(addFakeToken);
server.use(activeRequestMiddleware);

(async () => {
    // Espera a obtener las métricas reales
    const currentMetrics = await metrics.getCurrentMetrics();

    console.log(configUserService);
    configUserService.metrics = currentMetrics;

    balanceadorClient.call('registerMicroservice', configUserService)
        .then(response => {
            console.log('Microservicio registrado en el balanceador de carga:', response);
        })
        .catch(err => {
            console.error('Error al registrar el microservicio en el balanceador de carga:', err);
        });

    server.addMethods({
        getAllUsers: (call, callback) => {
            const metadata = server.createMetadata({ 'fake-token2': call.metadata.fakeToken, "user": "admin" });
            call.sendMetadata(metadata);
            const users = [
                { id: "1", name: "John Doe", email: "jhon@gmail.com" },
                { id: "2", name: "Jane Smith", email: "jane@gmail.com" }
            ];
            const successMessage = "Users retrieved successfully";
            callback(null, { users: users, success: { message: successMessage, code: 200 } });
        },
    });

    server.addMethodsWithoutMiddelwares({
        getUserById: (call, callback) => {
            const user = [
                { id: "1", name: "John Doe", email: "jhon@gmail.com" },
                { id: "2", name: "Jane Smith", email: "jane@gmail.com" }
            ];

            const userId = call.request.id;
            const userFound = user.find(user => user.id === userId);
            if (userFound) {
                const successMessage = "User retrieved successfully";
                callback(null, { user: userFound, success: { message: successMessage } });
            } else {
                const errorMessage = "User not found";
                callback({
                    user: [],
                    error: {
                        message: errorMessage,
                        code: 404
                    }
                });
            }
        }
    });

    setInterval(() => {
        balanceadorClient.call('updateHeartbeat', configUserService)
        .then(response => {
            console.log('Heartbeat actualizado en el balanceador de carga:', response);
        })
        .catch(err => {
            console.error('Error al actualizar el heartbeat en el balanceador de carga:', err);
        });
    }, 15000); // Actualiza el heartbeat cada 15 segundos

    // Iniciar servidor y ejemplo de shutdown
    server.start()
        .then((info) => {
            console.log('Servidor listo:', info);
        })
        .catch(err => console.error('Error:', err));
})();