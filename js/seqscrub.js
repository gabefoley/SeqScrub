var invalidChars
var cleanedSeqString = '';



//Program a custom submit function for the form
$("form#data").submit(function(event){

  // $("#cleanedSeqs").html("<header id ='cleanedSeqsHeader'> Cleaned sequences: </header><br><br>");
  // $("#badCharacters").html("<header id ='badCharactersHeader'> Sequences with illegal characters: </header><br><br>");
  // $("#badIds").html("<header id ='badIdsHeader'> Sequences that couldn't be mapped to a species: </header><br><br>");
 
  //Disable the default form submission
  event.preventDefault();
 
  //Grab all form data  
  var formData = new FormData($(this)[0]);
  invalidChars = $("#invalidChars").val().split(" ");
  console.log(invalidChars);

  //Change the filename for the file to save to mirror the uploaded filename
  var filepath = $('#file').val();
  var filename = filepath.split(/(\\|\/)/g).pop();

  $("#fileToSave").val(filename.split(".").join("_cleaned."))

  console.log('filename ', filename.split(".").join("_cleaned."));

 
  $.ajax({
    url: 'upload.php',
    type: 'POST',
    data: formData,
    async: true,
    cache: false,
    contentType: false,
    processData: false,
    success: function (returndata) {
    	console.log(returndata);

      jsonData = JSON.parse(returndata);

      for (var i = 0; i < jsonData.length; i++){
        // var speciesName = "";
        var record = jsonData[i];
        // console.log('Record here is ', record);
        // console.log(record.trimmedHeader);

        var JSONtest = {id : record.trimmedHeader, seq : record.seq};

        // getSpeciesFromLocal(function(output){
        //   console.log('here is the output ', output);
        // });

        // speciesData = getSpeciesFromLocal(record.trimmedHeader);
        // console.log('Species data from back here is ', speciesData);
        // console.log('Species data from back here is ', speciesData[0]['speciesName']);


        // if (localData == null){
        //   console.log('Was null');
        // }

        // else {
        //   console.log(localData);

        // }


        // if (!getSpeciesFromLocal(record.trimmedHeader)){
        // console.log('Trimmed header', record.trimmedHeader);
        // console.log('Seq', record.seq);
        // console.log('Seq type', record.seqtype);
        getSpeciesName(record.trimmedHeader, record.seq, record.seqtype, record.originalHeader);

        //   }

      }

    }
  });
 
  return false;
});


  function getSpeciesName(id, seq, seqtype, originalHeader) {
    // console.log('seqtype is ', seqtype);

    if (seqtype == '>gi'){
      // console.log('here first');
      var url = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=protein&id=" + id + "&retmode=xml&rettype=full";
      path = "//Org-ref_taxname/text()";


    }

    if (seqtype == '>tr' || seqtype == '>sp'){
      // console.log('got here');
      var url = "http://www.uniprot.org/uniprot/" + id + ".xml";
      path = "//*[name()='uniprot']/*[name()='entry']/*[name()='organism']/*[name()='name'][@type='scientific']/text()";

    }


    returnSpeciesName(id, seq, seqtype, originalHeader, url, path);

  
};

