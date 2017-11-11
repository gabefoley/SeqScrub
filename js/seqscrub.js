$(document).ready(function() {
  document.getElementsByTagName("html")[0].style.visibility = "visible";
});

var finishedRecords = [];
var noCommon = "";
var count = 0;
var taxon_info = 0;
var invalidCharsRegex = "";
summary = "";
var cleanTree = false;
var tree = "";
ids_with_underscores = ["XP", "XM", "XR", "WP", "NP", "NC", "NG", "NM", "NR"];


$.support.cors = true;

$("#commonName").attr('checked', false);
$("");

$(document).on({
    ajaxStart: function() { $( ".loader" ).show();    },
});

// Hide the loading screen and clear the loading text
function hideLoadingScreen(){
  $( ".loader" ).hide();
  $(".loader-text").html("Cleaning sequences!");
}

// Check that we have the correct number of cleaned sequences
function checkFinal(count, records){
  if (count == numRecords){
    hideLoadingScreen();
    // if (noCommon.length > 0) {
    //   console.log(noCommon);

    // }


    // Check if we were able to find the taxonomic information the user requested
    noTaxonWarn = "";
    for (var i in records){
      if (!records[i].foundtaxon){
        noTaxonWarn += records[i].id + "<br>";
      }


    }

    // If there is a seqeunce without taxonomic information
    if (noTaxonWarn.length > 0){
      bootstrap_alert.warning("Couldn't find the full taxonomic information for <br>" + noTaxonWarn);
}
    appendOutput(records);

    // If we are also cleaning a tree
    if (cleanTree) {
      cleanTree = cleanTreeNames();

      // $("#sectionB").innerHTML = cleanTree;

      bootstrap_alert.tree(cleanTree);
      // bootstrap_alert.warning(cleanTree);

    }

  }
}


