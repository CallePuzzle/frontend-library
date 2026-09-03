Qué se ha implementado

Orquesté siete subagentes en oleadas con propiedad de ficheros disjunta, fijando yo antes los contratos transversales para que no divergieran. Los cinco bloqueantes del diagnóstico están cerrados:

Fundamentos. @callepuzzle/core con el modelo de rutas nuevo (la clave es la ruta; fuera url, isProtected y el mapa de URLs de producto que nadie respetaba) y los schemas migrados a zod v4 con z.toJSONSchema, sin un solo cast sobre el JSON Schema. @callepuzzle/auth sin el useSession() de scope de módulo —el bug de sesión compartida entre requests SSR—, con los tipos reales de better-auth en vez de any, sin plugins impuestos y con presets que exigen la función de envío, así que es imposible desplegar el console.log del token.

La librería. De 8 componentes a 19, todos con class y reenvío de atributos, ninguno importando rutas, sesión, cliente de auth ni mensajes. Header es solo la navbar y el cajón sale a un Drawer opcional; NavBarEnd recibe el usuario por prop y ya no embute el login; FormLogin se parte en magic link y OTP (este en ./otp, con bits-ui como peer opcional).

i18n. Paraglide fuera de la librería: textos por props con defaults en inglés. grep -r paraglide packages/ está vacío.

Que no se rompa. Storybook arranca por primera vez en este repo (84 entradas), 97 tests en verde incluidas las stories con axe en modo error, E2E en el demo, oxlint + ESLint, una sola versión de TypeScript, CI con tres jobs y hooks locales.

Cosas que encontré yo al verificar

Los informes de los subagentes venían sin ejecutar la suite completa, y al ejecutarla aparecieron cuatro fallos reales que arreglé: dos proyectos de vitest compartiendo el objeto de navegador por referencia, el prebundle de esbuild que no aplica los alias de $app/\*, su dependencia CJS transitiva que dejaba de convertirse a ESM, y una violación de a11y auténtica que cazó axe (el checkbox del Drawer sin nombre accesible cuando su label está oculto por ancho de pantalla) — justamente lo que se buscaba al subir el addon de todo a error. También quité un import.meta.env que svelte-package rechaza en código publicado.

La prueba desde fuera con tarballs confirmó que un consumidor externo puede instalarla, y con control negativo: borrando el @source de la hoja publicada el CSS baja de 100 a 46 KB y las clases de daisyUI desaparecen.

Estado de los planes: 146 tareas hechas, 2 parciales, 7 abiertas

Cada plan lleva su sección Estado (2026-09-02). Las abiertas, con motivo: T7.16 y T7.21 anuladas o descartadas por el rediseño, T9.1 obsoleta al ir directo a zod v4, y T12.9-T12.12, la migración de los dos repos consumidores, que dejé fuera por tu decisión. Las parciales son publicar el Storybook en una URL (falta elegir entre Chromatic y Pages) y los CHANGELOG, que los genera Changesets al publicar.

Dos avisos honestos: no he commiteado nada (257 ficheros en el árbol de trabajo), y la 0.1.0 no se puede cortar todavía porque monorepo-v2 y main tienen historias git no relacionadas, así que ni changeset status calcula el diff ni se dispara el workflow de release. Ese es el siguiente paso real.
