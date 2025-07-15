declare namespace NodeJS {
    interface ProcessEnv {
        PORT: string;
        DATABASE_NAME: string;
        DATABASE_USER: string;
        DATABASE_PASS: string;
        DATABASE_HOST: string;
        DATABASE_PORT: string;
    }
}