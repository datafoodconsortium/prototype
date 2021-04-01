.DEFAULT_GOAL := help
.PHONY: docker-build docker-up build start log stop restart

DOCKER_COMPOSE=docker-compose -f docker-compose.yml
DOCKER_COMPOSE_PROD=docker-compose -f docker-compose-prod.yml
DOCKER_COMPOSE_DEV=docker-compose -f docker-compose-dev.yml

# Docker
docker-build:
	$(DOCKER_COMPOSE) build

docker-build-prod:
	$(DOCKER_COMPOSE_PROD) build


docker-up:
	$(DOCKER_COMPOSE) up -d --remove-orphans mongo

docker-stop:
	$(DOCKER_COMPOSE) down

docker-stop-prod:
	$(DOCKER_COMPOSE_PROD) down

docker-stop-dev:
	$(DOCKER_COMPOSE_DEV) down

docker-clean:
	$(DOCKER_COMPOSE) kill
	$(DOCKER_COMPOSE) rm -fv

docker-start:
	$(DOCKER_COMPOSE) up -d --force-recreate

docker-start-prod:
	$(DOCKER_COMPOSE_PROD) up -d --force-recreate

docker-start-dev:
	$(DOCKER_COMPOSE_DEV) up -d --force-recreate

docker-restart:
	$(DOCKER_COMPOSE) up -d --force-recreate

log:
	$(DOCKER_COMPOSE) logs -f dfc-app dfc-ui dfc-middleware dfc-fuseki

# Start
start:
	rm -rf ./dfc-semapps/node_modules
	make docker-start
start-prod: docker-start-prod
start-dev:
	rm -rf ./dfc-semapps/node_modules
	make docker-start-dev

stop: docker-stop
stop-prod: docker-stop-prod
stop-dev: docker-stop-dev

restart: docker-restart

build: docker-build
build-prod: docker-build-prod
