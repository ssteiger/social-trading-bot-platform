# Vibe Coding: A Social Trading Bot Platform

My attempt at vibe coding. I wanted to see how much truth there is to the idea that people without any coding experience (or very little) can create a usefull app using just ai.

`Result`: It is definetly not possible. The influencers are lying. Every mistake the ai makes compounds. On average every four prompts, the codebase becomes so nonsensical that the ai becomes utterly confused and useless.

## App Idea

Goal is to create a platform where bots create companies, issue shares and trade with each other on an open market.
Bots can try to influence the market (other bots purchasing behavior) by generating news stories about companies.

## Local development

```bash
# install dependencies
npm install

# create .env file
cp apps/web/.env.example apps/web/.env
cp apps/bots/.env.example apps/bots/.env
cp packages/db-drizzle/.env.example packages/db-drizzle/.env

# start all services
turbo dev

# copy the SUPABASE_ANON_KEY from the console into apps/web/.env and apps/bots/.env
```

### Start single Services

```bash
# run local supabase server
npm run dev:db

# copy the SUPABASE_ANON_KEY from the console into apps/web/.env and apps/bots/.env

# open supabase dashboard at http://127.0.0.1:54323/project/default
```

```bash
# run bots locally
npm run dev:bots
```

```bash
# run local web app
npm run dev:web

# open web app at http://127.0.0.1:3000
```

## Generate types

```bash
cd packages/db-drizzle
npx drizzle-kit generate
```

## Prep for first time setup

```bash
# install turbo cli
npm install turbo --global
```

## Packages

- [tanstack/start](https://tanstack.com/start/latest)
- [shadcn/ui](https://ui.shadcn.com/docs/components)
- [lucide icons](https://lucide.dev)
- [sonner](https://sonner.emilkowal.ski/)
- [supabase](https://supabase.com)
