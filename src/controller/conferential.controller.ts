import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { MikroORM } from '@mikro-orm/core';
import mikroOrmConfig from '../../database/mikro-orm.config';
import { Conference } from '../Entities/Conferential';
import { decodeJwt } from '../middlewares/decode';
import checkAdmin from '../middlewares/checkAdmin';
import checkSponsor from '../middlewares/checkSponsor';


export async function conferenceController(fastify: FastifyInstance, options: FastifyPluginOptions) {

  fastify.post<{
    Body: {
      title: string;
      description: string;
      speakerName: string;
      speakerBio: string;
      date: string;
      conferentialSize: number;
      slotNumber: number;
    };
  }>('/conferences', { preHandler: [decodeJwt, checkAdmin] }, async (request, reply) => {
    const { title, description, speakerName, speakerBio, date, conferentialSize, slotNumber } = request.body;

    if (!title || !description || !speakerName || !speakerBio || !date || !conferentialSize || !slotNumber) {
      return reply.status(400).send({ error: 'Missing fields' });
    }

    const orm = await MikroORM.init(mikroOrmConfig);
    const em = orm.em.fork();

    try {
      const conf = new Conference();
      conf.title = title;
      conf.description = description;
      conf.speakerName = speakerName;
      conf.speakerBio = speakerBio;
      conf.date = new Date(date);
      conf.conferentialSize = conferentialSize;
      conf.slotNumber = slotNumber;

      conf.setTimesFromSlot();

      await em.persistAndFlush(conf);
      await orm.close();

      return reply.status(201).send({ message: 'Conference created', id: conf.id });

    } catch (error) {
      await orm.close();
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  fastify.get('/conferences', async (request, reply) => {
    const orm = await MikroORM.init(mikroOrmConfig);
    const em = orm.em.fork();

    try {
      const conferences = await em.find(Conference, {}, { orderBy: { date: 'ASC', slotNumber: 'ASC' } });
      await orm.close();

      return reply.status(200).send(conferences.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        speakerName: c.speakerName,
        speakerBio: c.speakerBio,
        date: c.date,
        conferentialSize: c.conferentialSize,
        slotNumber: c.slotNumber,
        startDateTime: c.startDateTime,
        endDateTime: c.endDateTime,
      })));

    } catch (error) {
      await orm.close();
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  fastify.get<{
    Params: { id: number };
  }>('/conferences/:id', async (request, reply) => {
    const orm = await MikroORM.init(mikroOrmConfig);
    const em = orm.em.fork();

    try {
      const conf = await em.findOne(Conference, { id: request.params.id });
      if (!conf) {
        await orm.close();
        return reply.status(404).send({ error: 'Conference not found' });
      }

      await orm.close();

      return reply.status(200).send({
        id: conf.id,
        title: conf.title,
        description: conf.description,
        speakerName: conf.speakerName,
        speakerBio: conf.speakerBio,
        date: conf.date,
        conferentialSize: conf.conferentialSize,
        slotNumber: conf.slotNumber,
        startDateTime: conf.startDateTime,
        endDateTime: conf.endDateTime,
      });

    } catch (error) {
      await orm.close();
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  fastify.put<{
    Params: { id: number };
    Body: Partial<{
      title: string;
      description: string;
      speakerName: string;
      speakerBio: string;
      date: string;
      conferentialSize: number;
      slotNumber: number;
    }>;
  }>('/conferences/:id', { preHandler: [decodeJwt, checkAdmin, checkSponsor] }, async (request, reply) => {
    const currentUser = (request as any).user;

    const orm = await MikroORM.init(mikroOrmConfig);
    const em = orm.em.fork();

    try {
      const conf = await em.findOne(Conference, { id: request.params.id });
      if (!conf) {
        await orm.close();
        return reply.status(404).send({ error: 'Conference not found' });
      }

      if (!currentUser.isSponsor && !currentUser.isAdmin) {
        await orm.close();
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const { title, description, speakerName, speakerBio, date, conferentialSize, slotNumber } = request.body;

      if (title !== undefined) conf.title = title;
      if (description !== undefined) conf.description = description;
      if (speakerName !== undefined) conf.speakerName = speakerName;
      if (speakerBio !== undefined) conf.speakerBio = speakerBio;
      if (date !== undefined) conf.date = new Date(date);
      if (conferentialSize !== undefined) conf.conferentialSize = conferentialSize;
      if (slotNumber !== undefined) conf.slotNumber = slotNumber;

      conf.setTimesFromSlot();

      await em.flush();
      await orm.close();

      return reply.status(200).send({ message: 'Conference updated' });

    } catch (error) {
      await orm.close();
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  fastify.delete<{
    Params: { id: number };
  }>('/conferences/:id', { preHandler: [decodeJwt, checkAdmin] }, async (request, reply) => {
    const currentUser = (request as any).user;

    const orm = await MikroORM.init(mikroOrmConfig);
    const em = orm.em.fork();

    try {
      const conf = await em.findOne(Conference, { id: request.params.id });
      if (!conf) {
        await orm.close();
        return reply.status(404).send({ error: 'Conference not found' });
      }

      if (!currentUser.isAdmin) {
        await orm.close();
        return reply.status(403).send({ error: 'Forbidden' });
      }

      await em.removeAndFlush(conf);
      await orm.close();

      return reply.status(204).send();

    } catch (error) {
      await orm.close();
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

}
