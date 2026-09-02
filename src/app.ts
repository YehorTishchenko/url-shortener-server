import Fastify from 'fastify';
import { createUrl } from './urls/urls.service.ts';

export const app = Fastify({
  logger: true
});

interface CreateUrlBody {
  original: string;
}

// Declare a route
app.get('/', function (request, reply) {
  reply.send({ hello: 'world' });
});

// Health check endpoint
app.get('/health', async () => {
  return { status: 'ok' };
});

app.post<{ Body: CreateUrlBody }>('/urls/create', {
  schema: {
    body: {
      type: 'object',
      required: ['original'],
      properties: {
        original: { type: 'string', minLength: 1 }
      }
    }
  }
}, async function (request, reply) {
  const { original } = request.body;

  try {
    new URL(original);
  } catch {
    return reply.code(400).send({ error: 'original must be a valid URL' });
  }

  const result = await createUrl({ original });

  return reply.code(201).send(result);
});
