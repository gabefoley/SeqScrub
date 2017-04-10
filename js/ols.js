var invalidChars
addUnderscores = true;



//Program a custom submit function for the form
$("form#data").submit(function(event) {

  //Disable the default form submission
  event.preventDefault();

  //Grab all form data  
  var formData = new FormData($(this)[0]);
  invalidChars = $("#invalidChars").val().split(" ");

  //Change the filename for the file to save to mirror the uploaded filename
  var filepath = $('#file').val();
  var filename = filepath.split(/(\\|\/)/g).pop();
  $("#fileToSave").val(filename.split(".").join("_cleaned."))

  var ncbiList = [];
  var uniprotList = [];
  uniprotDict = {};
  ncbiDict = {};


  $.ajax({
    url: 'upload.php',
    type: 'POST',
    data: formData,
    async: true,
    cache: false,
    contentType: false,
    processData: false,
    success: function(returndata) {

      console.log('Here is the return data gabe');
      console.log(returndata);

      jsonData = JSON.parse(returndata);

      // For each sequence in the file
      for (var i = 0; i < jsonData.length; i++) {

        var id = jsonData[i].id.toString();

        console.log('id is ', id);

        // var record = new Object();

        // record[id] = {
        //   type: jsonData[i].type,
        //   species: "",
        //   seq: jsonData[i].seq,
        //   obsolete: "",
        //   originalHeader: jsonData[i].originalHeader
        // };

        var record = {
          id : jsonData[i].id,
          type: jsonData[i].type,
          species: "",
          seq: jsonData[i].seq,
          obsolete: "",
          originalHeader: jsonData[i].originalHeader
        };

        console.log ('Now looks like', record)

        if (record.type == 'tr' || record.type == 'sp') {
          // uniprotDict[id] = record[id];
          uniprotList.push(record)

        } else if (record.type == 'gi' || record.type == 'XP') {
          console.log('build ncbi')
          ncbiList.push(record);
          // ncbiDict[id] = record[id];
        }
      }

      if (uniprotList.length > 0) {
        for (record in uniprotList) {
          getDataFromUniprot(uniprotList);

        }

      }


      if (ncbiList.length > 0) {
        console.log('ncbiDict', ncbiDict)
        getDataFromNCBI(ncbiList);
      }


    }

  });



});

/**
 * [getSpeciesFromExternal description]
 * @param  {[type]} record [description]
 * @return {[type]}        [description]
 */
function getDataFromUniprot(record) {
  console.log(record);
  console.log(record.id);

  url = "http://www.uniprot.org/uniprot/" + record.id + ".xml";


  var promise = $.ajax({
    url: url,
    type: 'POST',
    async: true,
    success: function(speciesData) {

      if (!$.trim(speciesData)){   
      var string = record.originalHeader + record.seq + "&#010;&#010;";
      $("#badIds").append(string.trim());
}
      console.log(speciesData);
      getSpeciesNameFromUniProt(record, speciesData);

    },

    // If we couldn't map the sequence to a species
    error: function() {
      var string = record.originalHeader + record.seq + "&#010;&#010;";
      $("#badIds").append(string.trim());

    }
  });

  promise.done(function(speciesData) {


  });
}