function cleanTreeNames() {
  splitSummary = summary.split("\n");

  cleanTree = tree;

  for (var line in splitSummary){
    splitLine = splitSummary[line];

    if (splitLine.length > 0){

    newname = splitLine.split("FROM:")[0].trim();
    oldname = splitLine.split("FROM:")[1].trim();

    // Escape characters in the old name which will interfere with our regular expression
    oldname = escapeRegExp(oldname);


    treeRegEx = new RegExp(oldname);
    cleanTree = cleanTree.replace(treeRegEx, newname);

    // This step is needed in case a program had already encased a name in the Newick string with quotation marks.
    cleanTree = cleanTree.replace(/'/g, "");
  }
}


return cleanTree;
}


function progressText(count){

  pad = count.toString().padStart(numRecords.toString().length, 0);
  $(".loader-text").html("Cleaned " + pad + "/" + numRecords );
  $("#progressbar").progressbar({ value: 200});
  $(".loader").css("border-top", "border-top: 16px solid red");
}



// Update the filename field
document.getElementById("file").onchange = function () {

  filename = this.value.replace(/.*[\/\\]/, '');
  $("#fileToSave").val(filename);
};

// Update the treename field
document.getElementById('tree').onchange = function () {

  treename = this.value.replace(/.*[\/\\]/, '');
  $("#treeToSave").val(treename);
  cleanTree = true;
};

//Program a custom submit function for the form
$("form#data").submit(function(event) {



  // Clear all the output sections
  summary = "";
  count = 0;
  finishedRecords = [];
  $("#cleanedSeqs").empty();
  $("#badCharacters").empty();
  $("#obsoleteSeqs").empty();
  $("#badIds").empty();

  addUnderscores = $('#addUnderscore').is(":checked");
  commonName = $('#commonName').is(":checked");
  retainFirst = $('#getFirstID').is(":checked");
  removeObsolete = $('#checkObsolete').is(":checked");
  removeUncleaned = $('#removeUnclean').is(":checked");

 
  headerFormat = $('select#header-format').val();
  taxon_info = headerFormat.length;




  //Disable the default form submission
  event.preventDefault();

  //Grab all form data  
  var formData = new FormData($(this)[0]);

  console.log(formData);

  //Generate a new regex containing the invalid character
  invalidCharsRegex = new RegExp($("#invalidChars").val().trim().replace(/ /g, "|"));
 
  //Change the filename for the file and tree to save to mirror the uploaded filename
  var filename = $('#file').val().split(/(\\|\/)/g).pop();
  var treename = $('#tree').val().split(/(\\|\/)/g).pop();

  var ncbiList = [];
  var uniprotList = [];
  var pdbList = [];
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
      jsonData = JSON.parse(returndata);


      if (cleanTree) {
        tree = jsonData[jsonData.length - 1].tree;
        numRecords = jsonData.length - 1;

      }

      else {
        numRecords = jsonData.length;
      }

      $("#progressbar").progressbar({ max : numRecords});


      // For each sequence in the file
      for (var i = 0; i < numRecords; i++) {

        var id = jsonData[i].id.toString();

        var record = {
          order: i,
          id: jsonData[i].id.replace(/-/g,"_"),
          taxon: "",
          type: jsonData[i].type,
          species: "",
          seq: jsonData[i].seq,
          obsolete: "",
          ncbiChecked: false,
          noCommonName: false,
          foundtaxon: false,
          appendTo: "",
          originalHeader: jsonData[i].originalHeader
        };

        if (cleanTree) {

          treeRegEx = new RegExp(record.originalHeader.substring(1).trim());

          if (!treeRegEx.test(tree)){
            hideLoadingScreen();

            throw new Error("The original alignment and tree file don't match. " + record.originalHeader.substring(1).trim() +  " is in the alignment but not in the tree");
          
          }
        }


        if (record.type == 'tr' || record.type == 'sp' || record.type == '') {
          uniprotList.push(record);


        }

        else if (record.type == 'pdb'){
          pdbList.push(record);
        } 

        else {
          record.ncbiChecked = true;
          ncbiList.push(record);
        }
      }

      if (uniprotList.length > 0) {
        console.log("Uniprot length = ", uniprotList.length);
        while (uniprotList.length){
          getDataFromUniprot(uniprotList.splice(0,200), false);
          // getDataFromNCBI(uniprotList.splice(0,500));


        }
      }

      if (pdbList.length > 0) {
        console.log("PDB length = ", pdbList.length);
        while (pdbList.length){
          getPDBSpeciesNameFromUniProt(pdbList.splice(0,200), true);

        }
      }
      if (ncbiList.length > 0) {
        console.log("NCBI length = ", ncbiList.length);
        while (ncbiList.length){
        getDataFromNCBI(ncbiList.splice(0,200));
      }
      }
    }

  });





});


function getIDString(records, database){
  
  idString = "";

  if ( database == "UniProt"){
    linker = "+OR+id:";
  }

  else if (database == "PDB") {
    linker = "+OR+";
  }

  else if (database == "NCBI"){
    linker = ",";
  }

  for (var i = 0, size = records.length; i < size; i++) {
    idString += records[i].id + linker;
  }

  // Remove the final linker string that was added
  idString = idString.substring(0, idString.length - linker.length);
  return idString;
}

function getTaxonID(records) {


  idString = "";
  linker = ",";
  trim = 1;

  for (var i = 0, size = records.length; i < size; i++) {
    if (records[i].taxon.length > 1) {
      idString += records[i].taxon + linker;

    }
  }

  idString = idString.substring(0, idString.length - trim);
  return idString;

}



