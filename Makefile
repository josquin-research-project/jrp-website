AVAILABILITY_ARGS ?=
AVAILABILITY_MAX_AGE_DAYS ?= 30

all: download

download:
	(cd _includes/metadata && make download)

availability:
	node tools/generate-asset-availability.mjs $(AVAILABILITY_ARGS)

availability-monthly:
	node tools/run-asset-availability-monthly.mjs --max-age-days $(AVAILABILITY_MAX_AGE_DAYS) -- $(AVAILABILITY_ARGS)