function getDataFromNCBI(records) {

  idString = "";

  console.log('got here')
  console.log(records);
  console.log(records[0]);
  // console.log(records[0].id)
  console.log(records.length)
  console.log(Object.keys(records).length)

  // for (var key in records) {

  //   idString += key + ",";
  //   console.log('here is key', key)
  // }

  for (var i = 0, size = records.length; i < size; i++) {
    console.log(i);

    idString += records[i].id + ",";
  }

  idString = idString.substring(0, idString.length - 1);


  console.log('and here is id string')
  console.log(idString);
  // id = id.split('.')[0];

  // url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=" + id + "&rettype=acc";

  urlDoc = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=protein&id=" + idString + "&retmode=xml&rettype=docsum"

  urlAll = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=protein&id=" + idString + "&retmode=xml&rettype=all"

  // url = "https://www.ncbi.nlm.nih.gov/protein/" + idString +"?format=xml&report=docsum"

  // url = "https://www.ncbi.nlm.nih.gov/protein/" + idString +"?format=text&report=docsum"


  console.log('here')
  console.log(urlDoc)
  console.log(urlAll)

  // url = "https://www.ncbi.nlm.nih.gov/protein/XP_014022732.1,XP_005010483.1,XP_005057541.1?format=text&report=docsum"

  var promise = $.ajax({
    url: urlAll,
    type: 'POST',
    async: true,
    success: function(speciesData) {

      console.log("Data from NCBI", speciesData);
      getSpeciesNameFromNCBI(records, speciesData)
    },

    error: function() {

      var string = record.originalHeader + record.seq + "&#010;&#010;";
      $("#badIds").append(string.trim());

    }

  });

  promise.done(function(speciesData) {});
}

// function mapToAccession(records) {

//   ids = "";
//   console.log(records);
//   for (var i = 0, size = records.length; i < size; i++) {
//     // console.log(records[i]);
//     ids += records[i].id + ",";
//   }
//   ids = ids.substring(0, ids.length - 1);

//   // console.log("Print out the GILIST string", ids);
//   // id = record.id;
//   // id = id.split('.')[0];

//   url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=protein&id=" + ids + "&retmode=xml&rettype=acc";
//   console.log('mapped url', url)

//   // url = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=protein&id=" + id + "&retmode=xml&rettype=full";


//   var promise = $.ajax({
//     url: url,
//     type: 'POST',
//     async: true,
//     success: function(accessionData) {
//       accessions = accessionData.split("\n");


//       // NCBI api appends two additional blank lines to the file so we need to remove these
//       accessions.splice(accessions.length - 2, accessions.length);
//       // console.log("split species", splitSpecies);

//       // console.log ("here we go ", speciesData[0],speciesData[1], speciesData[0]);
//       // console.log(typeof speciesData);

//           for (var i = 0, size = records.length; i < size; i++){

//             records[i].id = accessions[i];

//             appendOutput(records[i]);

//       }

//       getDataFromNCBI(records);

//     },

//     error: function() {

//       var string = record.originalHeader + record.seq + "&#010;&#010;";
//       $("#badIds").append(string.trim());

//     }

//   });

//   promise.done(function(speciesData) {
//     console.log("here we go again", speciesData)
//     console.log(speciesData)


//   });
// }

function getSpeciesNameFromNCBI(records, speciesData) {

  fullList = [];

  console.log('Is this defined?', records)



  if (speciesData != null) {
    xmlDoc = speciesData;

    path = "//Org-ref_taxname/text() | //Textseq-id_accession[not(starts-with(text(),'XM') or starts-with(text(), 'NM'))]/text()";

    // path = "//Item[@Name='Title'] | //Item[@Name='Comment'] | //Item[@Name='AccessionVersion']/text()"




    var node = xmlDoc.evaluate(path, xmlDoc, null, XPathResult.ANY_TYPE, null);

    try {
      var thisNode = node.iterateNext();

      while (thisNode) {
        fullList.push(thisNode.textContent);
        thisNode = node.iterateNext();
      }
    } catch (e) {
      console.log('Error: Document tree modified during iteration ' + e);
    }


    idList = [];
    speciesList = [];
    console.log("Got here to scoop", fullList.length)
    console.log(Object.keys(records).length)

    recordLen = Object.keys(records).length

    console.log('come on');
    console.log(records)
    console.log(records[0]);

    for (var i = 0, size = records.length - 1; i <= size; i++) {


      console.log("Print this here is the scoop")
      console.log(i)
      console.log(i + records.length)
      console.log(i + 2 * records.length)
      console.log(fullList[i])

      records[i].species = fullList[i].substring(fullList[i].lastIndexOf("[")+1,fullList[i].lastIndexOf("]"))
      records[i].obsolete = fullList[i + records.length]
      records[i].id = fullList[i + 2 * records.length]
      records[i].type = ''; // Remove the previous identifier
      // records[i].id = fullList[fullList.length / 2 + i];
      // records[i].species = fullList[i];


    }

    console.log('Done');



    // while (node.iterateNext() != null) {
    //   console.log(node.iterateNext());


    // }
    // var species = node.iterateNext();
    // var again = node.iterateNext();
    // console.log('species', species);
    // console.log('again', again);

    // var xmlText = new XMLSerializer().serializeToString(species);

    // console.log('xmltest', xmlText);

    // if (addUnderscores == true) {
    //   var speciesName = xmlText.replace(" ", "_");
    //   console.log("what is", speciesName);
    // }

    // Remove any instance of a subspecies 
    // var splitName = speciesName.split(" ")[0];

    // record.species = splitName;

    var obsoleteList = checkObsolete(records, idString)
    console.log("ghost", obsoleteList);

    appendOutput(records)

    // for (i in records) {
    //   console.log('sell yourself short')
    //   console.log(records[i]);
    //   console.log(records[i].obsolete)
    //   appendOutput(records[i]);
    // }



  }
}

