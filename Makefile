.DEFAULT_GOAL := help
.PHONY: docker-build docker-up build start log stop restart

DOCKER_COMPOSE=docker-compose -f docker-compose.yml
DOCKER_COMPOSE_PROD=docker-compose -f docker-compose-prod.yml
DOCKER_COMPOSE_DEV=docker-compose -f docker-compose-dev.yml
DOCKER_COMPOSE_STAGING=docker-compose -f docker-compose-staging.yml

# Docker
docker-build:
	$(DOCKER_COMPOSE) build

docker-build-prod:
	$(DOCKER_COMPOSE_PROD) build

docker-build-staging:
	$(DOCKER_COMPOSE_STAGING) build

docker-up:
	$(DOCKER_COMPOSE) up -d --remove-orphans mongo

docker-stop:
	$(DOCKER_COMPOSE) down

docker-stop-prod:
	$(DOCKER_COMPOSE_PROD) down

docker-stop-dev:
	$(DOCKER_COMPOSE_DEV) down

docker-stop-staging:
	$(DOCKER_COMPOSE_STAGING) down

docker-clean:
	$(DOCKER_COMPOSE) kill
	$(DOCKER_COMPOSE) rm -fv

docker-start:
	$(DOCKER_COMPOSE) up -d --force-recreate

docker-start-prod:
	$(DOCKER_COMPOSE_PROD) up -d --force-recreate

docker-start-dev:
	$(DOCKER_COMPOSE_DEV) up -d --force-recreate

docker-start-staging:  
	$(DOCKER_COMPOSE_STAGING) up -d --force-recreate

docker-restart:
	$(DOCKER_COMPOSE) up -d --force-recreate

log-app:
	$(DOCKER_COMPOSE) logs -f dfc-app

log-ui:
	$(DOCKER_COMPOSE) logs -f dfc-ui

# Start
start:
	make docker-start
start-prod: docker-start-prod
start-dev:
	make docker-start-dev
start-staging: docker-start-staging

stop: docker-stop
stop-prod: docker-stop-prod
stop-dev: docker-stop-dev
stop-staging: docker-stop-staging

restart: docker-restart

build: docker-build
build-prod: docker-build-prod
