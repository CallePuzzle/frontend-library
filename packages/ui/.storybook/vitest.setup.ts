import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview';
import { setProjectAnnotations } from '@storybook/svelte-vite';
import * as projectAnnotations from './preview';

// Aplica las anotaciones del proyecto (estilos y `a11y: { test: 'error' }`) a las stories
// cuando se ejecutan como tests con `@storybook/addon-vitest`.
// https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);
