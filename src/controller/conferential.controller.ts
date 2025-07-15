import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { MikroORM } from '@mikro-orm/core';
import mikroOrmConfig from '../../database/mikro-orm.config';
import { Conference } from '../Entities/Conferential';
import { decodeJwt } from '../middlewares/decode';
import checkAdmin from '../middlewares/checkAdmin';
import checkSponsor from '../middlewares/checkSponsor';
import { User } from '../Entities';


export async function conferenceController(fastify: FastifyInstance, options: FastifyPluginOptions) {

    fastify.post<{
        Body: {
            title: string;
            description: string;
            speakerName: string;
            speakerBio: string;
            date: string;
            slotNumber: number;
        };
    }>('/conferences', { preHandler: [decodeJwt, checkAdmin] }, async (request, reply) => {
        const { title, description, speakerName, speakerBio, date, slotNumber } = request.body;

        if (!title || !description || !speakerName || !speakerBio || !date || !slotNumber) {
            return reply.status(400).send({ error: 'Missing fields' });
        }

        const orm = await MikroORM.init(mikroOrmConfig);
        const em = orm.em.fork();

        try {
            const existingCount = await em.count(Conference, {
                date: new Date(date),
                slotNumber,
            });

            if (existingCount >= 10) {
                await orm.close();
                return reply.status(400).send({
                    error: `Le créneau ${slotNumber} pour la date ${date} est déjà complet (10 conférences max).`,
                });
            }

            const conf = new Conference();
            conf.title = title;
            conf.description = description;
            conf.speakerName = speakerName;
            conf.speakerBio = speakerBio;
            conf.date = new Date(date);
            conf.conferentialUser;
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
            const query = request.query as { day?: string };
            const day = query.day;

            if (!day) {
                await orm.close();
                return reply.status(400).send({ error: 'Parameter "day" is required in format YYYY-MM-DD' });
            }

            const startOfDay = new Date(day);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(day);
            endOfDay.setHours(23, 59, 59, 999);

            const conferences = await em.find(Conference, {
                date: { $gte: startOfDay, $lte: endOfDay }
            }, {
                orderBy: { date: 'ASC', slotNumber: 'ASC' }
            });

            await em.populate(conferences, ['conferentialUser']);


            console.log(conferences);


            await orm.close();

            return reply.status(200).send(conferences.map(c => ({
                id: c.id,
                title: c.title,
                description: c.description,
                speakerName: c.speakerName,
                speakerBio: c.speakerBio,
                date: c.date,
                conferentialUser: c.conferentialUser.getItems().map(u => ({
                    id: u.id,
                    fullName: u.fullName,
                    email: u.email,
                })),
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
    }>('/conferences/:id', { preHandler: [decodeJwt] }, async (request, reply) => {
        const currentUser = (request as any).user;
        const orm = await MikroORM.init(mikroOrmConfig);
        const em = orm.em.fork();

        try {
            const conf = await em.findOne(Conference, { id: request.params.id }, { populate: ['conferentialUser'] });
            if (!conf) {
                await orm.close();
                return reply.status(404).send({ error: 'Conference not found' });
            }

            const isJoined = currentUser ? conf.conferentialUser.getItems().some(u => u.id === currentUser.id) : false;

            await orm.close();

            return reply.status(200).send({
                id: conf.id,
                title: conf.title,
                description: conf.description,
                speakerName: conf.speakerName,
                speakerBio: conf.speakerBio,
                date: conf.date,
                conferentialUser: conf.conferentialUser.getItems().map(u => ({
                    id: u.id,
                    name: u.fullName,
                    email: u.email,
                })),
                slotNumber: conf.slotNumber,
                startDateTime: conf.startDateTime,
                endDateTime: conf.endDateTime,
                isJoined,
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

            const { title, description, speakerName, speakerBio, date, slotNumber } = request.body;

            if (title !== undefined) conf.title = title;
            if (description !== undefined) conf.description = description;
            if (speakerName !== undefined) conf.speakerName = speakerName;
            if (speakerBio !== undefined) conf.speakerBio = speakerBio;
            if (date !== undefined) conf.date = new Date(date);
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

    fastify.put<{
        Params: { id: number };
    }>('/conferences/:id/user', { preHandler: [decodeJwt] }, async (request, reply) => {
        const { id } = request.params;
        const currentUser = (request as any).user;

        const orm = await MikroORM.init(mikroOrmConfig);
        const em = orm.em.fork();

        try {
            const conf = await em.findOne(Conference, { id }, { populate: ['conferentialUser'] });
            if (!conf) {
                await orm.close();
                return reply.status(404).send({ error: 'Conference not found' });
            }

            const user = await em.findOne(User, { id: currentUser.id });
            if (!user) {
                await orm.close();
                return reply.status(404).send({ error: 'User not found' });
            }

            if (conf.conferentialUser.contains(user)) {
                await orm.close();
                return reply.status(400).send({ error: 'User already joined the conference' });
            }

            if (conf.conferentialUser.length >= 10) {
                await orm.close();
                return reply.status(400).send({ error: 'Conference is full' });
            }

            conf.conferentialUser.add(user);

            await em.flush();
            await orm.close();

            return reply.status(200).send({ message: 'User joined the conference' });

        } catch (error) {
            await orm.close();
            request.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    fastify.delete<{
        Params: { id: number };
    }>('/conferences/:id/user', { preHandler: [decodeJwt] }, async (request, reply) => {
        const { id } = request.params;
        const currentUser = (request as any).user;

        const orm = await MikroORM.init(mikroOrmConfig);
        const em = orm.em.fork();

        try {
            const conf = await em.findOne(Conference, { id }, { populate: ['conferentialUser'] });
            if (!conf) {
                await orm.close();
                return reply.status(404).send({ error: 'Conference not found' });
            }

            const user = await em.findOne(User, { id: currentUser.id });
            if (!user) {
                await orm.close();
                return reply.status(404).send({ error: 'User not found' });
            }

            if (!conf.conferentialUser.contains(user)) {
                await orm.close();
                return reply.status(400).send({ error: 'User is not registered for this conference' });
            }

            conf.conferentialUser.remove(user);

            await em.flush();
            await orm.close();

            return reply.status(200).send({ message: 'User left the conference' });

        } catch (error) {
            await orm.close();
            request.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
