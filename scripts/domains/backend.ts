import { connect } from 'node:tls';
import { productionSite } from '../../src/config/production';

export const backendHost = 'backend.win3bitco.in';

/** Verify the actual mining WebSocket accepts the canonical website origin over trusted TLS. */
export async function verifyMiningWebSocket(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    let received = '';
    const socket = connect({ host: backendHost, port: 443, servername: backendHost, rejectUnauthorized: true });
    socket.setTimeout(10_000, () => socket.destroy(new Error('Mining WebSocket probe timed out')));
    socket.once('error', reject);
    socket.once('secureConnect', () => socket.write([
      'GET /mining-work HTTP/1.1', `Host: ${backendHost}`, 'Upgrade: websocket', 'Connection: Upgrade',
      'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==', 'Sec-WebSocket-Version: 13',
      `Origin: ${productionSite.origin}`, '', '',
    ].join('\r\n')));
    socket.on('data', chunk => {
      received += chunk.toString();
      if (!received.includes('\r\n\r\n')) return;
      socket.destroy();
      if (!received.startsWith('HTTP/1.1 101 ') || !received.toLowerCase().includes('sec-websocket-accept: s3pplmbitxaq9kygzzhzrbk+xoo=')) {
        reject(new Error('Mining WebSocket upgrade or protocol verification failed'));
        return;
      }
      resolve();
    });
    socket.once('end', () => reject(new Error('Mining WebSocket closed before upgrade')));
  });
}