function getDataFromUniprot(records, pdb) {
  obsoleteList = [];
  speciesDict = {};
  idString = getIDString(records, "UniProt");

  // url = "http://www.uniprot.org/uniprot/?query=" + idString + "&format=xml"
  url = "http://www.uniprot.org/uniprot/?query=id:" + idString +"&format=tab&columns=id,entry%20name,protein%20names,organism,organism%20id,lineage-id(all),reviewed";

  var promise = $.ajax({
    url: url,
    type: 'POST',
    headers: {
        'Content-Type':'text/plain'
     },
    async: true,


    success: function(speciesData) {

        splitData = speciesData.split("\n");


        for (var line in splitData) {
          if (splitData[line] != null){
          splitLine = splitData[line].split("\t");

          if (splitLine[2] != null){

            if (splitLine[2].includes("Deleted") || (splitLine[2].includes("Merged"))) {
              obsoleteList.push(splitLine[0]);
            }

            else {


              taxonList = splitLine[4].split(",");

              speciesDict[splitLine[0]] = taxonList[taxonList.length - 1].trim();


            }
              }
          }
        }
      
      

        for (var record in records){

          if (records[record].id in speciesDict){
            records[record].taxon = speciesDict[records[record].id];
          }
      }


      getSpeciesNameFromNCBI2(records, idString, obsoleteList);


    },
    error: function(XMLHttpRequest, textStatus, errorThrown) { 
      if (errorThrown == "Bad Request"){
        response = XMLHttpRequest.responseText;
        alert(response.substring(response.indexOf("<ERROR>") +7, response.indexOf("</ERROR>")) + "\n List of IDs was " + idString + "\n" + records.length + " sequences failed as a result of this and have been added to unmappable");

        obsoleteList = [];
        sortOutput(records, obsoleteList);
      
      }

      else {

        generateAlert(records);




      }






    }   
  });
}


function getDataFromNCBI(records) {

  idString = getIDString(records, "NCBI");

    urlDoc = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=protein&id=" + idString + "&retmode=xml&rettype=docsum";


  var promise = $.ajax({
    url: urlDoc,

    type: 'POST',
    headers: {
        'Content-Type':'text/plain'
     },


    async: true,

    success: function(speciesData) {

      getIDFromNCBI(records, speciesData);
    },


    error: function(XMLHttpRequest, textStatus, errorThrown) { 
      if (errorThrown == "Bad Request"){
        obsoleteList = [];
        sortOutput(records, obsoleteList);
        bootstrap_alert.warning("There was an error when trying to reach this URL:<br> " + '<a href=' + urlDoc + '>' +urlDoc+ '</a>');

      }

      else {
        generateAlert(records);
      }

    }   


  });

}



function getIDFromNCBI(records, speciesData) {

  fullList = [];
  obsoleteList = [];

  if (speciesData != null) {


    for (var record in records) {
      // This is the part where I might need to grab clean accessionversion
      // path = "*/DocSum/Id[contains(., '" + records[record].id + "')]/following-sibling::Item[@Name='AccessionVersion']/text()"
      // path = "*/DocSum/Id[contains(., '" + records[record].id + "')]/following-sibling::Item[@Name='TaxId']/text()"
      path = "*/DocSum/Item[@Name='AccessionVersion'][contains(., '" + records[record].id + "')]/../Item[@Name='TaxId']/text()";

      var node = speciesData.evaluate(path, speciesData, null, XPathResult.ANY_TYPE, null);





      try {
        var thisNode = node.iterateNext();



        while (thisNode) {



          records[record].taxon = thisNode.textContent;
          records[record].type = '';
          thisNode = node.iterateNext();
        }
      } catch (e) {
        bootstrap_alert.warning('Error: There was a problem reading the XML records ' + e);
      }

    }

    obsoleteCheck = "//DocSum[Item[contains(., 'removed')]]//Item[@Name='AccessionVersion']/text()";




    obsoleteNode = speciesData.evaluate(obsoleteCheck, speciesData, null, XPathResult.ANY_TYPE, null);

    try {
      thisObsoleteNode = obsoleteNode.iterateNext();

      while (thisObsoleteNode) {
        obsoleteList.push(thisObsoleteNode.textContent);
        thisObsoleteNode = obsoleteNode.iterateNext();
      }
    } catch (e) {
      bootstrap_alert.warning('Error: There was a problem reading the XML records ' + e);
    }
    getSpeciesNameFromNCBI2(records, idString, obsoleteList);



  }
}

// function getSpeciesNameFromNCBI2(records, idString, obsoleteList) {
//   speciesList = [];

//   idString = getTaxonID(records);

//   urlAll = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=taxonomy&id=" + idString + "&retmode=xml&rettype=all";




//   var promise = $.ajax({
//     url: urlAll,
//     type: 'POST',
//     headers: {
//         'Content-Type':'text/plain'
//      },
//     async: true,

//     success: function(speciesData) {

