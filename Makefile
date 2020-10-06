.DEFAULT_GOAL := help
.PHONY: docker-build docker-up build start log stop restart

DOCKER_COMPOSE=docker-compose -f docker-compose.yml
DOCKER_COMPOSE_PROD=docker-compose -f docker-compose-prod.yml

# Docker
docker-build:
	$(DOCKER_COMPOSE) build

docker-build-prod:
	$(DOCKER_COMPOSE_PROD) build


docker-up:
	$(DOCKER_COMPOSE) up -d --remove-orphans mongo

docker-stop:
	$(DOCKER_COMPOSE) down
	$(DOCKER_COMPOSE) rm -fv

docker-stop-prod:
	$(DOCKER_COMPOSE_PROD) down
	$(DOCKER_COMPOSE_PROD) rm -fv

docker-clean:
	$(DOCKER_COMPOSE) kill
	$(DOCKER_COMPOSE) rm -fv

docker-start:
	$(DOCKER_COMPOSE) up -d --force-recreate

docker-start-prod:
	$(DOCKER_COMPOSE_PROD) up -d --force-recreate

docker-restart:
	$(DOCKER_COMPOSE) up -d --force-recreate

log:
	$(DOCKER_COMPOSE) logs -f dfc-app dfc-ui dfc-middleware

# Start
start: docker-start
start-prod: docker-start-prod

stop: docker-stop
stop-prod: docker-stop-prod

restart: docker-restart

build: docker-build
build-prod: docker-build-prod
