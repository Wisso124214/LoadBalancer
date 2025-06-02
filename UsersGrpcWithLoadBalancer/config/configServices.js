const { configLoadBalancerUsers } = require('./configGrpc');

const configServer = {
  PORT: 3001,
  address: configLoadBalancerUsers.address.split(':')[0],
}
const server_address = `http://${configServer.address}:${configServer.PORT}`;

const configUsersSimulator = {
  // delayBetweenRequests: 1000 / 1000,    // Tiempo entre solicitudes en milisegundos
  endpoint: `${server_address}/users`,
  threads: 100,
}

module.exports = {
  configServer,
  server_address,
  configUsersSimulator,
};