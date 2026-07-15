//////////////////////////////
//
// DisplayReferences --
//

function DisplayReferences(jrpid, target) {
/*
   ReadFileAsync("http://{{site.dataurl}}/includes/references.json", function(responseText) {
		var edition = GetReferenceEdition(jrpid, responseText);
		if (edition.match(/^\s*$/)) {
			return;
		}
	   var element = document.getElementById(target);
		element.innerHTML = '<h3 class="brown-border">Modern Edition</h3>' + edition;
	});

*/
}



/////////////////////////////
//
// GetReferenceEdition --
//

function GetReferenceEdition(jrpid, referenceinfo) {
/*
   var refinfo = JSON.parse(referenceinfo);
   var i;
   var j;
   var text = "";
   var link = "";
   for (i=0; i<refinfo.length; i++) {
		var entry = refinfo[i];
		for (j=0; j<entry.jrpid.length; j++) {
			if (jrpid.match(entry.jrpid[j])) {
				text = entry.text;
				link = entry.link;
			}
		}
   }

   if (text.match(/^\s*$/)) {
		return "";
	}

	var output = text;
	if (!link.match(/^\s*$/)) {
		output = '<a href="' + link + '" target="' + TARGET + '">' + text + '</a>';
	}
   return output;
*/
}
