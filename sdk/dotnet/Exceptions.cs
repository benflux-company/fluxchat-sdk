using System;

namespace FluxChat.Exceptions
{
    /// <summary>
    /// Exception levée lorsque l'API FluxChat retourne une erreur HTTP.
    /// </summary>
    public class FluxChatApiException : Exception
    {
        public int StatusCode { get; }
        public string? ApiMessage { get; }

        public FluxChatApiException(int statusCode, string? apiMessage = null)
            : base($"FluxChat API error {statusCode}: {apiMessage ?? "Unknown error"}")
        {
            StatusCode = statusCode;
            ApiMessage = apiMessage;
        }
    }

    /// <summary>
    /// Exception levée lors d'une erreur réseau (timeout, connexion refusée, etc.).
    /// </summary>
    public class FluxChatNetworkException : Exception
    {
        public FluxChatNetworkException(string message, Exception? innerException = null)
            : base(message, innerException)
        {
        }
    }
}
