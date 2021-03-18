.DEFAULT_GOAL := help
.PHONY: link link-yarn unlink unlink-yarn
SEMAPPS_PATH=./../../semapps


install :
	npm install --force

link:


link-yarn:
	cd $(SEMAPPS_PATH)/src/middleware/packages/ldp && yarn link
	yarn link @semapps/ldp
	cd $(SEMAPPS_PATH)/src/middleware/packages/triplestore && yarn link
	yarn link @semapps/triplestore


unlink:


unlink-yarn:
	yarn unlink @semapps/ldp  --no-save
	cd $(SEMAPPS_PATH)/src/middleware/packages/ldp  && yarn unlink
	yarn unlink @semapps/triplestore  --no-save
	cd $(SEMAPPS_PATH)/src/middleware/packages/triplestore  && yarn unlink
