# MineRoute – Minimal Minecraft TCP Router

MineRoute is a lightweight, domain-based TCP router for Minecraft servers.  
It listens for incoming Minecraft connections and routes them to different servers based on the domain the client connected with – all without modifying packets or acting as a full Minecraft proxy.

## Why not use a normal Proxy like Velocity or Bungeecord
This is useful if you have multimple single servers or even whole networks running on the same mashiene. Normaly only one server can use port 25565. 
With this project you can join every server on port 25565 (so no need to set a port when joining) just with different domains.

For example: you have 2 minecraft networks running, each with their own Velocity/Bungeecord proxy.
You want each network to be accessible using port 25565.
Set one subdomain for one server (network1.domain.de)
and another one for the other (network2.domain.de),
point both DNS reccords to the same ip and start up Minecraft TCP Router on port 25565.
Edit the config, so the proxy knows where to send connections, depending on the domain and enjoy!

All minecraft traffic will be routed. Pings in the server list and connections.

## 🔧 Features

- **Fast and minimal** – just raw TCP routing
- **Domain-based forwarding** via Minecraft handshake
- **Fallback backend** if domain isn't found
- **Safe against scanners** like `nmap` (no crash or garbage)
- **Not a Minecraft proxy** like Velocity or Bungee – just routing

## How It Works
Minecraft clients send a domain in the first handshake packet.
The router reads this domain (e.g. server1.example.net).
If the domain is listed in routes, it forwards the raw TCP connection to the target backend server. (server1.example.net -> localhost:25566)
If the domain is not found and allow_fallback is enabled, the connection is forwarded to the default backend.
If no route and no fallback, the connection is rejected.

## Requirements
- Node.js v14 or higher
- Basic TCP knolage to setup correct port and ip. (Depending on you setup)
- DNS reccords pointing to the Proxy

## Configuration example
- listen_port: The TCP port the router listens on (default Minecraft port is 25565)
- listen_adress: The IP address the router binds to (use 0.0.0.0 to listen on all interfaces)
- allow_fallback: If true, unknown domains are forwarded to the default_backend – if false, they're rejected
- socket_timeout: Timeout in milliseconds (e.g. 10000 = 10 seconds) before a connection is closed
- default_backend: Fallback server config used if no matching domain is found in routes (only used if allow_fallback is true)
- routes: Domain-to-backend mapping. Each key is a domain (as sent by the Minecraft client), and the value defines the host and port of the target backend server

```json
{
  "listen_port": 25565,
  "listen_adress": "0.0.0.0",
  "allow_fallback": true,
  "socket_timeout": 10000,
  "default_backend": {
    "host": "localhost",
    "port": 25566
  },
  "routes": {
    "server1.example.net": {
      "host": "localhost",
      "port": 25567
    },
    "server2.example.net": {
      "host": "localhost",
      "port": 25568
    }
  }
}
```



Made with ❤️ by Lostes_Burger