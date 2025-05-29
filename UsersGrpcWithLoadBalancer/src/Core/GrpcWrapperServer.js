const grpc = require('@grpc/grpc-js');
const AdvancedGrpcWrapper = require('./GrpcWrapperBase');

class AdvancedGrpcServer extends AdvancedGrpcWrapper {
  constructor(config) {
    super(config);
    this.middlewares = [];
    this.server = new grpc.Server();
    this.serviceImpl = {};
    this.service = this.getService(config.serviceName);
  }

  /**
   * Añade middlewares para procesamiento previo
   * @param {Function} middleware - Función middleware
   */
  use(middleware) {
    this.middlewares.push(middleware);
  }

  /**
   * Añade métodos con soporte para middlewares
   * @param {Object} methods - Métodos a implementar
   */
  addMethods(methods) {
    Object.entries(methods).forEach(([name, handler]) => {
      this.serviceImpl[name] = this.wrapHandler(handler); // Envuelve el handler con middlewares
    });
  }

  addMethodsWithoutMiddelwares(methods) {
    Object.entries(methods).forEach(([name, handler]) => {
      this.serviceImpl[name] = handler; // No se envuelve con middlewares
    });
  }

  /**
   * Envuelve el handler con middlewares
   * @param {Function} handler - Handler original
   * @returns {Function} Handler envuelto
   */
  wrapHandler(handler) {
    return async (call, callback) => {
      try {
        // Ejecutar middlewares
        for (const middleware of this.middlewares) {
          await middleware(call);
        }

        // Ejecutar handler principal
        await handler(call, callback);
      } catch (error) {
        const formattedError = this.formatError(error);
        callback(formattedError);
      }
    };
  }

  /**
   * Inicia el servidor con más opciones
   * @param {Object} [options] - Opciones adicionales
   * @returns {Promise<Object>} Información del servidor
   */
  async start(options = {}) {

    this.server.addService(this.service.service, this.serviceImpl);

    return new Promise((resolve, reject) => {
      const credentials = options.secure
        ? this.createSecureCredentials(options.ssl)
        : grpc.ServerCredentials.createInsecure();

      this.server.bindAsync(
        this.config.address || '0.0.0.0:50051',
        credentials,
        (error, port) => {
          if (error) return reject(error);
          
          this.server.start();
          const serverInfo = {
            address: this.config.address,
            port,
            services: Object.keys(this.serviceImpl),
            middlewares: Object.values(this.middlewares).map(m => m.name),
            timestamp: new Date().toISOString()
          };
          
          console.log('Servidor gRPC iniciado:', serverInfo);
          resolve(serverInfo);
        }
      );
    });
  }

  createSecureCredentials(sslConfig) {
    if (!sslConfig || !sslConfig.cert || !sslConfig.key) {
      throw new Error('Configuración SSL incompleta');
    }
    return grpc.ServerCredentials.createSsl(
      sslConfig.rootCerts ? Buffer.from(sslConfig.rootCerts) : null,
      [{
        cert_chain: Buffer.from(sslConfig.cert),
        private_key: Buffer.from(sslConfig.key)
      }],
      sslConfig.checkClientCertificate || false
    );
  }

  async gracefulShutdown(timeout = 5000) {
    const start = Date.now();
    try {
      await new Promise((resolve, reject) => {
        this.server.tryShutdown(() => resolve());
        
        setTimeout(() => {
          this.server.forceShutdown();
          reject(new Error(`Shutdown forzado después de ${timeout}ms`));
        }, timeout);
      });
      
      console.log(`Servidor detenido correctamente (${Date.now() - start}ms)`);
    } catch (error) {
      console.error('Error en shutdown:', error.message);
    }
  }
}

module.exports = AdvancedGrpcServer;