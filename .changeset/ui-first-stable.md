---
'@callepuzzle/svelte-ui': major
---

Primera versión estable: los componentes con el patrón de textos por prop/contexto y snippets se
consideran estables tras la revisión completa del código y la auditoría de seguridad. Dos cambios
de API en esta release: `FormLoginOtp` añade la prop `length` (dígitos del código, 6 por defecto,
para cuadrar con el `otpLength` de `emailOtpPreset`) y su texto `otpDescription` pasa a ser una
función `(digits: number) => string`. Los próximos cambios incompatibles saldrán como major.
