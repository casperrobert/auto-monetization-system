Docker dev quickstart
=====================

Build and run the backend in a disposable container (recommended when local npm install fails or native modules can't be built):

```bash
# build and run
docker compose -f docker-compose.dev.yml up --build

# stop
docker compose -f docker-compose.dev.yml down
```

Notes:
- The container mounts the repository into /usr/src/app so code edits are visible immediately.
- The compose file sets environment flags to disable heavy optional services by default (AI / WebSocket / Push / Notifications) so the server starts fast.
