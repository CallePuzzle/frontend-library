import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { PrismaClient, type PrismaClient as PrismaClientType } from '@prisma/client';
import { building } from '$app/environment';
import { env } from '$env/dynamic/private';

// En local: `turso dev --db-file dev.db` sirve dev.db por HTTP en este puerto.
const DEV_URL = 'http://127.0.0.1:8080';

function resolveUrl(): string {
	// SvelteKit no permite leer $env/dynamic/private durante el prerender, y ahí no se
	// toca la base de datos: basta con un valor cualquiera para construir el cliente.
	if (building) return DEV_URL;

	if (env.LIBSQL_URL) return env.LIBSQL_URL;

	if (env.NODE_ENV === 'production') {
		throw new Error(
			'Falta LIBSQL_URL: la URL de la base de datos tiene que venir del entorno. Ver .env.example.'
		);
	}

	return DEV_URL;
}

function createPrismaClient(): PrismaClientType {
	return new PrismaClient({ adapter: new PrismaLibSQL({ url: resolveUrl() }) });
}

export default createPrismaClient();
