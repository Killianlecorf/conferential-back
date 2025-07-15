import Fastify from 'fastify'
import dotenv from 'dotenv'
import fastifyCookie from 'fastify-cookie';
import fastifyCors from '@fastify/cors';
import { MikroORM } from '@mikro-orm/core';
import mikroOrmConfig from "../database/mikro-orm.config";
import { userController } from './controller/user.controller';
import { conferenceController } from './controller/conferential.controller';

dotenv.config()

const fastify = Fastify({
  logger: true,
});


const start = async () => {
    await MikroORM.init(mikroOrmConfig);

    fastify.register(fastifyCors, {
      origin: process.env.ALLOWED_ORIGIN,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    });

    fastify.register(fastifyCookie);
    fastify.register(userController);
    fastify.register(conferenceController);

  try {
    const port = Number(process.env.PORT)
    await fastify.listen({ port, host: '0.0.0.0' })
    console.log(`Server running on http://localhost:${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
