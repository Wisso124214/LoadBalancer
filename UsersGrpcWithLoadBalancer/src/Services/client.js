// stressTest.js
const axios = require('axios');

const URL = 'http://192.168.140.124:3000/users'; // Cambia a /users/:id si quieres probar ese endpoint
const CONCURRENCY = 10; // Número de requests simultáneas
const REPETICIONES = 20; // Cuántos lotes de requests lanzar

async function sendRequest(i) {
    try {
        const res = await axios.get(URL);
        console.log(`[${i}] Status: ${res.status}`);
    } catch (err) {
        console.error(`[${i}] Error:`, err.response ? err.response.status : err.message);
    }
}

(async () => {
    for (let rep = 0; rep < REPETICIONES; rep++) {
        const promises = [];
        for (let i = 0; i < CONCURRENCY; i++) {
            promises.push(sendRequest(`${rep}-${i}`));
        }
        await Promise.all(promises);
        console.log(`--- Lote ${rep + 1} terminado ---`);
    }
})();