import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { MikroORM } from '@mikro-orm/core';
import mikroOrmConfig from '../../database/mikro-orm.config';
import { User } from '../Entities/User';
import { decodeJwt } from '../middlewares/decode';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export async function userController(fastify: FastifyInstance, options: FastifyPluginOptions) {

  fastify.post<{
    Body: { fullName: string; email: string; password: string };
  }>('/users/register', async (request, reply) => {
    const { fullName, email, password } = request.body;

    if (!fullName || !email || !password) {
      return reply.status(400).send({ error: 'Missing fields' });
    }

    const orm = await MikroORM.init(mikroOrmConfig);
    const em = orm.em.fork();

    try {
      const existing = await em.findOne(User, { email });
      if (existing) {
        await orm.close();
        return reply.status(400).send({ error: 'Email already used' });
      }

      const user = new User();
      user.fullName = fullName;
      user.email = email;
      user.password = await bcrypt.hash(password, 10);
      user.isAdmin = false;
      user.isSponsor = false;

      await em.persistAndFlush(user);
      await orm.close();

      return reply.status(201).send({ message: 'User created' });

    } catch (error) {
      await orm.close();
      fastify.log.error(error);
      return reply.status(500).send();
    }
  });

  fastify.post<{
    Body: { email: string; password: string };
    }>('/users/login', async (request, reply) => {
    const { email, password } = request.body;
    if (!email || !password) return reply.status(400).send({ error: 'Missing fields' });

    const orm = await MikroORM.init(mikroOrmConfig);
    const em = orm.em.fork();

    try {
        const user = await em.findOne(User, { email });
        if (!user) {
        await orm.close();
        return reply.status(401).send({ error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
        await orm.close();
        return reply.status(401).send({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
        { id: user.id, isAdmin: user.isAdmin, isSponsor: user.isSponsor },
        JWT_SECRET,
        { expiresIn: '1h' }
        );
        await orm.close();

        reply
        .setCookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 3600
        })
        .status(200)
        .send({ message: 'Logged in' });

    } catch (error) {
        await orm.close();
        fastify.log.error(error);
        return reply.status(500).send();
    }
    });


  fastify.get('/users/current', { preHandler: decodeJwt }, async (request, reply) => {
    const currentUser = (request as any).user;
    if (!currentUser) return reply.status(401).send();

    const orm = await MikroORM.init(mikroOrmConfig);
    const em = orm.em.fork();

    try {
      const user = await em.findOne(User, { id: currentUser.id });
      if (!user) {
        await orm.close();
        return reply.status(404).send();
      }

      await orm.close();
      return reply.status(200).send({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        isAdmin: user.isAdmin,
        isSponsor: user.isSponsor,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });

    } catch (error) {
      await orm.close();
      fastify.log.error(error);
      return reply.status(500).send();
    }
  });

    fastify.get('/isAuth', { preHandler: decodeJwt }, async (request, reply) => {
    const currentUser = (request as any).user;
    if (!currentUser) {
        return reply.status(401).send({ authenticated: false });
    }

    return reply.status(200).send({ authenticated: true, userId: currentUser.id });
    });

  fastify.get('/users', { preHandler: decodeJwt }, async (request, reply) => {
    const currentUser = (request as any).user;
    if (!currentUser) return reply.status(401).send();

    if (!currentUser.isAdmin) return reply.status(403).send();

    const orm = await MikroORM.init(mikroOrmConfig);
    const em = orm.em.fork();

    try {
      const users = await em.find(User, {}, { orderBy: { id: 'ASC' } });

      await orm.close();
      return reply.status(200).send(users.map(u => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        isAdmin: u.isAdmin,
        isSponsor: u.isSponsor,
        createdAt: u.createdAt,
      })));

    } catch (error) {
      await orm.close();
      fastify.log.error(error);
      return reply.status(500).send();
    }
  });

  fastify.delete<{
    Params: { id: number };
  }>('/users/:id', { preHandler: decodeJwt }, async (request, reply) => {
    const currentUser = (request as any).user;
    if (!currentUser) return reply.status(401).send();

    if (!currentUser.isAdmin) return reply.status(403).send();

    const orm = await MikroORM.init(mikroOrmConfig);
    const em = orm.em.fork();

    try {
      const user = await em.findOne(User, { id: request.params.id });
      if (!user) {
        await orm.close();
        return reply.status(404).send();
      }

      await em.removeAndFlush(user);
      await orm.close();

      return reply.status(204).send();

    } catch (error) {
      await orm.close();
      fastify.log.error(error);
      return reply.status(500).send();
    }
  });

}
