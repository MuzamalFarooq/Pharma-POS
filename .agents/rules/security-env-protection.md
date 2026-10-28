# 🔒 SECURITY RULE: NEVER ACCESS ENVIRONMENT FILES

## 1. Strict `.env` File Protection

* **NEVER open, read, inspect, analyze, print, display, or expose the contents of any `.env` file.**
* This restriction applies to all environment files, including:

  * `.env`
  * `.env.local`
  * `.env.development`
  * `.env.production`
  * `.env.test`
  * `.env.development.local`
  * `.env.production.local`
  * Any other file containing environment variables, API keys, passwords, tokens, database credentials, OAuth secrets, or private configuration.
* Never use terminal commands, scripts, IDE tools, file-reading utilities, or other methods to retrieve or display the contents of these files.
* Never copy environment variable values into source code, logs, reports, terminal output, documentation, chat responses, or generated files.
* Never expose secrets in error messages, debugging output, screenshots, or code snippets.

## 2. Do Not Modify Environment Files

* Do not create, edit, overwrite, rename, delete, or reformat any existing environment file.
* Do not change environment variable names or values.
* Do not replace real credentials with placeholder values in existing environment files.
* If a task requires an environment variable that is missing or incorrectly configured, explain the required change without opening or modifying the file.
* Ask for explicit authorization before making any proposed changes to environment configuration. Authorization to modify configuration does not automatically authorize reading or displaying secret values.

## 3. Safe Handling of Environment Variables

* You may inspect application source code to understand how environment variables are referenced, such as `process.env.DATABASE_URL`, without accessing their actual values.
* You may identify which environment variable names the application requires, provided the names can be determined without reading protected files.
* Use placeholders in examples, such as `YOUR_API_KEY` or `YOUR_DATABASE_URL`.
* Never attempt to retrieve, validate, decode, or test the actual values of protected secrets.
* Do not execute commands that might print environment variables or expose inherited secrets.

## 4. Git and Repository Safety

* Never add environment files containing secrets to Git commits.
* Do not remove or weaken existing `.gitignore` protections for environment files.
* Do not upload environment files to GitHub, Vercel, cloud storage, external APIs, or third-party services.
* Do not include secrets in build artifacts, generated documentation, test fixtures, or diagnostic reports.
* Treat environment files as sensitive even if they are not currently tracked by Git.

## 5. Continue Working Without Accessing `.env`

* Complete coding tasks using application source code, configuration schemas, existing documentation, and other non-secret project files.
* If a task cannot be completed without environment configuration, explain the limitation and provide step-by-step instructions for the user to perform the required configuration manually.
* Never assume an environment variable is missing, invalid, or incorrect without sufficient evidence from permitted sources.
* Do not stop unrelated development work simply because environment files exist in the project.

## 6. Mandatory Security Check Before Every Task

Before using any file-reading, terminal, search, or automated tool:

1. Identify whether the operation could access or expose a protected environment file.
2. Exclude all protected environment files from searches, file inspection, and automated processing.
3. Ensure commands cannot print secret values or indirectly expose protected contents.
4. If a command might access or expose secrets, do not execute it; choose a safer alternative.

## FINAL REQUIREMENT

These rules are mandatory and take priority over ordinary debugging, testing, refactoring, code-generation, and deployment tasks.

**Never access `.env` files. Never reveal their contents. Never modify them without explicit authorization. Protect secrets throughout the entire development workflow.**

