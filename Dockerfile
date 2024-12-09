# Use an official Node.js image as the base
FROM node:16-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.jsonn
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Expose the application port (e.g., 3000)
EXPOSE 3000

# Define the default command to run the application
CMD ["npm", "start"]

