import Fastify from 'fastify';
import { createUrl, findUrlByCode } from './urls/urls.service.ts';

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

interface RedirectParams {
  code: string;
}

// Redirect a short code to its original URL
app.get<{ Params: RedirectParams }>('/:code', async function (request, reply) {
  const { code } = request.params;

  const url = await findUrlByCode(code);

  if (!url) {
    return reply.code(404).send({ error: 'Short code not found' });
  }

  if (url.expiresAt && url.expiresAt < new Date()) {
    return reply.code(410).send({ error: 'Short code has expired' });
  }

  return reply.redirect(url.original, 302);
});
