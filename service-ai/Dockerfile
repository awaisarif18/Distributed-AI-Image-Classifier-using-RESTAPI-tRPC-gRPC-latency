# Use a lightweight Node.js image (Alpine Linux)
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package definitions first (better for Docker caching)
COPY package*.json ./

# Install production dependencies only
RUN npm install --only=production

# Copy the rest of the application code (including the local protos folder)
COPY . .

# Tell Docker we intend to use the port Render assigns
# (This is mostly for documentation, Render overrides it)
EXPOSE 10000

# Start the server
CMD [ "node", "server.js" ]