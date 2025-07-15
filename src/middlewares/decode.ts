import { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export async function decodeJwt(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.cookies?.token;

    if (!token) {
      return reply.status(401).send({ error: 'Authorization token missing' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    (request as any).user = decoded;

  } catch (err) {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}

