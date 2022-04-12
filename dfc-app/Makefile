.DEFAULT_GOAL := help
.PHONY: link unlink install push
NAVIGATOR_PATH=./../../LDP-navigator/

hard-clean :
	make clean
	sudo rm -rf node_modules
	sudo rm -rf .yalc


clean :
	sudo rm -rf package-lock.json
	sudo rm -rf yarn.lock
	sudo rm -rf yalc.lock
	sudo rm -f yarn-error.log

install :
	yarn install

link:
	make link-package
	npm install

watch-link :
	nodemon -w $(NAVIGATOR_PATH) -x "make push";

push:
	make push-package

unlink:
	yalc installations clean
	yalc remove --all
	npm install

link-package :
	yalc publish $(NAVIGATOR_PATH);
	yalc link ldp-navigator;

push-package :
	yalc push $(NAVIGATOR_PATH) --changed;
