# Direct Google Sheets CSV downloads; helper lives in digital-library-build.
LIBRARY_BUILD ?= ../../../digital-library-build
SHEET_PYTHON ?= python3
DOWNLOAD = $(SHEET_PYTHON) "$(LIBRARY_BUILD)/tools/metadata/download.py" --project jrp --website "$(abspath ../..)"
TABLES = works composers commentary editions
AVAILABILITY_ARGS ?=
AVAILABILITY_MAX_AGE_DAYS ?= 30

.PHONY: all download metadata availability availability-monthly $(TABLES)
all: download
download: metadata
	$(MAKE) availability-monthly
metadata:
	$(DOWNLOAD)
$(TABLES):
	$(DOWNLOAD) --table "$@"
availability:
	node "$(LIBRARY_BUILD)/tools/website/generate-asset-availability.mjs" $(AVAILABILITY_ARGS)
availability-monthly:
	node "$(LIBRARY_BUILD)/tools/website/run-asset-availability-monthly.mjs" --max-age-days $(AVAILABILITY_MAX_AGE_DAYS) -- $(AVAILABILITY_ARGS)
