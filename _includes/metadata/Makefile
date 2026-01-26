## Description: Download metadata for the JRP from the Google Spreadsheet
##              for the project's metadata.  You need to update the SID variable below
##              when the deployment of the Google Apps Script has changed.
##
##              Type "make" in this directory to download the JSON files for the metadata.
##


#SID for JRP Metadata
SID = AKfycbwuWnQ6O9AGgbBT7B2rLPwEQw9i7NRHtkA2Jq8A1L6drL9Th7PR-jARwDKP6kZEhED56w

all: download

download: works composers sources editions

works:
	curl -L "https://script.google.com/macros/s/$(SID)/exec?sheet=works" > works.json

composers:
	curl -L "https://script.google.com/macros/s/$(SID)/exec?sheet=composers" > composers.json

sources:
	curl -L "https://script.google.com/macros/s/$(SID)/exec?sheet=sources" > sources.json

editions:
	curl -L "https://script.google.com/macros/s/$(SID)/exec?sheet=editions" > editions.json
