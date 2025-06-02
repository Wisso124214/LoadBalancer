const blessed = require('blessed');
const contrib = require('blessed-contrib');

class PanelDashboard {
  
  constructor() {
    this.microservices = [];
    this.balanceadorInfo = null;
    this.logBuffer = [];
    this.MAX_LOGS = 5000;
    this._autoScroll = true; // Controla el scroll automático
  }

  setBalanceadorInfo(info) {
    this.balanceadorInfo = info;
    const addressOnly = info.address.split(':')[0];

    if (this.panel1) this.panel1.setContent(
      `\n  address: ${addressOnly}\n` +
      `  port: ${info.port}\n` +
      `  services: [\n     ${info.services.join('\n     ')}\n   ]\n` +
      `  middlewares: ${info.middlewares.length ? info.middlewares.join(', ') : '[]'}\n` +
      `  timestamp: ${info.timestamp}\n`);
  }

  setPanel2Data(microservices){
    if (this.panel2) {
      this.panel2.setData({
          headers: [ '     Address',' Status'],
          data: microservices.map(ms => [
          ms.address,
          'Online'
        ])
      });
    }

    if (this.screen) this.screen.render();
  }
  
  setPanel3Data(microservices) {
    if (this.panel3) {
      this.panel3.setData({
          headers: [
          '    Address', '  Heartbeat', 'CPU %', '  Mem %', 'MemAvail %',
          'Resp(ms)', 'RQon', '  Max', ' Uptime'
          ],
          data: microservices.map(ms => [
            ms.address ?? '-',
            ms.lastHeartbeat ?? '-',
            ms.metrics?.cpuUsage ?? '-',
            ms.metrics?.memoryUsage !== undefined ? ms.metrics.memoryUsage.toFixed(2) : '-',
            ms.metrics?.memoryAvailable !== undefined ? ms.metrics.memoryAvailable.toFixed(2) : '-',
            ms.metrics?.avgResponseTime ?? '-',
            ms.metrics?.activeRequests ?? '-',
            ms.metrics?.maxRequests ?? '-',
            ms.metrics?.uptime !== undefined ? ms.metrics.uptime.toFixed(2) : '-'
          ])
      });
    }

    if (this.screen) this.screen.render();
  }

  setPanel5Data(microservices) {
    if (this.panel5) {
      this.panel5.setData({
        headers: [ '     '],
        data: microservices.map(ms => [
          ms.address || "N/A",
        ])
      });
    }
    if (this.screen) this.screen.render();
  }

  addLog(msg) {
    // Verifica si el usuario está al final ANTES de agregar el nuevo log
    if (this.panel4) {
      this._autoScroll = this.panel4.getScrollPerc() === 100;
    }

    this.logBuffer.push(msg);

    if (this.panel4) {
      this.panel4.setContent(this.logBuffer.join('\n'));
      if (this._autoScroll) {
        this.panel4.setScrollPerc(100);
      }
    }
    if (this.screen) this.screen.render();
  }

  start() {

    if (this.screen) return;

    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Paneles de consola'
    });

    this.grid = new contrib.grid({ rows: 12, cols: 12, screen: this.screen });

    this.panel1 = this.grid.set(0, 0, 4, 3, blessed.box, {
      label: 'Balanceador de carga',
      border: 'line',
      style: { border: { fg: 'cyan' }, fg: 'white' }
    });

    this.panel2 = this.grid.set(4, 0, 4, 3, contrib.table, {
      label: 'Microservicios registrados',
      border: 'line',
      style: { border: { fg: 'red' }, fg: 'white' },
      columnSpacing: 6,
      columnWidth: [18, 7]
    });

    this.panel3 = this.grid.set(0, 3, 4, 9, contrib.table, {
      label: 'Estado de los microservicios',
      border: 'line',
      style: { border: { fg: 'green' }, fg: 'white' },
      columnSpacing: 4,
      columnWidth: [18, 14, 4, 7, 10, 8, 4, 5, 10]
    });

    this.panel4 = this.grid.set(4, 3, 8, 9, blessed.box, {
      label: 'Logs',
      border: 'line',
      style: { border: { fg: 'yellow' }, fg: 'white' },
      scrollable: true,
      alwaysScroll: true,
      scrollbar: { ch: ' ', style: { bg: 'yellow' } }
    });

    this.panel5 = this.grid.set(8, 0, 4, 3, contrib.table, {
      label: 'Microservicios viables',
      border: 'line',
      style: { border: { fg: 'magenta' }, fg: 'white' },
      columnSpacing: 6,
      columnWidth: [18]
    });

    this.screen.key(['q', 'C-c'], () => process.exit(0));
    this.panel4.focus(); // Enfoca el panel de logs al iniciar

    // Permite scroll con flechas y PageUp/PageDown en el panel de logs
    this.panel4.key(['up', 'k'], () => this.panel4.scroll(-1));
    this.panel4.key(['down', 'j'], () => this.panel4.scroll(1));
    this.panel4.key(['pageup'], () => this.panel4.scroll(-10));
    this.panel4.key(['pagedown'], () => this.panel4.scroll(10));
    this.panel4.key(['home'], () => this.panel4.scrollTo(0));
    this.panel4.key(['end'], () => {
      this.panel4.scrollTo(this.logBuffer.length);
      this._autoScroll = true; // Si el usuario baja al final, vuelve a activar el auto-scroll
    });

    // Detecta scroll manual para desactivar auto-scroll si el usuario sube
    this.panel4.on('scroll', () => {
      const perc = this.panel4.getScrollPerc();
      this._autoScroll = perc === 100;
    });

    this.screen.render();
  }
}

module.exports = PanelDashboard;