/**
 * Middleware que agrega un token falso al objeto call.metadata
 * @param {Object} call - Objeto de la llamada gRPC
 */
module.exports = async function addFakeToken(call) {
  console.log("Middleware addFakeToken ejecutado");
  
  if (!call.metadata) {
    // Si no existe metadata, la creamos como un objeto simple
    call.metadata = {};
  }
  // Agrega un token falso
  call.metadata.fakeToken = 'FAKE_TOKEN_12345';
};