
worklist:
	cp -i worklist.json worklist-old.json
	wget 'http://josquin.stanford.edu/data?a=worklist-json-dynamic' -O worklist.json
	diff worklist-old.json worklist.json
	

test:
	wget 'http://josquin.stanford.edu/data?a=worklist-json-dynamic' -O test.json
	diff worklist.json test.json
	

