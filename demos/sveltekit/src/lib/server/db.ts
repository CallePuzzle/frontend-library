import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { PrismaClient, type PrismaClient as PrismaClientType } from '@prisma/client';
import { building, dev } from '$app/env';
import { LIBSQL_URL } from '$app/env/private';

// En local: `turso dev --db-file dev.db` sirve dev.db por HTTP en este puerto.
const DEV_URL = 'http://127.0.0.1:8080';

function resolveUrl(): string {
	// Las variables de `$app/env/private` no se resuelven durante el prerender, y ahí no se
	// toca la base de datos: basta con un valor cualquiera para construir el cliente.
	if (building) return DEV_URL;

	if (LIBSQL_URL) return LIBSQL_URL;

	// Fuera de desarrollo (build servido, `vite preview` incluido) la URL tiene que venir del
	// entorno: el e2e la fija en `playwright.config.ts`, y un despliegue real la trae de su
	// proveedor. Ver `.env.example`.
	if (!dev) {
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
