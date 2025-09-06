# Minecraft TCP Router

MineRoute is a lightweight, domain-based TCP router for Minecraft servers.  
It listens for incoming Minecraft connections and routes them to different servers based on the domain the client connected with – all without modifying packets or acting as a full Minecraft proxy.

## Why not use a normal Proxy like Velocity or Bungeecord
This project is needed if you have multiple standalone servers or entire Minecraft networks running on the same host. Normally, only one server can use port 25565.
With this project, you can connect to each server through port 25565 (no need to specify a port when joining), simply by using different domains.

Example:
You have two Minecraft networks, each with its own Velocity or BungeeCord proxy.
You want both networks to be accessible via port 25565.

Set up one subdomain for the first network (e.g. network1.domain.de)
and another for the second (e.g. network2.domain.de).
Point both DNS records to the same IP address and run the Minecraft TCP Router on port 25565.
Then, configure the router to forward incoming connections based on the domain used — and you're good to go!

All Minecraft traffic will be correctly routed — including server list pings and player connections.

### 🔧 Features

- **Fast and minimal** – just raw TCP routing
- **Domain-based forwarding** via Minecraft handshake
- **Fallback backend** if domain isn't found
- **Safe against scanners** like `nmap` (no crash or garbage)
- **Not a Minecraft proxy** like Velocity or Bungee – just routing

### How It Works
Minecraft clients send a domain in the first handshake packet.
The router reads this domain (e.g. server1.example.net).
If the domain is listed in routes, it forwards the raw TCP connection to the target backend server. (server1.example.net -> localhost:25566)
If the domain is not found and allow_fallback is enabled, the connection is forwarded to the default backend.
If no route and no fallback, the connection is rejected.

### Requirements
- Node.js v14 or higher
- Basic TCP knowledge to setup correct port and ip. (Depending on you setup)
- DNS reccords pointing to the Proxy

### Configuration example
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