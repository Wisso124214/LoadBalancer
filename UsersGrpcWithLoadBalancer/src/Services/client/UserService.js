const grpcClient = require('../../Core/GrpcWrapperClient.js');
const config = require('../../../config/configGrpc.js');

const client = new grpcClient(config);

async function getAllUsers() {
    try {
        const { response, metadata } = await client.call('getAllUsers', {});
        console.log('Usuarios recibidos:', response);
        if (metadata) {
            console.log('Fake token recibido:', metadata);
        }
        return response;
    } catch (error) {
        console.error('Error al obtener todos los usuarios:', error);
        throw error;
    }
}

async function getUserById(userId) {
    try {
        const { response, metadata } = await client.call('getUserById', { id: userId });
        console.log('Usuario recibido:', response);
        if (metadata) {
            console.log('Fake token recibido:', metadata);
        }
        return response;
    } catch (error) {
        console.error('Error al obtener el usuario por ID:', error);
        throw error;
    }
}

getAllUsers()
getUserById('1')