//       if (speciesData != null) {


//         for (var record in records){
//           if (records[record].taxon.length > 1) {

//             path = "";


//             headerFormat.forEach(function(headerOpt) {

//               console.log(headerOpt);
//               if (headerOpt == 'species') {
//                 path += "(//TaxId[contains(., '" + records[record].taxon + "')]/../ScientificName)[1]";
//               }

//               else {
//                 path += " (//TaxId[contains(., '" + records[record].taxon + "')]/../LineageEx/Taxon/Rank[.//text()='" + headerOpt + "']/../ScientificName)[1]";
//               }
              

//             // path = path.substring(0, path.length - 3);

//             console.log(path);



//           var node = speciesData.evaluate(path, speciesData, null, XPathResult.ANY_TYPE, null);


//         try {
//           var thisNode = node.iterateNext();


//           species = "";

//           taxoncount = 0;



//             while (thisNode) {
//               taxoncount +=1;
//               records[record].species += thisNode.textContent + " ";
//               thisNode = node.iterateNext();

//             }


//           if (taxoncount == 0){
//             console.log("Couldn't find this taxon", headerOpt, records[record].id)
//             records[record].foundtaxon = true;
//           }
          
//         } catch (e) {
//           bootstrap_alert.warning('Error: There was a problem reading the XML records ' + e);
//         }

//         });


//         }
//       }
//     }

//       sortOutput(records, obsoleteList);

//     },
//     error: function(XMLHttpRequest, textStatus, errorThrown) { 
//       if (errorThrown == "Bad Request"){
//         // response = XMLHttpRequest.responseText
//         // alert(response.substring(response.indexOf("<ERROR>") +7, response.indexOf("</ERROR>")) + "\n List of IDs was " + idString + "\n" + records.length + " sequences failed as a result of this and have been added to unmappable")

//         obsoleteList = [];
//         sortOutput(records, obsoleteList);
      
//       }

//       else {
//         generateAlert(records);

//       }




//     }   


//   });


// }


function getSpeciesNameFromNCBI2(records, idString, obsoleteList) {
  speciesList = [];

  idString = getTaxonID(records);

  urlAll = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=taxonomy&id=" + idString + "&retmode=xml&rettype=all";




  var promise = $.ajax({
    url: urlAll,
    type: 'POST',
    headers: {
        'Content-Type':'text/plain'
     },
    async: true,

    success: function(speciesData) {

      if (speciesData != null) {


        for (var record in records){
          if (records[record].taxon.length > 1) {

            path = "";


            headerFormat.forEach(function(headerOpt) {
              if (headerOpt == 'species') {
                path += "(//TaxId[contains(., '" + records[record].taxon + "')]/../ScientificName)[1]";
              }

              else {
                path += " (//TaxId[contains(., '" + records[record].taxon + "')]/../LineageEx/Taxon/Rank[.//text()='" + headerOpt + "']/../ScientificName)[1]";
              }
              
              path += " | ";
            });

            path = path.substring(0, path.length - 3);


          var node = speciesData.evaluate(path, speciesData, null, XPathResult.ANY_TYPE, null);


        try {
          var thisNode = node.iterateNext();


          species = "";

          taxoncount = 0;



            while (thisNode) {
              taxoncount +=1;
              records[record].species += thisNode.textContent + " ";
              thisNode = node.iterateNext();

            }


          if (taxoncount >= taxon_info){
            records[record].foundtaxon = true;
          }



          

        

        } catch (e) {
          bootstrap_alert.warning('Error: There was a problem reading the XML records ' + e);
        }

        }
      }
    }

      sortOutput(records, obsoleteList);

    },
    error: function(XMLHttpRequest, textStatus, errorThrown) { 
      if (errorThrown == "Bad Request"){
        // response = XMLHttpRequest.responseText
        // alert(response.substring(response.indexOf("<ERROR>") +7, response.indexOf("</ERROR>")) + "\n List of IDs was " + idString + "\n" + records.length + " sequences failed as a result of this and have been added to unmappable")

        obsoleteList = [];
        sortOutput(records, obsoleteList);
      
      }

      else {
        generateAlert(records);

      }




    }   


  });


}




