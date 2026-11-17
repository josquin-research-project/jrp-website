# Default: refresh assets, then synchronize the highlighted-PDF search service.
.DEFAULT_GOAL := all
ASSET_TOOL_DIR ?= ../digital-library-build
ASSET_PYTHON ?= $(ASSET_TOOL_DIR)/.venv/bin/python
ASSET_IDS ?=
ASSET_ARGS ?=
SEARCH_WORKFLOW = $(ASSET_PYTHON) "$(ASSET_TOOL_DIR)/tools/search/cloud_run/update.py" --project jrp --website "$(CURDIR)"
WORKFLOW = $(ASSET_PYTHON) "$(ASSET_TOOL_DIR)/tools/website/fast-assets.py" --project jrp --website "$(CURDIR)" $(if $(ASSET_IDS),--ids "$(ASSET_IDS)")

.PHONY: all assets assets-plan assets-audit download texts search-update search-plan
all: assets
	$(if $(strip $(ASSET_ARGS) $(ASSET_IDS)),@echo "Partial/special asset run: skipping search deployment.",$(MAKE) search-update)

SEARCH_ARGS ?=
search-update:
	$(SEARCH_WORKFLOW) $(SEARCH_ARGS)

search-plan:
	$(SEARCH_WORKFLOW) --plan

assets:
	$(WORKFLOW) $(ASSET_ARGS)

assets-audit:
	$(subst tools/website/fast-assets.py,tools/workflow/run.py,$(WORKFLOW)) --audit $(ASSET_ARGS)

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
