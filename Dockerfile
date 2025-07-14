# Base image
FROM node:lts-buster

# Set working directory
WORKDIR /

# Copy only package.json
COPY package.json .

# Install production dependencies
RUN npm install --omit=dev

# Copy the rest of the application
COPY . .

# Expose your app port
EXPOSE 9090

# Start the app
CMD ["npm", "start"]
