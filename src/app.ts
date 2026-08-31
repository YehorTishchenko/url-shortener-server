import Fastify from 'fastify';

export const app = Fastify({
  logger: true
});

// Declare a route
app.get('/', function (request, reply) {
  reply.send({ hello: 'world' });
});

// Health check endpoint
app.get('/health', async () => {
  return { status: 'ok' };
});
