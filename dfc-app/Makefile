.DEFAULT_GOAL := help
.PHONY: link unlink install push
NAVIGATOR_PATH=./../../LDP-navigator/

clean :
	sudo rm -rf .yalc
	sudo rm -rf node_modules


install :
	rm -f yarn.lock
	rm -f yarn-error.log
	yarn install

link:
	make link-package
	nodemon -w $(NAVIGATOR_PATH) -x "make push";

push:
	make push-package

unlink:
	yalc installations clean
	yalc remove --all
	make install

link-package :
	yalc publish $(NAVIGATOR_PATH);
	yalc link ldp-navigator;

push-package :
	yalc push $(NAVIGATOR_PATH) --changed;
