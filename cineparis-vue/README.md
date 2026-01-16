# CinéParis (Vue 3 + Vite)

## Installation
```bash
npm install
```

## Lancer
```bash
npm run dev
```

## Config backend
Copie `.env.example` en `.env` puis adapte :
```
VITE_API_BASE_URL=http://localhost:8080
```

## Endpoints utilisés (d'après les fichiers fournis)
- Liste par ville : `GET /api/cities/{city}/movies`
- Détail film : `GET /api/movies/{id}`

## Admin
Le fichier `admin.js` n’était pas fourni : j’ai mis par défaut :
- `- Publication owner : `POST /api/owner/movies` avec `Authorization: Bearer <token>`