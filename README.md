# Syncthing4Swarm

<div style="text-align: center;">

![combination from syncthing and docker swarm logo syncthing4swarm](pictures/syncthing4swarm.svg)

</div>

**Replicate Docker volumes across your Swarm cluster — automatically**

Syncthing4Swarm deploys [Syncthing](https://syncthing.net/) across a Docker Swarm cluster with automatic peer discovery and zero-touch configuration.

## Features

- **Global deployment**: one Syncthing instance on every Swarm node
- **Automatic discovery**: scans the overlay network to find other instances
- **Auto-configuration**: mutual device pairing and folder sharing without manual intervention
- **Private mode**: disables relays and global discovery (internal traffic only)

## Requirement

- Initialized Docker Swarm (`docker swarm init`)

## Quick Start

Run on **each node**:

```bash
sudo mkdir -p /var/syncthing/data
sudo chown 1000:1000 /var/syncthing/data
```

Run only on **one node**:

```bash
# Clone the repository
git clone https://github.com/SuitDeer/syncthing4swarm.git
cd syncthing4swarm

# Deploy to Swarm
docker stack deploy -c docker-compose.yml syncthing4swarm
```

## Configuration

Available environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `STGUIAPIKEY` | *required* | API key for Syncthing interface |
| `SYNCTHING_PORT` | `8384` | REST API port |
| `SYNCTHING_SYNC_PORT` | `22000` | Synchronization port |
| `SYNCTHING_FOLDER_ID` | `shared` | Shared folder identifier |
| `SYNCTHING_FOLDER_PATH` | `/var/syncthing/data` | Synchronized folder path |
| `SYNCTHING_FOLDER_LABEL` | `Shared` | Display name for the folder |
| `SYNCTHING_DISABLE_GLOBAL` | `true` | Disables relays and global discovery |

## Architecture

```
+-------------------------------------------------------------------------------+
|                                 Docker Swarm                                  |
|                                                                               |
|  +---------------------+   +---------------------+   +---------------------+  |
|  |       Node 1        |   |       Node 2        |   |       Node 3        |  |
|  |     +---------+     |   |     +---------+     |   |     +---------+     |  |
|  |     |Syncthing|<----+---+---->|Syncthing|<----+---+---->|Syncthing|     |  |
|  |     +---------+     |   |     +---------+     |   |     +---------+     |  |
|  |          |          |   |          |          |   |          |          |  |
|  | /var/syncthing/data |   | /var/syncthing/data |   | /var/syncthing/data |  |
|  +---------------------+   +---------------------+   +---------------------+  |
|                                                                               |
|                           Overlay network (internal)                          |
+-------------------------------------------------------------------------------+
```

## How It Works

On each container startup:

1. Waits for Syncthing to become operational
2. Disables global features (relays, NAT, external discovery)
3. Creates the shared folder if it doesn't exist
4. Scans the overlay subnet (`/24`)
5. Mutually adds all discovered devices with their static IP addresses
6. Syncs the device list across the shared folder

## Exposed Ports

| Port | Protocol | Usage |
|------|----------|-------|
| 8384 | TCP | Web interface and REST API |
| 22000 | TCP/UDP | File synchronization |
| 21027 | UDP | Local discovery |

## Development

Run on **each node**:

```bash
# Clone the repository
git clone https://github.com/SuitDeer/syncthing4swarm.git
cd syncthing4swarm/dev

# Build image
sudo docker build -t syncthing4swarm:local .
```

Run only on **one node**:

```bash
# Deploy to Swarm
sudo docker stack deploy -c docker-compose-dev.yml syncthing4swarm

## Testing ...

# Remove stack
sudo docker stack rm syncthing4swarm
```

Run on **each node**:

```bash
# Remove dev image from local image repository
sudo docker image rm syncthing4swarm:local
```

## Test Volume Replication

An interactive demo is included to verify that files sync across all nodes. It features an editable message box. The content of the message box gets saved into the `/var/syncthing/data/message.json` witch is replicated on each node.

1. Build the demo image:

Run on **each node**:

```bash
cd demo
sudo docker build -t demo:local .
```

2. Deploy the demo:

Run only on **one node**:

```bash
sudo docker stack deploy -c docker-compose-demo.yml demo
```

3. Verify replication:

Access `http://<any-node-ip>:8080` on different nodes. Type a message and click "Save & Sync" - it will appear on all other nodes within seconds.

4. Clean up:

Run only on **one node**:

```bash
sudo docker stack rm demo
sudo rm /var/syncthing/data/message.json
```

Run on **each node**:

```bash
sudo docker image rm demo:local
```

## Acknowledgments

This project is built on top of [Syncthing](https://github.com/syncthing/syncthing), an amazing open-source continuous file synchronization program. Huge thanks to the Syncthing contributors for their incredible work.

This project was inspired by [docker-swarm-syncthing](https://github.com/bluepuma77/docker-swarm-syncthing) by bluepuma77.