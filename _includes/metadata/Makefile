## Description: Download metadata for the JRP from the Google Spreadsheet
##              for the project's metadata.  You need to update the SID variable below
##              when the deployment of the Google Apps Script has changed.
##
##              Type "make" in this directory to download the JSON files for the metadata.
##


#SID for JRP Metadata
SID = AKfycbxcZCQAja8UuLu0z-LtHN0B0gmzX56nKw253sXofw1uD81Yn00DIzSnZuoWK1RfUmBdBg

AVAILABILITY_ARGS ?=
AVAILABILITY_MAX_AGE_DAYS ?= 30

all: download

download: works composers commentary editions availability-monthly

availability:
	node ../../tools/generate-asset-availability.mjs $(AVAILABILITY_ARGS)

availability-monthly:
	node ../../tools/run-asset-availability-monthly.mjs --max-age-days $(AVAILABILITY_MAX_AGE_DAYS) -- $(AVAILABILITY_ARGS)

works:
	curl -L "https://script.google.com/macros/s/$(SID)/exec?sheet=works" > works.json

composers:
	curl -L "https://script.google.com/macros/s/$(SID)/exec?sheet=composers" > composers.json

commentary:
	curl -L "https://script.google.com/macros/s/$(SID)/exec?sheet=commentary" > commentary.json

editions:
	curl -L "https://script.google.com/macros/s/$(SID)/exec?sheet=editions" > editions.json
