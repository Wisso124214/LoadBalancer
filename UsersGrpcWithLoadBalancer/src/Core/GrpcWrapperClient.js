const grpc = require('@grpc/grpc-js');
const AdvancedGrpcWrapper = require('./GrpcWrapperBase.js');

class AdvancedGrpcClient extends AdvancedGrpcWrapper {
  constructor(config) {
    super(config);
    this.channelOptions = {
      'grpc.max_receive_message_length': -1, // para enviar mensajes Sin límite de tamaño
      'grpc.max_send_message_length': -1, // para enviar mensajes Sin límite de tamaño
      ...config.channelOptions
    };
    
    this.client = this.createClient();
    this.timeout = config.timeout || 5000;
    this.retryConfig = this.normalizeRetryConfig(config.retry);
  }

  normalizeRetryConfig(retryConfig) {
    const defaults = {
      maxRetries: 3,
      retryDelay: 100,
      retryableStatusCodes: [
        grpc.status.UNAVAILABLE,
        grpc.status.RESOURCE_EXHAUSTED,
        grpc.status.INTERNAL
      ]
    };
    
    return retryConfig ? { ...defaults, ...retryConfig } : defaults;
  }

  createClient() {
    const Service = this.getService(this.config.serviceName);
    return new Service(
      this.config.serverUrl,
      this.config.secure 
        ? this.createSecureCredentials() 
        : grpc.credentials.createInsecure(),
      this.channelOptions
    );
  }

  createSecureCredentials() {
    if (!this.config.ssl) {
      throw new Error('Configuración SSL requerida para conexión segura');
    }
    
    return grpc.credentials.createSsl(
      this.config.ssl.rootCerts ? Buffer.from(this.config.ssl.rootCerts) : null,
      this.config.ssl.privateKey ? Buffer.from(this.config.ssl.privateKey) : null,
      this.config.ssl.certChain ? Buffer.from(this.config.ssl.certChain) : null
    );
  }

  async call(methodName, request, options = {}) {
    const metadata = options.metadata || this.createMetadata();
    const callOptions = this.createCallOptions(options);
    
    let lastError;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await this.executeCall(methodName, request, metadata, callOptions);
      } catch (error) {
        lastError = error;
        
        if (!this.shouldRetry(error)) break;
        if (attempt < this.retryConfig.maxRetries) {
          await this.delay(this.retryConfig.retryDelay * (attempt + 1));
        }
      }
    }
    
    throw this.formatError(lastError);
  }

  shouldRetry(error) {
    return this.retryConfig.retryableStatusCodes.includes(error.code);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  createCallOptions(options) {
    const deadline = new Date();
    deadline.setMilliseconds(deadline.getMilliseconds() + (options.timeout || this.timeout));
    
    return {
      deadline,
      ...options.callOptions
    };
  }

  executeCall(methodName, request, metadata, options) {
  return new Promise((resolve, reject) => {
    let responseMetadata;
    const call = this.client[methodName](request, metadata, options, (error, response) => {
      if (error) return reject(error);
      resolve({ response, metadata: responseMetadata });
    });
    call.on('metadata', (metadata) => {
      responseMetadata = metadata;
    });
  });
}

}

module.exports = AdvancedGrpcClient;