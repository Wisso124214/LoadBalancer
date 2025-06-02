const express = require('express');
const AdvancedGrpcClient = require('../Core/GrpcWrapperClient');
const {configLoadBalancerUsers} = require('../../config/configGrpc');

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

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor principal escuchando en http://192.168.140.124:${PORT}`);
});