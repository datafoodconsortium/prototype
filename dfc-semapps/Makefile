.DEFAULT_GOAL := help
.PHONY: link unlink install push allo
SEMAPPS_PATH=./../../semapps
PACKAGES=jsonld inference auth webid ldp middlewares


clean :
	sudo rm -rf .yalc
	sudo rm -rf node_modules
	rm -f yarn.lock
	rm -f yalc.lock
	rm -f package-lock.json
	rm -f yarn-error.log


install :
	make clean
	yarn install

link:
	$(foreach package,$(PACKAGES),$(call link-package,$(package)))
	make hotlink

hotlink:
	nodemon -w $(SEMAPPS_PATH)/src/middleware/packages -x "make push"

push:
	$(foreach package,$(PACKAGES),$(call push-package,$(package)))

unlink:
	yalc installations clean
	yalc remove --all
	make install

define link-package
	yalc publish $(SEMAPPS_PATH)/src/middleware/packages/$(1);
	yalc link @semapps/$(1);
	yarn --cwd .yalc/@semapps/$(1) install;
endef

define push-package
	yalc push $(SEMAPPS_PATH)/src/middleware/packages/$(1) --changed;
endef
