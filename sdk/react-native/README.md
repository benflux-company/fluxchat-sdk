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
    console.log(response.text);
  };
}
```
