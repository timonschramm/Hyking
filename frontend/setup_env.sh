#!/bin/bash

# List of environment variable keys to include in the .env file
keys=("SUPABASE_ANON_KEY" "SUPABASE_REDIRECT_URL" "SUPABASE_URL" "OPENAI_API_KEY")

# Check or create the .env file
if [ ! -f .env ]; then
  touch .env
fi

# Add each key to the .env file
echo "Creating .env file with variables from Vercel..."
for key in "${keys[@]}"; do
  value=${!key}
  if [ -n "$value" ]; then
    echo "$key=$value" >> .env
  else
    echo "Warning: $key is not set in Vercel."
  fi
done

echo ".env file created successfully!"