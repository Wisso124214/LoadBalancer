const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const fs = require('fs');

class AdvancedGrpcWrapper {
  /**
   * Constructor avanzado con mejor manejo de configuraciones
   * @param {Object} config - Configuración extendida
   * @param {string|string[]} config.protoPath - Ruta(s) a archivos .proto
   * @param {string} config.packageName - Nombre del paquete proto
   * @param {Object} [config.options] - Opciones extendidas
   */
  constructor(config) {
    this.validateConfig(config);
    this.config = this.normalizeConfig(config);
    this.cache = new Map();
    this.loadedPackage = this.loadProto();
  }

  validateConfig(config) {
    if (!config.protoPath) throw new Error('protoPath es requerido');
    if (!config.packageName) throw new Error('packageName es requerido');
  }

  normalizeConfig(config) {
    const defaultOptions = {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    };

    return {
      ...config,
      protoOptions: { ...defaultOptions, ...config.protoOptions },
      protoPath: Array.isArray(config.protoPath) 
        ? config.protoPath 
        : [config.protoPath]
    };
  }

  /**
   * Carga los protos con caché y manejo de dependencias
   */
  loadProto() {
    const cacheKey = this.config.protoPath.join('|');
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // Verificar existencia de archivos
    this.config.protoPath.forEach(protoPath => {
      if (!fs.existsSync(protoPath)) {
        throw new Error(`Archivo proto no encontrado: ${protoPath}`);
      }
    });

    const packageDefinition = protoLoader.loadSync(this.config.protoPath, {
      ...this.config.protoOptions,
      includeDirs: this.config.includeDirs
    });

    const loadedPackage = grpc.loadPackageDefinition(packageDefinition);
    this.cache.set(cacheKey, loadedPackage);
    
    return loadedPackage;
  }

  /**
   * Obtiene el servicio con validación
   * @param {string} serviceName - Nombre del servicio
   * @returns {Object} Servicio gRPC
   */
  getService(serviceName) {
    if (!this.loadedPackage[this.config.packageName]) {
      throw new Error(`Paquete '${this.config.packageName}' no encontrado`);
    }

    const service = this.loadedPackage[this.config.packageName][serviceName];
    if (!service) {
      throw new Error(`Servicio '${serviceName}' no encontrado`);
    }

    return service;
  }

  /**
   * Crea metadata con valores por defecto
   * @param {Object} [metadata] - Metadatos adicionales
   * @returns {grpc.Metadata}
   */
  createMetadata(metadata = {}) {
    const defaultMetadata = {
      'x-request-id': uuidv4(),
      'x-timestamp': Date.now()
    };

    const md = new grpc.Metadata();
    Object.entries({ ...defaultMetadata, ...metadata }).forEach(([key, value]) => {
      md.set(key, String(value));
    });

    return md;
  }

  /**
   * Manejo de errores gRPC estandarizado
   * @param {Error} error - Error original
   * @returns {Object} Error formateado
   */
  formatError(error) {
    return {
      code: error.code || grpc.status.INTERNAL,
      message: error.message,
      details: error.details || null
    };
  }
}

// Implementación de UUID simple para el ejemplo
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

module.exports = AdvancedGrpcWrapper;