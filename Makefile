# Default: refresh metadata, build changed/missing assets, and verify R2 uploads.
.DEFAULT_GOAL := all
ASSET_TOOL_DIR ?= ../digital-library-build
ASSET_PYTHON ?= $(ASSET_TOOL_DIR)/.venv/bin/python
ASSET_IDS ?=
ASSET_ARGS ?=
WORKFLOW = $(ASSET_PYTHON) "$(ASSET_TOOL_DIR)/tools/workflow/run.py" --project jrp --website "$(CURDIR)" $(if $(ASSET_IDS),--ids "$(ASSET_IDS)")

.PHONY: all assets assets-plan download texts
all: assets

assets:
	$(WORKFLOW) $(ASSET_ARGS)

assets-plan:
	$(WORKFLOW) --plan $(ASSET_ARGS)

download:
	$(MAKE) -C _includes/metadata download

texts:
	ruby _includes/metadata/build-text-index.rb

AVAILABILITY_ARGS ?=
AVAILABILITY_MAX_AGE_DAYS ?= 30
.PHONY: availability availability-monthly
availability:
	node $(ASSET_TOOL_DIR)/tools/website/generate-asset-availability.mjs $(AVAILABILITY_ARGS)
availability-monthly:
	node $(ASSET_TOOL_DIR)/tools/website/run-asset-availability-monthly.mjs --max-age-days $(AVAILABILITY_MAX_AGE_DAYS) -- $(AVAILABILITY_ARGS)
