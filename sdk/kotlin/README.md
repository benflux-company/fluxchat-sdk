# FluxChat SDK — Kotlin (Android)

> Community SDK — tracked in [issue #7](https://github.com/benflux-company/fluxchat-sdk/issues/7)

## Status

**Open for contribution.** This directory is a placeholder. See [CONTRIBUTING.md](../../CONTRIBUTING.md) and the [full guide](https://docs.fluxchat-corp.com/docs#for-devs) before starting.

## Sandbox — test credentials

| Field | Value |
|---|---|
| Base URL | `https://dev-api.fluxchat-corp.com/api/v2` |
| API Key | `fc_prod_f45868df738ddbec537c6c929570f1dad830fb0ca0cd5f82652e9eb7db4ede16` |
| Org ID | `ba134db3-993d-4076-8431-bb2c922d4db2` |
| Dashboard | https://fluxchat-corp.com (login: heyakaf832@ocuser.com / Test1234567890@) |

## Quickstart (target API)

```kotlin
val client = FluxChat(apiKey = "fc_prod_...")

val response = client.ask("What are your opening hours?")
println(response.reply)

client.capturePage(
    url = "https://myapp.com/about",
    title = "About",
    content = "We are open Mon–Fri 9am–6pm."
)
```

## Package config

Use `build.gradle.kts`. Use `OkHttp` or `Ktor` (your choice). Target Android API 26+ / Kotlin 1.9+.

## Testing

After implementing `capturePage`, follow the [5-step verification protocol](https://docs.fluxchat-corp.com/docs#sandbox-verify) using the sandbox above.
