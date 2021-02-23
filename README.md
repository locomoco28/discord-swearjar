# discord-swearjar

Swear jar bot for discord

## requirements

- yarn package manager

## config

_config.json_

```json
{
  "DATABASE": {
    "URI": "mysql://user:password@host:port/database",
    "table": "myTable"
  },
  "DISCORD": {
    "BOT_TOKEN": "token",
    "CLIENT_ID": "id",
    "CLIENT_SECRET": "secret"
  }
}
```

## installation

```bash
# install dependencies
yarn install

# run application
yarn start
```
