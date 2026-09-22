AVAILABILITY_ARGS ?=
AVAILABILITY_MAX_AGE_DAYS ?= 30

.PHONY: all download texts availability availability-monthly

all: download texts

download:
	(cd _includes/metadata && make download)

availability:
	node tools/generate-asset-availability.mjs $(AVAILABILITY_ARGS)

availability-monthly:
	node tools/run-asset-availability-monthly.mjs --max-age-days $(AVAILABILITY_MAX_AGE_DAYS) -- $(AVAILABILITY_ARGS)

# Refresh the work-ID index from the published scores repository.
texts:
	ruby _includes/metadata/build-text-index.rb
