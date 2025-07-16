FROM node:18

RUN apt-get update && apt-get install -y postgresql-client dos2unix

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN dos2unix init.sh wait-for-it.sh

RUN chmod +x init.sh wait-for-it.sh

RUN npm run build

EXPOSE 8000

CMD ["./init.sh"]
