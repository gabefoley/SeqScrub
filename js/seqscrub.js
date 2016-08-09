var invalidChars



//Program a custom submit function for the form
$("form#data").submit(function(event){

  //Disable the default form submission
  event.preventDefault();
 
  //Grab all form data  
  var formData = new FormData($(this)[0]);
  invalidChars = $("#invalidChars").val().split(" ");

  //Change the filename for the file to save to mirror the uploaded filename
  var filepath = $('#file').val();
  var filename = filepath.split(/(\\|\/)/g).pop();

  $("#fileToSave").val(filename.split(".").join("_cleaned."))

  console.log(formData);


 
  $.ajax({
    url: 'upload.php',
    type: 'POST',
    data: formData,
    async: true,
    cache: false,
    contentType: false,
    processData: false,
    success: function (returndata) {
    	// console.log(returndata);

      jsonData = JSON.parse(returndata);

      for (var i = 0; i < jsonData.length; i++){
        // var speciesName = "";
        var record = jsonData[i];
        // console.log('Record here is ', record);

        var JSONtest = {id : record.trimmedHeader, seq : record.seq};
        getSpeciesFromLocal(record);

      }

    }
  });
 
  return false;
});


function getSpeciesFromExternal(record) {

  seqtype = record.seqtype;
  id = record.trimmedHeader;


  console.log('seqtype' + seqtype);


  if (seqtype == '>gi'){
    var url = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=protein&id=" + id + "&retmode=xml&rettype=full";
    path = "//Org-ref_taxname/text()";

  }
  
  if (seqtype == '>tr' || seqtype == '>sp'){
    var url = "http://www.uniprot.org/uniprot/" + id + ".xml";
    path = "//*[name()='uniprot']/*[name()='entry']/*[name()='organism']/*[name()='name'][@type='scientific']/text()";
  }

  // getSpeciesFromExternal2(record, path, url)



// }
//   function getSpeciesFromExternal2(record, path, url){


  
  $.ajax({
    url: url,
    type: 'POST',
    async: true,
    success: function (speciesData) {
      appendData(record, speciesData)
    },

    // If we couldn't map the sequence to a species
    error: function(){
      var string = record.originalHeader  + record.seq + "&#010;&#010;";
      $("#badIds").append(string.trim());

    }

  });
}

function appendData(record, speciesData){

  //Boolean value to hold if the current sequence has illegal characters
  containsBad = false;

  id = record.trimmedHeader;
  seq = record.seq;
  seqType = record.seqtype;


  xmlDoc = speciesData;
  var node = xmlDoc.evaluate(path, xmlDoc, null, XPathResult.ANY_TYPE, null);
  var species = node.iterateNext();
  var xmlText = new XMLSerializer().serializeToString(species);
  var speciesName = xmlText.replace(" ", "_");

  // Remove any instance of a subspecies 
  var splitName = speciesName.split(" ")[0];

  var string = ">" + id + "|" + splitName + "&#010;" + seq + "&#010;&#010;";

  // Check to see if there are any illegal characters
  for (i in seq){

    console.log(i + invalidChars);
    
    if (invalidChars.includes(seq[i])){
      console.log('Found bad character ' + id)
      containsBad = true;
    }
  }

  // If there are illegal characters highlight them within the text
  if (containsBad){
    for (i in invalidChars){
      // seq = seq.split(invalidChars[i]).join("<span class = 'highlight'>***" + invalidChars[i] + "***</span>");
      seq = seq.split(invalidChars[i]).join("*" + invalidChars[i] + "*");

    }

    var string = ">" + id + "|" + splitName + "&#010;" + seq + "&#010;&#010;";

    $("#badCharacters").append(string.trim());

  }
  else {
    
    dataString = "id=" + id + "&seqType=" + seqType + "&speciesName=" + splitName + "&seq=" + seq
    console.log('dataString is ' + dataString);
    // addspeciesToLocal(record)
    $.ajax({
      url: 'addSpeciesToLocal.php',
      type:'POST',
      data:dataString,
      success:function(){
        console.log("success!");
      }

    });


    $("#cleanedSeqs").append(string.trim());  
  }

  containsBad = false;
}

function getSpeciesFromLocal(record) {
  var dataString = 'id=' + record.trimmedHeader;
  $.ajax({
    url: 'getSpeciesFromLocal.php',
    type:'POST',
    data:dataString,
    success: function(returnData){
      // console.log("Return data from getSpeciesFromLocal" + returnData);


      speciesData = JSON.parse(returnData);

      // If we already have an entry with the same sequence then use this entry
      if (speciesData.length > 0 && data['seq'] == record.seq){
        data = speciesData[0];
        var string = ">" + data['id'] + "|" + data['speciesName'] + "&#010;" + record.seq + "&#010;&#010;";
        $("#cleanedSeqs").append(string.trim());  
      }

      else {
        getSpeciesFromExternal(record)
      }
    }
  })

}

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', $("#fileToSave").val());

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}


$("#cleanedSeqs").dblclick(function(){
  $("#cleanedSeqs").select();
});

$("#badCharacters").dblclick(function(){
  $("#badCharacters").select();
});

$("#badIds").dblclick(function(){
  $("#badIds").select();
});







