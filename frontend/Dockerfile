FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm ci

# Copying the sources
COPY . .

# Put together production build
RUN npm run build

# Production stage
FROM nginx:alpine

# Copying the application
COPY --from=build /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]