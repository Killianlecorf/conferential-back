import Fastify from 'fastify'
import dotenv from 'dotenv'
import { MikroORM } from '@mikro-orm/core';
import mikroOrmConfig from "../database/mikro-orm.config";

dotenv.config()

const app = Fastify()

app.get('/', async (request, reply) => {
  return { hello: 'world' }
})

const start = async () => {
    await MikroORM.init(mikroOrmConfig);

  try {
    const port = Number(process.env.PORT)
    await app.listen({ port, host: '0.0.0.0' })
    console.log(`Server running on http://localhost:${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
