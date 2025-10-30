#!/usr/bin/env node

/**
 * Vercel Deployment Script
 * This script helps deploy the application to Vercel with PostgreSQL support
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Check if we're in the correct directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('Error: package.json not found. Please run this script from the project root directory.');
  process.exit(1);
}

// Read package.json to get project name
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const projectName = packageJson.name || 'xpanel';

console.log(`Deploying ${projectName} to Vercel with PostgreSQL support...`);

try {
  // 1. Install dependencies
  console.log('Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // 2. Build the frontend
  console.log('Building frontend...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // 3. Check if Vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'pipe' });
  } catch (error) {
    console.log('Vercel CLI not found. Installing...');
    execSync('npm install -g vercel', { stdio: 'inherit' });
  }
  
  // 4. Deploy to Vercel
  console.log('Deploying to Vercel...');
  execSync('vercel --prod', { stdio: 'inherit' });
  
  console.log('Deployment completed successfully!');
  
} catch (error) {
  console.error('Deployment failed:', error.message);
  process.exit(1);
}