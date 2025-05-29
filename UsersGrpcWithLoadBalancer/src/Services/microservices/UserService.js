const grpcServer = require('../../Core/GrpcWrapperServer.js');
const grpcClient = require('../../Core/GrpcWrapperClient.js');
const {configUserService,configLoadBalancerUsers} = require('../../../config/configGrpc.js');
const path = require('path');
const addFakeToken = require('./middelwares/addFakeToken.js');

const server = new grpcServer(configUserService);
const balanceadorClient = new grpcClient(configLoadBalancerUsers);

server.use(addFakeToken);
console.log(configUserService);

balanceadorClient.call('registerMicroservice', configUserService)
  .then(response => {
    console.log('Microservicio registrado en el balanceador de carga:', response);
  })
  .catch(err => {
    console.error('Error al registrar el microservicio en el balanceador de carga:', err);
  });

server.addMethods({
    getAllUsers: (call, callback) => {        
        const metadata = server.createMetadata({ 'fake-token2': call.metadata.fakeToken, "user":"admin" });
        call.sendMetadata(metadata);
        const users = [
            { id: "1", name: "John Doe", email: "jhon@gmail.com" },
            { id: "2", name: "Jane Smith", email: "jane@gmail.com" }
        ];
        successMessage = "Users retrieved successfully"; 
    callback(null,{ users: users, success: {message: successMessage, code: 200} });
    },

})

server.addMethodsWithoutMiddelwares({
    getUserById: (call, callback) => {
        const user = [
            { id: "1", name: "John Doe", email: "jhon@gmail.com" },
            { id: "2", name: "Jane Smith", email: "jane@gmail.com" }
        ];
        
        const userId = call.request.id;

        const userFound = user.find(user => user.id === userId);
        if (userFound) {
            successMessage = "User retrieved successfully"; 
            callback(null, { user: userFound, success: {message: successMessage} });
        } else {
            errorMessage = "User not found";
            callback({
                user : [],
                error: {
                    message: errorMessage,
                    code: 404
                }
            });
        }
    }
})

// Iniciar servidor y ejemplo de shutdown
server.start()
  .then((info) => {
    console.log('Servidor listo:', info);
  })
  .catch(err => console.error('Error:', err));
