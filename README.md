# Personal portfolio (MERN)

## Requirements and local setup

Install Node.js 20+ and create a MongoDB Atlas cluster. In Atlas, add your current IP under **Network Access**, create a database user under **Database Access**, then choose **Connect → Drivers → Node.js**. Copy the URI, replace `<password>` with that database user's URL-encoded password, and set the database name to `portfolio`.

1. Create `server/.env` with `PORT=5000`, `MONGO_URI`, a unique random `JWT_SECRET` (at least 32 characters), `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `CLIENT_URL=http://localhost:5173`, `UPLOAD_DIR=uploads`, and `NODE_ENV=development`. Keep real values only in `.env`.
2. Copy `client/.env.example` to `client/.env` (the default API URL works locally).
3. In `portfolio/server`, run `npm install`, then `npm run seed:admin`, then `npm run dev`.
4. In another terminal, from `portfolio/client`, run `npm install`, then `npm run dev`.
5. Visit `http://localhost:5173/admin/login`. Admin credentials are the values in `server/.env`.

New admin uploads are validated and stored as binary assets in MongoDB, then served through the API. This keeps newly uploaded project images and resumes available across server restarts without relying on an ephemeral filesystem. Existing `/uploads/...` links remain supported when their files still exist on the server disk.

## Deployment

The repository includes a Render Blueprint at `render.yaml` and Vercel SPA routing at `client/vercel.json`.

1. Put `portfolio` in a GitHub repository and import that repository into Render. Apply the Blueprint. It configures the API service, health check, environment variables, and persistent upload storage. The Blueprint selects Render's paid Starter plan because persistent disks require a paid web service; review the current plan and disk cost in Render before applying it.
2. In Render, set `MONGO_URI` to a hosted MongoDB Atlas URI, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and a temporary `CLIENT_URL` if needed. The local MongoDB URI and local database files cannot be used by a publicly hosted API. Use Atlas Network Access to permit the Render service to connect.
3. Deploy `client` from the same repository to Vercel with the project root set to `client`. Set `VITE_API_URL` to the deployed Render API origin plus `/api`, for example `https://your-api.onrender.com/api`.
4. Copy the Vercel production origin into Render's `CLIENT_URL` and redeploy the API. Then run `npm run seed:admin` once in the Render service shell so the configured admin account is created in Atlas.
5. If you already have portfolio records in the local database, export and import them to Atlas before switching the public site. Keep local `.env` files out of Git; configure production secrets only in the hosting dashboard.

Render files persist on the attached disk mounted at `server/uploads`; without persistent storage or an object storage service, uploaded media can be lost on restart or deploy. Vercel rewrites client routes to `index.html` for React Router deep links. HTTPS is required for production authentication cookies.

### Render static-site uploads

The Render frontend is a static site and cannot serve files uploaded to the API service. Set the frontend's `VITE_API_URL` to the API service origin plus `/api` so the client resolves `/api/media/...` against the API host. New media is stored in MongoDB; old `/uploads/...` files still depend on the API service's disk. A file lost from an ephemeral filesystem must be uploaded again from the admin portal.

## Admin flow checklist

- Run the seed command and log in with the configured credentials.
- Create a profile and verify the public home page only renders saved content.
- Add, edit, and delete a skill/project; verify uploads and public links.
- Send a message from the public contact form, mark it read, and delete it.
- Change the admin password, log out, then confirm the new password works.
- Check mobile layout and verify empty sections display an empty state.

## Notes

The admin account is created from environment credentials by `npm run seed:admin`; it never stores a plaintext password. Reset `ADMIN_PASSWORD` in the environment and rerun the seed command to reset it. Never commit `.env` files. Public contact requests are validated and rate-limited.
