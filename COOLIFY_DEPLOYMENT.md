# Coolify Deployment Guide for Herbal Shop

This guide will walk you through deploying the Herbal Shop application on Coolify.

## Prerequisites

1. A Coolify instance up and running
2. Access to your GitHub repository with this code

## Step 1: Prepare Your Repository

Make sure your repository contains the following files:
- `Dockerfile` 
- `.dockerignore`
- `docker-compose.yml`
- `.env.production` (as a template for your environment variables)

## Step 2: Add a New Service in Coolify

1. Log in to your Coolify dashboard
2. Navigate to "Resources" and click "New Resource"
3. Select "Application"
4. Choose "Docker" as the deployment method
5. Connect your GitHub/GitLab repository where the Herbal Shop code is stored
6. Select the branch you want to deploy (usually `main` or `master`)

## Step 3: Configure the Application

1. **Basic Configuration**
   - Name: `herbal-shop` (or any name you prefer)
   - Build Method: Docker
   - Port: 3000
   - Public: Yes (to make the application accessible from the internet)

2. **Environment Variables**
   Add the following environment variables:
   - `DATABASE_URL`: For SQLite, use `file:./db.sqlite` or set up a proper database URL
   - `NEXTAUTH_SECRET`: A secure random string for JWT encryption
   - `NEXTAUTH_URL`: The URL where your application will be running
   - `NEXT_PUBLIC_API_URL`: The API URL (typically `https://your-domain.com/api`)

## Step 4: Build and Deploy

1. Click "Save" to save your configuration
2. Click "Deploy" to start the build process
3. Coolify will pull your code, build the Docker image, and deploy it

## Step 5: Verify the Deployment

1. Once the deployment is complete, click on the auto-generated URL to access your application
2. Verify that the application is running correctly
3. Check the logs if there are any issues

## Additional Configuration

### Persistent Storage

The `docker-compose.yml` includes a volume for SQLite database persistence. Coolify will automatically handle this for you.

### SSL/TLS

If you're using a custom domain:
1. Go to your service settings in Coolify
2. Configure your custom domain
3. Enable SSL/TLS (Coolify can automatically provision Let's Encrypt certificates)

### Upgrading

To update your application:
1. Push changes to your repository
2. In Coolify, go to your service
3. Click "Deploy" to rebuild and deploy the latest version

## Troubleshooting

If you encounter issues:
1. Check the logs in Coolify dashboard
2. Verify your environment variables
3. Make sure your Dockerfile is correctly configured
4. Ensure port 3000 is exposed in your Dockerfile

For more help, refer to the [Coolify documentation](https://coolify.io/docs/). 