function getPDBSpeciesNameFromUniProt(records, speciesData) {
  fullList = [];
  obsoleteList = [];

  idString = getIDString(records, "PDB");

  url = "http://www.uniprot.org/uniprot/?query=" + idString + "&format=xml";

  var promise = $.ajax({
    url: url,
    type: 'POST',
    headers: {
        'Content-Type':'text/plain'
     },
    async: true,

    success: function(speciesData) {

      if (speciesData != null) {

        for (var record in records) {
          path = "";
          if (records[record].type == "pdb") {
            path = "//*[name()='dbReference'][@id='" + records[record].id + "']/preceding-sibling::*[name()='organism']/*[@type='scientific']";
          }
          else {
                  path = "/*/*/*[name()='accession'][contains(., '" + records[record].id + "')]/following-sibling::*[name()='organism']/*[@type='scientific']";

          }
          var node = speciesData.evaluate(path, speciesData, null, XPathResult.ANY_TYPE, null);

          try {
            var thisNode = node.iterateNext();
            while (thisNode) {
              records[record].species = thisNode.textContent;
              thisNode = node.iterateNext();
            }
          } catch (e) {
            bootstrap_alert.warning('Error: There was a problem reading the XML records ' + e);
          }


        }
      

      }


        sortOutput(records, obsoleteList);



    },
    error: function(XMLHttpRequest, textStatus, errorThrown) { 
      if (errorThrown == "Bad Request"){
        response = XMLHttpRequest.responseText;
        alert(response.substring(response.indexOf("<ERROR>") +7, response.indexOf("</ERROR>")) + "\n List of IDs was " + idString + "\n" + records.length + " sequences failed as a result of this and have been added to unmappable");

        obsoleteList = [];
        sortOutput(records, obsoleteList);
      
      }

      else {
        generateAlert(records);

      }






}

});
}




function sortOutput(records, obsoleteList) {

  ncbiCheck = [];

  // Check to see if there are any illegal characters
  for (var i in records) {
    console.log(records[i]);
    if ((records[i].species == null || records[i].species == "" || records[i].taxon == "") && !(obsoleteList.includes(records[i].id))) {
      if (records[i].ncbiChecked == true) {
        records[i].appendTo = "badIds";
        finishedRecords.push(records[i]);
        count +=1;
      } else {
        records[i].ncbiChecked = true;
        ncbiCheck.push(records[i]);
      }
    } else if (obsoleteList.includes(records[i].id)) {

        records[i].appendTo = "obsoleteSeqs";
        finishedRecords.push(records[i]);

        count +=1;
    } else {

      // If there are illegal characters highlight them within the text
      if (invalidCharsRegex.test(records[i].seq)) {
        records[i].appendTo = "badCharacters";
        finishedRecords.push(records[i]);

        count +=1;

    } else {
    // User has specified not to just retain the first ID, and there are multiple IDs
    if (!retainFirst) {
      if (records[i].originalHeader.split(">").length > 1) {
        records[i].appendTo = "badIDs";
        finishedRecords.push(records[i]);

        count +=1;
        break;
      }
    }
      records[i].appendTo = "cleanedSeqs";
      finishedRecords.push(records[i]);

      count += 1;
      // progressText(count);
    }
  }
}
progressText(count);
checkFinal(count, finishedRecords);



if (ncbiCheck.length > 0){  
  getDataFromNCBI(ncbiCheck);
}
}

