.DEFAULT_GOAL := help
.PHONY: link unlink install push
NAVIGATOR_PATH=./../LDP-navigator/

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

watch-link :
	nodemon -w $(NAVIGATOR_PATH) -x "yarn start";

push:
	make push-package

unlink:
	yarn unlink ldp-navigator
	yarn --cwd $(NAVIGATOR_PATH) unlink

	# yalc installations clean
	# yalc remove --all
	# npm install


link-package :
	yarn --cwd $(NAVIGATOR_PATH) link
	yarn link ldp-navigator
	# yalc publish $(NAVIGATOR_PATH);
	# yalc link ldp-navigator;
	# npm install

push-package :
	# make unlink
	# make link
	# yalc push $(NAVIGATOR_PATH) --changed;
