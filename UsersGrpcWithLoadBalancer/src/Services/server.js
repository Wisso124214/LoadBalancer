const express = require('express');
const AdvancedGrpcClient = require('../Core/GrpcWrapperClient');
const { configLoadBalancerUsers } = require('../../config/configGrpc');
const { server_address } = require('../../config/configServices.js');

const app = express();
app.use(express.json());

// Configuración del cliente gRPC apuntando al balanceador de carga
const grpcClient = new AdvancedGrpcClient(configLoadBalancerUsers);

// Endpoint HTTP que llama al balanceador de carga vía gRPC
app.get('/users', async (req, res) => {
    try {
        const { response } = await grpcClient.call('redirectCall', {
            methodName: 'getAllUsers',
        });
        const data = JSON.parse(response.result);
        res.json(data);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: error.message || error });
    }
});

// Endpoint HTTP que llama al balanceador de carga vía gRPC
app.get('/users/:id', async (req, res) => {
    try {
        const { response } = await grpcClient.call('redirectCall', {
            methodName: 'getUserById',
            params: JSON.stringify({ id: req.params.id }) // <-- serializa aquí
        });
        const data = JSON.parse(response.result);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message || error });
    }
});

// Puedes agregar más endpoints que llamen a otros métodos gRPC si lo necesitas
app.listen(PORT, () => {
    console.log(`Servidor principal escuchando en ${server_address}`);
});