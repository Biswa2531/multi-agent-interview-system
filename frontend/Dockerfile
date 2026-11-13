# Stage 1: Build the React App (Node 20 required for modern Vite)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
# Replace the default Nginx config with our SPA-aware config
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy the built React files into Nginx's web directory
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]