function checkObsolete(records, obsoleteList){
  console.log("FROM OBSOLETE")
  console.log(obsoleteList);
  obsoleteList = [];

    urlDoc = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=protein&id=" + idString + "&retmode=xml&rettype=docsum"


  // url = "https://www.ncbi.nlm.nih.gov/protein/" + idString +"?format=xml&report=docsum"

  // url = "https://www.ncbi.nlm.nih.gov/protein/" + idString +"?format=text&report=docsum"


  // url = "https://www.ncbi.nlm.nih.gov/protein/XP_014022732.1,XP_005010483.1,XP_005057541.1?format=text&report=docsum"

  var promise = $.ajax({
    url: urlDoc,
    type: 'POST',
    async: true,
    success: function(speciesData) {

      console.log("Data from NCBI", speciesData);
          if (speciesData != null) {
    xmlDoc = speciesData;

    console.log('here is species data to check for obsolete', speciesData)

    path = "//DocSum[Item[contains(., 'removed')]]//Item[@Name='AccessionVersion']/text()";

    // path = "//Item[@Name='Title'] | //Item[@Name='Comment'] | //Item[@Name='AccessionVersion']/text()"




    var node = xmlDoc.evaluate(path, xmlDoc, null, XPathResult.ANY_TYPE, null);

    try {
      var thisNode = node.iterateNext();

      while (thisNode) {

        console.log("$$$$$$$$$", thisNode);
        obsoleteList.push(thisNode.textContent);
        console.log(obsoleteList)

      //   for (var i = 0, size = records.length; i <= size; i++) {
      //     console.log("record id", record[i].id)
      //   if (record.id == thisNode){
      //     console.log(record.id, thisNode, 'got ya')
      //     // record.obsolete = "TRUE"

      //   }
      // }
              thisNode = node.iterateNext();

      }
    } catch (e) {
      console.log('Error: Document tree modified during iteration ' + e);
    }

  //   for (var i = 0, size = records.length; i <= size; i++) {
  //     console.log("record id", records[i].id)
  //   for (obsolete in obsoleteList){
  //     console.log('obbs', obsoleteList[obsolete]);
  //   }
  // }


}
    },

    // error: function() {

    //   var string = record.originalHeader + record.seq + "&#010;&#010;";
    //   $("#badIds").append(string.trim());

    // }
  })

  console.log('before senin bank', obsoleteList)

  return obsoleteList;

  // console.log(obsoleteList, 'obbbbsoobb')

  // for (obsolete in obsoleteList){
  //   console.log('obsolete', obsoleteList[obsolete])


  // for (record in records){
  //   if (record.id == obsolete){
  //   record.obsolete = "TRUE"
  // }
  // }
// }
}


