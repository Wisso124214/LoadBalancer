let activeRequests = 0;
let responseTimes = [];

function activeRequestMiddleware(call) {
    activeRequests++;
    console.log(`[activeRequestMiddleware] Incrementa: activeRequests = ${activeRequests}`);
    const start = Date.now();

    if (call && call.on) {
        call.on('end', () => {
            const duration = Date.now() - start;
            responseTimes.push(duration);
            activeRequests--;
            console.log(`[activeRequestMiddleware] Decrementa (end): activeRequests = ${activeRequests}`);
            if (responseTimes.length > 100) responseTimes.shift();
        });
    }
}

function decrementActiveRequests() {
    activeRequests--;
    console.log(`[decrementActiveRequests] Decrementa (callback): activeRequests = ${activeRequests}`);
}

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
    getAvgResponseTime,
    decrementActiveRequests
};