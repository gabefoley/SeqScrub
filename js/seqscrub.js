function loadXML(dname){
	console.log('Running loadXML');
	if (window.XMLHttpRequest){
		xhr = new XMLHttpRequest();
	}
	else {
		xhr = new ActiveXObject("Microsoft.XMLHTTP");
	}

	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4 && xhr.status == 200) {

			$("#alert").innerHTML = xhr.responseText;
			xmlDoc = xhr.responseXML;
			path = "//*[name()='uniprot']/*[name()='entry']/*[name()='organism']/*[name()='name'][@type='scientific']/text()";
			var node = xmlDoc.evaluate(path, xmlDoc, null, XPathResult.ANY_TYPE, null);
			var species = node.iterateNext();
			console.log(species);
			$("#alert").html(species);
		};
	}

xhr.open("GET", dname, true);
xhr.send("");

};

loadXML("http://www.uniprot.org/uniprot/B3IWM9_CYNPY.xml");


$("#alert").innerHTML = "hello";

// Upload the file to the server
// var form = document.getElementById('file-form');
// var fileSelect = document.getElementById('file-select');
// var uploadButton = document.getElementById('upload-button');

// form.onsumit = function(event){
// 	event.preventDefault();

// 	// Update button text
// 	uploadButton.innerHTML = "Uploading..."

// 	// Get the selected file
// 	var file = fileSelect.file;

// 	// Create a FormData object
// 	var formData = new FormData();

// 	formData.append('files[]', file, file.name);

// 	// Set up the request
// 	var xhr = new XMLHttpRequest();

// 	// Open the connection
// 	xhr.open('POST', 'handler.php', true);

// 	xhr.onload = function(){
// 		if (xhr.status === 200) {
// 			uploadButton.innerHTML = 'Upload';
// 			console.log(file);
// 		}
// 		else {
// 			alert('An error occured!');
// 		}
// 	};

// 	xhr.send(file);


// }
