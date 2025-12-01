#!/bin/bash

# Copy data files to static/data directory
echo "Copying data files to static/data directory..."
mkdir -p static/data
cp -r ../data/*.csv static/data/

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

echo "Build completed successfully!"