function returnSpeciesName(id, seq, seqtype, originalHeader, url, path){
  containsBad = false;
  $.ajax({
    url: url,
    type: 'POST',
    async: true,
    success: function (speciesData) {
      // console.log(speciesData)
      xmlDoc = speciesData;
      var node = xmlDoc.evaluate(path, xmlDoc, null, XPathResult.ANY_TYPE, null);
      var species = node.iterateNext();



      // console.log('Species here is ', species);
      // console.log('ID here is ', id);


      var xmlText = new XMLSerializer().serializeToString(species);
      var speciesName = xmlText.replace(" ", "_");

      // Remove any instance of a subspecies 
      var splitName = speciesName.split(" ")[0];

      // console.log("SPECIES NAME BEFORE RETURN IS", speciesName, 'And trimmed id is ', id);

      var string = ">" + id + "|" + splitName + "&#010;" + seq + "&#010;&#010;";


      // console.log('Invalid chars', invalidChars);
      for (i in seq){
        if (invalidChars.includes(seq[i])){
          // console.log('i is', i);
          // console.log('seq length is ', seq.length);
        // console.log('seq ', seq);        
        //   console.log('first part', seq.substr(0, i));
        // console.log('letter is ', seq[i]);
        
        // console.log('final part', seq.substr(316));
          // console.log(seq.substr(i+1, seq.length));
          // console.log(seq.substr(2851, seq.length));
          // nextIndex = i+1;
          // highlightedSeq =  seq.substr(0, i) + "<span class = 'highlight'>" + seq[i] + "</span>" + seq.substr(nextIndex);
          // console.log('highlighted Seq', highlightedSeq);
          // console.log('this is the i +1', seq.substr(i + 1));      
          // string = ">" + id + "_" + splitName + "<br />" + highlightedSeq + "<br /><br />";

          containsBad = true;
        }
      }
      if (containsBad){
        for (i in invalidChars){

          seq = seq.split(invalidChars[i]).join("<span class = 'highlight'>" + invalidChars[i] + "</span>");
        }
        // console.log('new seq is ', newSeq);
        // var newSeq = seq.split('[BJOUXZ]').join("<span class = 'highlight'>")
        // console.log('string is ', string);
        var string = ">" + id + "|" + splitName + "&#010;" + seq + "&#010;&#010;";

        $("#badCharacters").append(string.trim());

      }
      else {
        // cleanedString = ">" + id + "|" + splitName + "&#13" + seq + "&#13&#13";
        // console.log('cleaned string is', cleanedString);
        // console.log('cleaned seq string is', cleanedSeqString);

        // cleanedSeqString.trim();
        // cleanedSeqString += cleanedString;
        // console.log('cleaned seq string is', cleanedSeqString);
        // $("#cleanedSeqs").html($("#cleanedSeqs").val() + string);

        // $("#cleanedSeqs").innerHTML = $("#cleanedSeqs").val() + string;\
        $("#cleanedSeqs").append(string.trim());

      
      }

      containsBad = false;


    },

    error: function(){
      // console.log('ERROR')
      // console.log(originalHeader);
      var string = originalHeader + "&#010;" + seq + "&#010;&#010;";
      // console.log('string', string);
      $("#badIds").append(string.trim());

    }

  });
}

function getSpeciesFromLocal(id) {
  // console.log ('Species from local... ');
  var dataString = 'id=' + id;

  $.ajax({
    url: 'getSpeciesFromLocal.php',
    type:'POST',
    data:dataString,
    success: function(returnData){
      // console.log(returnData);
      speciesData = JSON.parse(returnData);
      id(speciesData);
      // console.log('Species data', speciesData );


      // console.log('Species data', speciesData[0]['speciesName']);
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

function downloadThis(){
  console.log('Download this');
};

// $("form#save").submit(function(event){

//   preventDefault;
// });


// $("#saveButton").click(function(event){
//   var text = cleanedSeqString;
//   var filename = $("#fileToSave").val()
//   var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
//   console.log(blob);
//   saveAs(blob, filename+".txt");


//   // // console.log('clicked save');
//   // var filename = $("#fileToSave").val();
//   // var cleanedText = $("#cleanedSeqs").text();
//   // cleanedText = cleanedText.split(">").join("\n>")
//   // var dataString = 'filename='  + filename + ' &cleanedText= ' + cleanedSeqString;
//   // // console.log('dataString ', dataString);
//   // $.ajax({
//   //   url: 'save.php',
//   //   type: 'POST',
//   //   data: dataString,
//   //   async: true,
//   //   cache: false,
//   //   success: function (returndata) {
//   //     console.log('return data', returndata);
//   //   }
//   // });

//   // var a = document.createElement("a");
//   // a.hrf = 'newfile2.txt';
//   // a.download;
//   // a.click();

//   // window.location.href = 'newfile2.txt';

//   // window.open('newfile2.txt', "_blank");
// });

$("#cleanedSeqs").dblclick(function(){
  $("#cleanedSeqs").select();
});

$("#badCharacters").dblclick(function(){
  $("#badCharacters").select();
});

$("#badIds").dblclick(function(){
  $("#badIds").select();
});







