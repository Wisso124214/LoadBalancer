let activeRequests = 0;
let responseTimes = [];

/**
 * Middleware para trackear requests y tiempos de respuesta.
 * Úsalo en tu wrapper de middlewares.
 */
async function activeRequestMiddleware(call) {
    activeRequests++;
    const start = Date.now();

    // El handler principal se ejecuta después de todos los middlewares,
    // así que no puedes medir el tiempo exacto aquí.
    // Pero puedes usar un hook en el handler para medir el tiempo real de respuesta.

    // Para solo contar las requests activas:
    // Cuando termine la respuesta, decrementa el contador.
    // Si usas gRPC, puedes hacer esto:
    if (call && call.on) {
        call.on('end', () => {
            const duration = Date.now() - start;
            responseTimes.push(duration);
            activeRequests--;
            if (responseTimes.length > 100) responseTimes.shift();
        });
    } else {
        // fallback por si call no tiene 'on'
        setImmediate(() => {
            const duration = Date.now() - start;
            responseTimes.push(duration);
            activeRequests--;
            if (responseTimes.length > 100) responseTimes.shift();
        });
    }
}

// Funciones para exponer métricas
function getActiveRequests() {
    return activeRequests;
}

function getAvgResponseTime() {
    if (responseTimes.length === 0) return 0;
    return responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
}

module.exports = {
    activeRequestMiddleware,
    getActiveRequests,
    getAvgResponseTime
};