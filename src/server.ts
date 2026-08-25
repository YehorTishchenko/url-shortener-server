import Fastify from 'fastify';

const fastify = Fastify({
  logger: true
});

// Declare a route
fastify.get('/', function (request, reply) {
  reply.send({ hello: 'world' });
});

// Health check endpoint
fastify.get('/health', async () => {
  return { status: 'ok' };
});

// Run the server!
fastify.listen({ port: 5001, host: '0.0.0.0' }, function (err) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  // Server is now listening on ${address}
});
