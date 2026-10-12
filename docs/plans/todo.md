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

Dos avisos: (1) el trabajo ya está commiteado en `monorepo-v2` (commits `7176a13` y `e19ad07`; el árbol de trabajo queda limpio), así que el aviso de "nada commiteado" de la redacción anterior ya no aplica; y (2) la 0.1.0 no se puede cortar todavía porque monorepo-v2 y main tienen historias git no relacionadas, así que ni changeset status calcula el diff ni se dispara el workflow de release. Ese es el siguiente paso real.

---

## Verificación independiente y code review (2026-10-12)

Repetida la verificación completa contra el árbol de trabajo actual, esta vez leyendo el código fuente y ejecutando la suite, sin fiarse de los informes anteriores. El resultado: **todo lo que declaran los planes está implementado**. Greps de regresión limpios (`as any` en `auth`, `declare global`, `as string` en componentes, `console.log` en paquetes; `paraglide` solo aparece en la prosa de `Welcome.mdx`), y la suite en verde: `lint` 4/4, `check-types` 7/7, `test` 7/7 (97 tests más el E2E del demo: 4 pasan, 1 saltado con su motivo), `build` 4/4, `check-publish` 7/7 con `attw` todo 🟢, y cobertura de `core` al 97.32 %. El inventario de tareas también cuadra: 7 abiertas y 2 parciales, exactamente las de arriba.

Se verificó además, contra el código de `sveltekit-superforms` (su `dist/client/superForm.js`), el patrón `SPA: true` + `onUpdate` de los dos formularios de login: `onUpdate` solo se dispara dentro del flujo de submit — las validaciones por input y blur llaman a `onUpdated`, no a `onUpdate` — y siempre después de `validateForm()`. No se envía nada sin pulsar el botón ni con el email inválido.

Del code review salen cuatro hallazgos accionables y unos nitpicks. Ningún bug grave:

1. **`.prettierignore` no cubre los artefactos de Playwright.** `demos/sveltekit/playwright-report/` y `test-results/` están en el `.gitignore` del demo pero no en el `.prettierignore`, así que después de correr el E2E `bun run prepush` falla en local con `format:ci` en rojo (el CI, sobre un checkout limpio, no lo sufre). Es lo único pendiente de arreglar en este repo.
2. **La prop `schema` no es reactiva en `FormLoginMagicLink`/`FormLoginOtp`.** `const activeSchema = schema ?? createLoginSchema()` se captura una vez; el demo le pasa un schema en `$derived` para traducirlo (`LoginModal.svelte`) y, cambiando de idioma con el modal abierto, los mensajes de validación no se re-traducen. `superForm` no soporta cambiar el schema, así que es una limitación aceptable: falta documentarla en el componente o en `docs/i18n.md`.
3. **`FormLoginOtp` hardcodea 6 dígitos** (`maxlength={6}` + `REGEXP_ONLY_DIGITS`) mientras `emailOtpPreset` acepta `otpLength: 8`. Con un servidor a 8 dígitos, el PinInput no deja escribir el código. Documentarlo o añadir una prop `length`.
4. **Scaffolding duplicado en los cinco `Form*`**: `describedBy()`, `noteId`, `labelText` y `hint` están copiados en `FormString`/`FormNumber`/`FormCheckbox`/`FormSelect`/`FormTextarea`. Las funciones pueden vivir en un helper compartido.

Nitpicks, por completitud: el `id="modal-{uid}"` de `Modal` ya no sirve para nada interno (la referencia es `bind:this`); tras un envío con éxito sin `onSuccess`, el magic link no permite reenviar (el OTP sí tiene «start over»); el `aria-expanded` de los dropdowns de `NavBarEnd` depende de `focusin`/`focusout`, que Safari no siempre dispara al hacer click (limitación del dropdown por CSS de daisyUI, ya comentada en el código); y `Header` renderiza el snippet `brand` dos veces, con lo que un `id` dentro de él se duplicaría en el DOM.

El siguiente paso real sigue siendo el mismo: promocionar `monorepo-v2` a `main` para que Changesets pueda calcular el diff contra la base y el workflow de release corte la `0.1.0`.
