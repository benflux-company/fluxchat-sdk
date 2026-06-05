// Run: FLUXCHAT_API_KEY=bfx_xxx node examples/quickstart.mjs
import { FluxChat } from '@fluxchat_sdk/sdk';

const fluxchat = new FluxChat({
  apiKey: process.env.FLUXCHAT_API_KEY,
  // baseUrl defaults to the FluxChat production API.
});

const { scopes, organizationId } = await fluxchat.testKey();
console.log('Connected to org', organizationId, '— scopes:', scopes.join(', '));

const { reply } = await fluxchat.ask({
  message: 'Quels sont vos horaires ?',
  context: "Données live: l'agence ferme aujourd'hui à 17h.",
});
console.log('\nAssistant:', reply);
