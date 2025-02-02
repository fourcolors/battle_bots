# Battle Bots Remix App

This is the Remix frontend app for the Battle Bots project. It's part of a Turborepo monorepo workspace.

## Game System

Our game system is based on a hex-based, on-chain battle bot game. [View the complete game system specification](GAME_SYSTEM.md).

Key features:

- Hex-based grid combat system
- Strategic bot building with stat allocation
- 5 unique weapons with different mechanics
- Turn-based combat with Action Points
- On-chain implementation ready

## Development

This project uses pnpm workspaces. All commands should be run from the root of the monorepo:

```bash
# Install dependencies (run from root)
pnpm install

# Start development server (run from root)
pnpm dev
```

If you need to run commands specifically for this app:

```bash
# From the root directory
pnpm --filter @battle-bots/remix dev

# Or from this directory
pnpm dev
```

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking

## Adding Dependencies

To add new dependencies, run from the root directory:

```bash
# Add a production dependency
pnpm add --filter @battle-bots/remix package-name

# Add a development dependency
pnpm add -D --filter @battle-bots/remix package-name

# Add a dependency to the root workspace
pnpm add -w package-name
```

## Project Structure

- `app/` - Application source code
  - `components/` - React components
  - `routes/` - Remix routes
  - `lib/` - Utility functions and shared code

## Deployment

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying Node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `npm run build`

- `build/server`
- `build/client`

## Styling

This template uses [Tailwind CSS](https://tailwindcss.com/) with shadcn/ui components. The styling is configured through the root workspace's Tailwind configuration.