function getSpeciesNameFromUniProt(record, speciesData) {



  if (speciesData != null) {
    xmlDoc = speciesData;

    path = "//*[name()='uniprot']/*[name()='entry']/*[name()='organism']/*[name()='name'][@type='scientific']/text()";

    var node = xmlDoc.evaluate(path, xmlDoc, null, XPathResult.ANY_TYPE, null);

    record.species = node.iterateNext().textContent;

    records = [];
    records.push(record);

    appendOutput(record)



    // while (node.iterateNext() != null) {
    //   console.log(node.iterateNext());


    // }
    // var species = node.iterateNext();
    // var again = node.iterateNext();
    // console.log('species', species);
    // console.log('again', again);

    // var xmlText = new XMLSerializer().serializeToString(species);

    // console.log('xmltest', xmlText);

    // if (addUnderscores == true) {
    //   var speciesName = xmlText.replace(" ", "_");
    //   console.log("what is", speciesName);
    // }

    // Remove any instance of a subspecies 
    // var splitName = speciesName.split(" ")[0];

    // record.species = splitName;


  }


}



function appendOutput(records) {

  //Boolean value to hold if the current sequence has illegal characters
  containsBad = false;

  obsoleteList = checkObsolete(records)




  // Check to see if there are any illegal characters

  for (i in records){
  console.log('what is the obsoleteList?? ', obsoleteList);

  console.log("Record from append output", records[i]);


  for (j in records[i].seq) {
    if (invalidChars.includes(records[i].seq[j])) {
      containsBad = true;
    }
  }



  if (records[i].species == "" | records[i].obsolete.startsWith(" This record was removed as a result of standard genome annotation processing.")) {

    var string = records[i].originalHeader + records[i].seq + "&#010;&#010;";
    $("#badIds").append(string.trim());
  } else {

    formattedType = records[i].type;
    if (records[i].type.length > 0) {

      formattedType += "|";

    }

    // If there are illegal characters highlight them within the text
    if (containsBad) {
      for (i in invalidChars) {
        // seq = seq.split(invalidChars[i]).join("<span class = 'highlight'>***" + invalidChars[i] + "***</span>");
        // record.seq = record.seq.split(invalidChars[i]).join("<span class='highlight'>" + invalidChars[i] + "</span>");

      }


      var string = ">" + formattedType + records[i].id + "|" + records[i].species + "&#010;" + records[i].seq + "&#010;&#010;";
      if (addUnderscores){
        string = string.replace(/ /g, "_")
      }
      $("#badCharacters").append(string.trim());

    } else {

      dataString = "id=" + records[i].id + "&speciesName=" + records[i].species + "&seq=" + records[i].seq
      $.ajax({
        url: 'addSpeciesToLocal.php',
        type: 'POST',
        data: dataString,
        success: function() {}

      });

      var string = ">" + formattedType + records[i].id + "|" + records[i].species + "&#010;" + records[i].seq + "&#010;&#010;";
      if (addUnderscores){
        string = string.replace(/ /g, "_")
      }

      $("#cleanedSeqs").append(string.trim());
    }

    containsBad = false;
  }
}

}

function getSpeciesFromLocal(record) {
  console.log("Got to speciesFromLocal with ", record);
  var dataString = 'id=' + record.trimmedHeader;
  $.ajax({
    url: 'getSpeciesFromLocal.php',
    type: 'POST',
    data: dataString,
    success: function(returnData) {
      console.log("Return data from getSpeciesFromLocal" + returnData);


      speciesData = JSON.parse(returnData);

      // If we already have an entry with the same sequence then use this entry
      if (speciesData.length > 0) {
        data = speciesData[0];


        var string = ">" + data['ID'] + data['speciesName'] + "&#010;" + record.seq + "&#010;&#010;";
        $("#cleanedSeqs").append(string.trim());
      } else {
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

// Allow for easy selection of full text in each window
$("#cleanedSeqs").click(function() {
  $("#cleanedSeqs").select();
});

$("#badCharacters").click(function() {
  $("#badCharacters").select();
});

$("#badIds").click(function() {
  $("#badIds").select();
});