import { config } from 'dotenv';
import { defineConfig } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { 
    User,
    Conference
} from '../src/Entities';

config({
    path: __dirname + '/../.env'
});

export default defineConfig({
    host: process.env.DATABASE_HOST,
    port: Number.parseInt(process.env.DATABASE_PORT!, 10),
    dbName: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    entities: [User, Conference],
    extensions: [Migrator],
    migrations: {
        path: __dirname + '/migrations'
    }
});