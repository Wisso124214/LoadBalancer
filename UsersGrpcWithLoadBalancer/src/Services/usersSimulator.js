'use strict';
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const axios = require('axios');
const { configUsersSimulator } = require('../../config/configServices.js');

if (isMainThread) {
  const threadCount = configUsersSimulator.threads || 2;
  let totalRequests = 0;
  let totalSuccess = 0;
  let totalError = 0;
  const startTime = Date.now();

  console.log(`Simulando usuarios con ${threadCount} hilos...`);

  for (let i = 0; i < threadCount; i++) {
    const worker = new Worker(__filename, { workerData: { id: i } });
    worker.on('message', (msg) => {
      if (msg.type === 'stats') {
        totalRequests += msg.requests;
        totalSuccess += msg.success;
        totalError += msg.error;
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;
        const seconds = Math.floor(elapsedTime / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        console.log(
          `Tiempo transcurrido: ${hours}h ${minutes % 60}m ${seconds % 60}s\n` +
          `Solicitudes contestadas: ${totalRequests}\n` +
          `Respuestas exitosas: ${totalSuccess}\n` +
          `Respuestas erróneas: ${totalError}\n`
        );
      }
    });
    worker.on('error', (err) => { throw err; });
    worker.on('exit', (code) => {
      if (code !== 0) console.error(`Worker ${i} terminó con código ${code}`);
    });
  }
} else {
  let counterRequests = 0;
  let counterSuccessRequests = 0;
  let counterErrorRequests = 0;

  const sendStats = () => {
    parentPort.postMessage({
      type: 'stats',
      requests: counterRequests,
      success: counterSuccessRequests,
      error: counterErrorRequests
    });
    // Reiniciar contadores para el próximo ciclo
    counterRequests = 0;
    counterSuccessRequests = 0;
    counterErrorRequests = 0;
  };

  const request = () => {
    const delay = configUsersSimulator.delayBetweenRequests || 1;
    setTimeout(async () => {
      try {
        await axios.get(configUsersSimulator.endpoint);
        counterSuccessRequests++;
      } catch (error) {
        counterErrorRequests++;
      }
      counterRequests++;
      sendStats();
      request();
    }, delay);
  };

  request();
}