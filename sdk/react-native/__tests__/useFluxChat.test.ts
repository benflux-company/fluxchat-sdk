import { renderHook, act } from '@testing-library/react-hooks';
import { useFluxChat } from '../src/useFluxChat';

describe('useFluxChat', () => {
  it('devrait retourner une fonction ask et un id de conversation', () => {
    const { result } = renderHook(() => useFluxChat('test-api-key'));
    
    expect(result.current.ask).toBeInstanceOf(Function);
    expect(result.current.conversationId).toBeNull();
  });

  it('devrait jeter une erreur si aucune API key n\'est fournie', async () => {
    const { result } = renderHook(() => useFluxChat());
    
    await expect(result.current.ask('test')).rejects.toThrow('FluxChat API key is required');
  });

  it('devrait simuler une réponse après l\'appel de ask', async () => {
    const { result } = renderHook(() => useFluxChat('test-api-key'));
    
    let response;
    await act(async () => {
      response = await result.current.ask('Bonjour');
    });
    
    expect(response).toEqual(
      expect.objectContaining({
        text: 'Réponse de FluxChat pour : "Bonjour"',
        conversationId: expect.any(String),
      })
    );
    expect(result.current.conversationId).not.toBeNull();
  });
});
