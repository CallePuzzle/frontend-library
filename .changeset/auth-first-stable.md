---
'@callepuzzle/auth': major
---

Primera versión estable, y lo es con una **incompatibilidad dentro**: `betterAuthHandle` exige
`baseURL` y un secreto propio de al menos 32 caracteres, y no atiende ninguna petición sin ellos
(detalle en el changeset de seguridad de esta misma release). La factoría `getBetterAuth`, los
presets `magicLinkPreset`/`emailOtpPreset` y el `Handle` se consideran estables tras la revisión
del código y la auditoría de seguridad; los próximos cambios incompatibles saldrán como major.
