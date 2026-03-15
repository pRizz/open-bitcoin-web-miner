# Welcome to your Lovable project

[![GitHub Stars](https://img.shields.io/github/stars/pRizz/leading-zero-lab)](https://github.com/pRizz/leading-zero-lab)

## Common Commands

```sh
npm run tsc && npm run lint:fix
npm test
npm run dev
```

## Project info

**URL**: https://lovable.dev/projects/d92f5bad-8918-4827-a7b9-d4b9e8b466e9

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/d92f5bad-8918-4827-a7b9-d4b9e8b466e9) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Production deploys run automatically on pushes to `main` via [deploy-production.yml](.github/workflows/deploy-production.yml).

The workflow uses the GitHub `production` environment and expects:

- Variable `AWS_REGION=us-east-2`
- Variable `S3_BUCKET=www.winabitco.in`
- Variable `CLOUDFRONT_DISTRIBUTION_ID=EVH2SH6YOOO76`
- Variable `AWS_DEPLOY_ROLE_ARN=<oidc-assumable-role-arn>`
- Secret `SENTRY_AUTH_TOKEN=<production sentry token>`

For local manual deploys, use:

```sh
./scripts/build-and-deploy-to-s3.sh
```

Or, if the build already exists and you only want the deploy step:

```sh
npm run deploy
```

The `win3bitcoin.com` redirect infrastructure is separate from the main app deploy and remains unchanged.

To have **win3bitcoin.com** redirect to the app, see [S3 redirect setup](docs/s3-redirect-setup.md) (one-time bucket + DNS; use `./scripts/setup-redirect.sh` as the orchestrator or call the step scripts directly under `./scripts/redirect/`).

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
