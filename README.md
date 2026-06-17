# Brewer

## Container Deployment

This app is a static Vite frontend, there is no backend yet. All data is stored locally in the browser's localStorage.

1. Build the app with Node.
2. Serve the generated `dist/` files with Nginx.

### Docker

Build the image:

```powershell
docker build -t brewer .
```

Run it:

```powershell
docker run -d --name brewer -p 8080:80 --restart unless-stopped brewer
```

### Notes

- App data is stored in browser `localStorage`, not on the server filesystem.
- Each browser/device keeps its own brew history