function appendOutput(records){

  records.sort(function (a, b) {
    return a.order - b.order;
  });


  for (var i in records){
      
      if (records[i].appendTo == "badIds" && removeUncleaned){
        output = records[i].originalHeader + records[i].seq.replace(/-/g, "&#8209;") + "&#010;"; //Replace hyphens with non-breaking hyphens
        $("#badIds").append(output.trim());
      }

      else if ( records[i].appendTo == "obsoleteSeqs" && removeObsolete){
        output= records[i].originalHeader + records[i].seq.replace(/-/g, "&#8209;") + "&#010;"; //Replace hyphens with non-breaking hyphens
        $("#obsoleteSeqs").append(output.trim());


      }

      else if (records[i].appendTo == "badCharacters"){
        output = records[i].originalHeader + records[i].seq.replace(/-/g, "&#8209;") + "&#010;"; //Replace hyphens with non-breaking hyphens
        $("#badCharacters").append(output.trim());
      }

  

      else if (records[i].appendTo == "cleanedSeqs" || (records[i].appendTo == "badIds" && !removeUncleaned) || (records[i].appendTo == "obsoleteSeqs" && !removeObsolete)) {
        formattedType = records[i].type;
        if (ids_with_underscores.indexOf(formattedType) >= 0){
          formattedType = "";
        }
        else if (records[i].type.length > 0) {

          formattedType += "|";

        }

        var header = ">" + formattedType + records[i].id + "|" + records[i].species.trim();
        if (addUnderscores) {
          header = header.replace(/ /g, "_");
        }

        output = header + "&#010;" + records[i].seq.replace(/-/g, "&#8209;") + "&#010;"; //Replace hyphens with non-breaking hyphens

        $("#cleanedSeqs").append(output.trim());

        summarySpecies = records[i].species;
        
        if (addUnderscores) {
          summarySpecies = summarySpecies.trim().replace(/ /g, "_");
        }

        summary += formattedType + records[i].id + "|" + summarySpecies + " FROM: " + records[i].originalHeader.substring(1) + "\n";

    }
  
  }
}


function downloadFile(filename, text) {

  
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text.replace(/‑/g, "-")));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}



function downloadSummary(filename) {
  if (summary != null){
    download(summary, filename.split('_')[0] + "_summary.txt", "text/plain");
  }

}

function split(str, char) {
 var i = str.indexOf(char);

 if(i > 0)
  return  str.slice(0, i);
 else
  return str;     
}

// Append escape characters to strings with special regex characters

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

// Get the values from the save output form
$("form#save").submit(function(event) {
  event.preventDefault();


  console.log('savign data');

  var outputZip = new JSZip();


  var val = [];
  $('.downloadCheck:checkbox:checked').each(function(i){
    $(this.val()) = itemName;
    if (itemName == "treeDL"){

    }

    else if (itemName == "summaryDL"){
      
      if (summary != null){
        outputZip.file('summary.txt', summary);
      }

      else {
        bootstrap_alert.warning("You requested a summary but there is no summary generated.")

      }


    }

    else {
      var item = $('textarea#' + $(this).val().val().replace(/‑/g, "-"));
      outputZip.file($(this).val() + '.fasta', item);
    }

      });

  outputZip.generateAsync({type:"blob"})
  .then(function (blob) {
      saveAs(blob, "hello.zip");
  });
  console.log(outputZip);



  var cleanText = $('textarea#cleanedSeqs').val();
  var illegalcharText = $('textarea#cleanedSeqs').val();

  console.log(cleanText);
  console.log(illegalcharText);


  console.log(val)
});







// Allow for easy selection of full text in each window

$("#cleanedSeqs").click(function() {
  $("#cleanedSeqs").select();
});

$("#badCharacters").click(function() {
  $("#badCharacters").select();
});

$("#obsoleteSeqs").click(function() {
  $("#obsoleteSeqs").select();
});

$("#badIds").click(function() {
  $("#badIds").select();
});

/*
  Dropdown with Multiple checkbox select with jQuery - May 27, 2013
  (c) 2013 @ElmahdiMahmoud
  license: https://www.opensource.org/licenses/mit-license.php
*/

$(".dropdown dt a").on('click', function() {
  $(".dropdown dd ul").slideToggle('fast');
});

$(".dropdown dd ul li a").on('click', function() {
  $(".dropdown dd ul").hide();
});

function getSelectedValue(id) {
  return $("#" + id).find("dt a span.value").html();
}




// Select all input
$('#select-all').click(function(event) {   
    if(this.checked) {
        // Iterate each checkbox
        $(':checkbox').each(function() {
            this.checked = true;                        
        });
    }
});

// $(function() {
//   $('select').selectize(options);
// });

