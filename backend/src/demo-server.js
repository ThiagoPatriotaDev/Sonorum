if (process.env.NODE_ENV==='production') throw Error('O modo de demonstração é proibido em produção.');
process.env.SONORUM_ENABLE_DEMO_ADMIN='1';
process.env.HOST='127.0.0.1';
await import('./server.js');
