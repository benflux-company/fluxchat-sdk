# FluxChat React Native SDK

SDK officiel pour intégrer FluxChat dans les applications React Native.

## Installation

```bash
npm install @fluxchat/react-native
# ou
yarn add @fluxchat/react-native
```

## Fonctionnalités

- `FluxChatWidget` : Un composant UI complet (bulle flottante + modal de chat)
- `useFluxChat(apiKey)` : Un hook pour créer votre propre UI
- `FluxChatContext` : Context React pour stocker l'état global

## Utilisation

### Widget prêt à l'emploi

```tsx
import { FluxChatWidget } from '@fluxchat/react-native';

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      {/* Votre application */}
      <FluxChatWidget apiKey="VOTRE_API_KEY" />
    </View>
  );
}
```

### Hook Headless

```tsx
import { useFluxChat } from '@fluxchat/react-native';

function CustomChat() {
  const { ask, conversationId } = useFluxChat('VOTRE_API_KEY');

  const handleSend = async () => {
    const response = await ask("Bonjour !");
    console.log(response.reply);
  };
}
```

### Capture Passive de Connaissances (Important)

L'API de capture permet au bot d'apprendre automatiquement le contexte de votre application. Appelez la méthode `capturePage` à chaque fois que l'utilisateur change d'écran, par exemple dans un `useEffect` :

```tsx
import { useEffect } from 'react';
import { useFluxChat } from '@fluxchat/react-native';
import { useRoute } from '@react-navigation/native'; // ou autre système de routing

function MyScreen() {
  const { capturePage } = useFluxChat('VOTRE_API_KEY');
  const route = useRoute();

  useEffect(() => {
    capturePage(
      `app://my-app/${route.name}`,
      route.params?.title ?? route.name,
      "Contenu texte extrait de l'écran ou données pertinentes..."
    ).catch(console.error);
  }, [route.name]);

  return <View>...</View>;
}
```
