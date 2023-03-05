all: server

server: client
	yarn start

client: install-dependencies
	yarn build

install-dependencies:
	yarn install
