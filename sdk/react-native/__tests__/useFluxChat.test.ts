import { renderHook, act } from '@testing-library/react-hooks';
import { useFluxChat } from '../src/useFluxChat';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('useFluxChat', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('devrait retourner une fonction ask et des helpers', () => {
    const { result } = renderHook(() => useFluxChat('test-api-key'));
    
    expect(result.current.ask).toBeInstanceOf(Function);
    expect(result.current.capturePage).toBeInstanceOf(Function);
    expect(result.current.conversationId).toBeUndefined();
  });

  it('devrait jeter une erreur si aucune API key n\'est fournie', async () => {
    const { result } = renderHook(() => useFluxChat());
    
    await expect(result.current.ask('test')).rejects.toThrow('FluxChat API key is required');
  });

  it('devrait appeler fetch avec la bonne enveloppe et retourner reply', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { reply: 'Bonjour !', conversationId: 'conv-123' } })
    });

    const { result } = renderHook(() => useFluxChat('test-api-key'));
    
    let response;
    await act(async () => {
      response = await result.current.ask('Bonjour');
    });
    
    expect(mockFetch).toHaveBeenCalledWith(
      'https://dev-api.fluxchat-corp.com/api/v2/public/bot/ask',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-API-Key': 'test-api-key'
        }),
        body: expect.stringContaining('Bonjour')
      })
    );

    expect(response).toEqual({
      reply: 'Bonjour !',
      conversationId: 'conv-123'
    });
    
    expect(result.current.conversationId).toBe('conv-123');
  });
});