$('#input-draggable').selectize({
    plugins: ['drag_drop'],
    delimiter: ',',
    persist: false,
    create: function(input) {
        return {
            value: input,
            text: input
        };
    }
});

$('.input-sortable').selectize({
    plugins: ['drag_drop'],
    persist: false,
    create: true
});



$('#header-format').selectize({
    maxItems: null,
    valueField: 'id',
    labelField: 'title',
    searchField: 'title',
    plugins: ['drag_drop', 'remove_button'],
    create: false,
    highlight: true,


});


$(function() {
  var $wrapper = $('#wrapper');

  // theme switcher
  var theme_match = String(window.location).match(/[?&]theme=([a-z0-9]+)/);
  var theme = (theme_match && theme_match[1]) || 'default';
  var themes = ['default','legacy','bootstrap2','bootstrap3'];

  var $themes = $('<div>').addClass('theme-selector').insertAfter('h1');
  for (var i = 0; i < themes.length; i++) {
    $themes.append('<a href="?theme=' + themes[i] + '"' + (themes[i] === theme ? ' class="active"' : '') + '>' + themes[i] + '</a>');
  }

  // display scripts on the page
  $('script', $wrapper).each(function() {
    var code = this.text;
    if (code && code.length) {
      var lines = code.split('\n');
      var indent = null;

      for (var i = 0; i < lines.length; i++) {
        if (/^[  ]*$/.test(lines[i])) continue;
        if (!indent) {
          var lineindent = lines[i].match(/^([  ]+)/);
          if (!lineindent) break;
          indent = lineindent[1];
        }
        lines[i] = lines[i].replace(new RegExp('^' + indent), '');
      }

      code = $.trim(lines.join('\n')).replace(/ /g, '    ');
      var $pre = $('<pre>').addClass('js').text(code);
      $pre.insertAfter(this);
    }
  });

  // show current input values
  $('select.selectized,input.selectized', $wrapper).each(function() {
    var $container = $('<div>').addClass('value').html('Current Value: ');
    var $value = $('<span>').appendTo($container);
    var $input = $(this);
    var update = function(e) { $value.text(JSON.stringify($input.val())); };

    $(this).on('change', update);
    update();

    $container.insertAfter($input);
  });
});

function generateAlert(){
  bootstrap_alert.warning("There was a fatal error \n" + records.length + " sequences are being written to unmappable" );
  obsoleteList = [];
  sortOutput(records, obsoleteList);

  if (count != numRecords) {
    bootstrap_alert.warning("Please note: Currently not all sequences have been written to an output field");
  }
  else {
    bootstrap_alert.warning ("Please note: Despite the error, all sequences have still been written to an output field");
  }

  hideLoadingScreen();
}

//Error handing
bootstrap_alert = function() {};
bootstrap_alert.warning = function(message) {
            $('#error-div').html('<div class="alert alert-danger alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button><span>'+message+'</span></div>')
        };
bootstrap_alert.tree = function(message) {
            $('#treeOutput').html('<div class="success alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button><span>'+message+'</span></div>')
        };







$(document).bind('click', function(e) {
  var $clicked = $(e.target);
  if (!$clicked.parents().hasClass("dropdown")) $(".dropdown dd ul").hide();
});

$('.mutliSelect input[type="checkbox"]').on('click', function() {

  var title = $(this).closest('.mutliSelect').find('input[type="checkbox"]').val(),
  title = $(this).val() + ",";

  if ($(this).is(':checked')) {
    var html = '<span title="' + title + '">' + title + '</span>';
    $('.multiSel').append(html);
    $(".hida").hide();
  } else {
    $('span[title="' + title + '"]').remove();
    var ret = $(".hida");
    $('.dropdown dt a').append(ret);

  }
});

function checkAll(ele) {
    var checkboxes = $(".downloadCheck");
    if (ele.checked) {
        for (var i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].type == 'checkbox') {
                checkboxes[i].checked = true;
                $("#selectAllLabel").html('Deselect all output')
            }
        }
    } else {
        for (var i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].type == 'checkbox') {
                checkboxes[i].checked = false;
                $("#selectAllLabel").html('Select all output')

            }
        }
    }
}