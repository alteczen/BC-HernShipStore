var loadingHtml = "<div class='loading'>Loading...<br></div>";
var errorMsg = "Parts matrix is unavailable at this time. Please browse items below.";

//Used for Sierra Pages
function getTableData(catId) {
    jQuery.ajax({
        type: "POST",
        url: "https://api.wholesalemarine.com/tableData.php",
        data: {'catId': catId},
        cache: false,
        dataType: "text",
        success: function(d) {
            var json = jQuery.parseJSON(d);
            if(json != null){
                jQuery("#sierraPartsTable").html(loadingHtml);
                var partsTable = generateTable(json);
                jQuery("#sierraPartsTable").html(partsTable);
                stripeTable();
                if(typeof json['notes'] !== 'undefined') {
                    decorateNotes();
                }
                //check for cookie and select previous
                var oldSelection = readCookie('sierraSelection');
                if (oldSelection) {
                    jQuery("#modelSelect").val(oldSelection);
                    filterModel();
                }
            }
        },
        error: function(){
            jQuery("#sierraPartsTable").html(errorMsg);
        }
    });
}

//used for parts finder guide
function getPartsTableData(catId) {
    jQuery.ajax({
        type: "POST",
        url: "https://api.wholesalemarine.com/tableData.php",
        data: {'catId': catId},
        cache: false,
        dataType: "text",
        success: function(d) {
            var json = jQuery.parseJSON(d);
            if(json != null){
                jQuery("#sierraPartsTable").html(loadingHtml);
                var partsTable = generatePartsTable(json);
                jQuery("#sierraPartsTable").html(partsTable);
                stripeTable();
				$('#loading').toggleClass('hide');
                if(typeof json['notes'] !== 'undefined') {
                    decorateNotes();
                }
                //check for cookie and select previous
                var oldSelection = readCookie('sierraSelection');
                if (oldSelection) {
                    jQuery("#modelSelect").val(oldSelection);
                    //filterModel();
                }
            }
        },
        error: function(){
            jQuery("#sierraPartsTable").html(errorMsg);
        }
    });
}

function generatePartsTable(data){
    var myHtml = '<table id="sierraTable">';
    var modelValues = new Array();
    var hasSearch = 0;
    var tableData = data['tableData'];
    var tableNotes = "";
	var mfg = "";
	var type = "";
	var searchColumn = 2;
	var filterHtml = '';

    for(var i=0; i < tableData.length; i++){
        var row = tableData[i];

		if(i==0){ // header row
			myHtml += "<tr class='header'>";
		}else{
			myHtml += "<tr class='row'>";
		}
		
        for(var c=0; c < row.length; c++){
            var dValue = row[c];
            if(i==0){ // header row
                myHtml += "<th class='tc" + c + "'>" + dValue + "</th>";
                if(c==searchColumn && dValue.toLowerCase()=='search'){
                    hasSearch = 1; //has model in header - need to build dropdown for filter
                }
            }else{ 
				if(i==1){
					//first row of data - pull the mfg and type
					mfg = row[0]; 
					type = row[1];				
				}
                if(hasSearch && c==searchColumn){
                    modelValues.push(dValue);
                }
                myHtml += "<td class='tc" + c + "'>" + dValue + "</td>";
				
			}
        }
        myHtml += "</tr>";
    }
	myHtml += "</table>";

    if(hasSearch){
        var modelOptions = '';
        //cleanup array from dups
        uniqueModels = modelValues.filter(function(item, pos) {
            return modelValues.indexOf(item) == pos;
        })

		//set step 3 option to the unique models
        for(var m=0; m < uniqueModels.length; m++) {
            var modelItem = uniqueModels[m];			
			$('#stepThree #modelSelect').append($('<option>', {
				value: modelItem,
				text: modelItem
			}));			
        }
		$('#stepThree #modelSelect').prop("disabled", false);
		$('#stepThree').toggleClass('hide');
		//filterHtml += "<a href='#' onclick='filterModel();return false;'>Find</a> <a href='#' id='resetButton' onclick='resetSel();return false;'>Clear</a>";
    }

    if(typeof data['notes'] !== 'undefined') {
        //notes exist
        tableNotes = "<div class='notes' style='display:none'>" + data['notes'] + "</div>";
    }

    return filterHtml + myHtml  + tableNotes;
}


function showFilteredProducts(){
	jQuery("#filteredItems").show();	
	jQuery("#LayoutColumn1").hide();
	jQuery(".js-faceted-search-column").hide();
}

function showNormalProducts(){
	jQuery("#LayoutColumn1").show();
	jQuery(".js-faceted-search-column").show();
	jQuery("#filteredItems").hide();
}

function filterModel(){
    selected = jQuery('#modelSelect').val();
    //jQuery("#filteredItems").html(loadingHtml);
    if (selected === 'none') {
        jQuery('#sierraTable tr').hide();
        showNormalProducts();
    }
    else {
		jQuery('#sierraTable').show();
        jQuery('#sierraTable tr').each( function(rowIdx,tr) {
            if(rowIdx > 0) { //don't hide the header row
                jQuery(this).hide().find('td').each(function (idx, td) {
                    if (idx === 2) {
                        var check = jQuery(this).text();
                        //if (check && check.indexOf(selected) == 0) {
                        if (check == selected) {
                            jQuery(tr).show();
                        }
                    }
                });
            }

        });
		jQuery('#sierraTable tr.header').show();
        //find the parts that are visible and query to show them on cat page
		items = getFilteredParts();
        queryFilteredParts(items);		
        showFilteredProducts();
    }
    stripeTable();
    createCookie('sierraSelection',selected,0);
}

function stripeTable(){
    jQuery("#sierraTable tr").filter(':even').addClass("odd");
}

function queryFilteredParts(items){
    jQuery.ajax({
        type: "POST",
        url: "https://api.wholesalemarine.com/products.php",
        data: {skus : items},
        cache: false,
        dataType: "text",
        success: function(d) {
            var json = jQuery.parseJSON(d);
            if(json != null){
                resultHtml = showFilteredParts(json,"Parts");
                jQuery("#filteredItems").html(resultHtml);

                var loaded = 0;
                //wait to align until images all load
                jQuery('#filteredItems a.product-image img').load(function()
                {
                    loaded++;
                    if (loaded == jQuery('#filteredItems a.product-image img').length)
                    {
                        //setGridItemsEqualHeight(jQuery);
                    }
                });
            }
        }
    });
}

function showFilteredParts(items,itemtype){
    itemsHtml = "<div class='fitMessage'>" + itemtype + " that fit your selection</div><div class='Content Wide '><div id='CategoryContent' class='Block CategoryContent Moveable Panel'><ul class='ProductList'>";
    for(var i=0; i < items.length; i++) {
        myitem = items[i];
		listPrice = Math.round(Number(myitem['ListPrice'])*100) / 100;
		regPrice = Math.round(Number(myitem['Price'])*100) / 100;
        itemsHtml += "<li> \
            <div data-product='" + myitem['BigCommerceId'] + "' class='ProductImage'> \
            <a href='" + myitem['Url'] + "' style='height: 285px;'> \
			<img alt='" + myitem['Name'] + "' src='" + myitem['Image'] + "'></a>\
			</div> \
            <div class='ProductDetails'> \
                <a class='pname' href='" + myitem['Url'] + "'>" + myitem['Name'] + "</a> \
            </div> \
            <em class='p-price'>\
                <strike class='RetailPriceValue'>$" + listPrice.toFixed(2) + "</strike> $" + regPrice.toFixed(2) + "</em> \
            <div class='ProductActionAdd'> \
                <a title='Add To Cart' class='btn icon-Add To Cart' href='/cart.php?action=add&amp;product_id=" + myitem['BigCommerceId'] + "'>Add To Cart</a> \
            </div> \
        </li>";

    }
    itemsHtml += "</ul></div></div>";
    return itemsHtml;
}

function showCustomCovers(covers){
	itemsHtml = "<div class='newGuideResults coverGuide'>";
	headerRow = "<div class='tr'><div class='th thName'>Cover</div><div class='th'>Brand</div><div class='th'>Fit</div><div class='th'>Fabric</div><div class='th'>Warranty</div><div class='th thSwatches'>&nbsp;</div><div class='th thLinks'>&nbsp;</div></div>";
	itemsHtml += headerRow;
	nextItem = "";
	swatchList = "";
	swatchCount = 0;
	resultCount = 0;
	doLastLoop = 0; //used to track if a single parent with swatches is only returned
	
	var fit = ["Exact Fit / Custom Fit", "Select Fit / Semi-Custom Fit"];
	var brand = ["Taylor Made", "Westland"];	
	
	for(var i=0; i < covers.length; i++) {
		curItem = covers[i];
		
		if(i == (covers.length-1)){ //last item
			nextItem = covers[0];
			doLastLoop = 1;
		}else{
			nextItem = covers[i+1];
		}
		if (nextItem['psku'] != curItem['psku'] || doLastLoop){ //this is a new product
			//figure out price
			itemPrice = curItem['price'];
			if(itemPrice == null){
				itemPrice = '';
			}else{
				itemPrice = "<b>Our Price:</b> $" + itemPrice;
			}
			if(swatchCount > 0){ 
				//add last swatch item to list of swatches
				swatch = "<li><a href='#' data-csku='" + curItem['csku'] +"' data-bcid='" + curItem['bcid'] + "' data-color='" + curItem['color'] +"' style='background:#" + curItem['hexcode'] + "'></a></li>";
				swatchList += swatch;
				swatchCount += 1;	
				
				swatchHtml = "<div>Color:<span class='colorSel'>Select below</span></div><ul data-swatchcount='" + swatchCount + "'>" + swatchList + "</ul>";
				cartBtn = "<a class='btn xicon-Add To Cart inActive' href='#'>Select a Color</a>";
			}else{
				swatchHtml = '';
				var psku = curItem['psku'];
				var lastFour = psku.substr(psku.length - 4);
				if (lastFour =='SO30'){
					swatchHtml = '<div>Color:<span class="colorSel">Silver</span></div><ul><li><a href="#" style="background:#e7eadf"></a></li></ul>';
				}
				addLink = '/cart.php?action=add&sku=' + psku;
				cartBtn = "<a class='btn xicon-Add To Cart' href='" + addLink + "'>Add to Cart</a>";
			}
			
			if(curItem['pname'] != null){
				itemsHtml += "<div class='tr'><div class='td tdName'><a class='cName' href='" + curItem['url'] + "'>" + curItem['pname'] + "</a><a href='" + curItem['purl'] + "' class='cImg'><img src='"+ curItem['pimg'] +"'></a></div><div class='td tdBrand'><b>" + curItem['brand'] + "</b></div><div class='td tdFit'><b>" + curItem['fit'] + "</b></div><div class='td tdFabric'><b><a href='#'>" + curItem['material'] + "</a></b><br>(View Details)</div><div class='td'><b>" + curItem['warranty'] + "</b></div><div class='td tdSwatch'>" + swatchHtml + "</div><div class='td tdLinks'><div class='cprice'>" + itemPrice + "</div><div class='freeship'>Free Shipping</div>" + cartBtn + "</div></div>";
				resultCount += 1;
			
			}
			
			//reset swatches
			swatchList = "";
			swatchCount = 0;
			
		}else{ //this is the same product based on parentid
			swatch = "<li><a href='#' data-csku='" + curItem['csku'] +"' data-bcid='" + curItem['bcid'] + "' data-color='" + curItem['color'] +"' style='background:#" + curItem['hexcode'] + "'></a></li>";
			swatchList += swatch;
			swatchCount += 1;
		}
	}	
	
	if(resultCount > 0){
		
	topBar = "<div class='fitProps' style='margin-bottom:10px'><h4>Filter By</h4> <ul id='pfilters'> \
	<li class='brand'><span>Brand:</span> <select>" + buildCoverOptions(brand) + "</select></li> \
	<li class='fit'><span>Fit:</span> <select>" + buildCoverOptions(fit) + "</select></li> \
	</ul></div>";		
		
		return topBar + itemsHtml + "</div>";
	}else{
		//no covers found
		return "<div id='noResults'>No covers match your selection. Please use our <a href='#' onclick='javascript:showSemiCoverGuide();return 0;'>Universal Fit Cover Guide</a>.</div>";
	}
}

function showSemiCoverGuide(){
	$('#noResults').hide();
	$('.customCover').hide();
	$('.universalCover').show();		
}

function setShippingTimes(items){
	skuInfo = "";
    jQuery.ajax({
        type: "POST",
        url: "https://api.wholesalemarine.com/products.php",
        data: {skus : items, store : 'wsm'},
        cache: false,
        dataType: "text",
        success: function(d) {
            var json = jQuery.parseJSON(d);
            if(json != null){
				skuVals = [];
				
				
				//loop through results and build array to hold qoh by sku
				for(var i=0; i < json.length; i++) {
					myitem = json[i];
					qoh = Number(myitem['QOH']);
					skuVals[myitem['Sku']] = qoh;
				}
				var hideClock = 1;
				$(".CartContents tr").each(function () {
					$('td.ProductName', this).each(function () {
						var sku = $(this).children(".pSku").text();			
						itemqoh = skuVals[sku];
						if(itemqoh < 9000) hideClock = 0;
						msg = getShippingMessage(itemqoh);
						$(this).children().children("#shippingMessage").html(msg);	
					});
				});				
				if(hideClock) $(".cartCountDown").hide();
            }
        }		
    });
}

function getShippingMessage(stock){
	
	var optionCount = $('.productAttributeLabel').length;
	
	if (stock=="Out of stock"){
      shippingMessage = 'Out of Stock';
    }else
    if (isNaN(stock)){
	  if (optionCount > 0){
		shippingMessage = 'Select an option below';
	  }else{
		shippingMessage = 'Out of Stock';
	  }
    }else
    if (stock >= 55000){
      shippingMessage = 'Ships 2-3 Weeks';
    }else  
    if (stock >= 49500){
      shippingMessage = 'Special Order';
    }else
    if (stock >= 44500){
      shippingMessage = 'Backordered';
    }else
    if (stock >= 39500){
      shippingMessage = 'Pre-Order';
    }else
    if (stock >= 34500){
      shippingMessage = 'Ships 7-10 Days';
    }else
    if (stock >= 29500){
      shippingMessage = 'Ships 7-10 Days';
    }else
    if (stock >= 24500){
      shippingMessage = 'Ships 3-5 Days';
    }else
    if (stock >= 19500){
      shippingMessage = 'Ships 3-5 Days';
    }else
    if (stock >= 14500){
      shippingMessage = 'Ships 1-2 Days';
    }else    
    if (stock >= 9000){
      shippingMessage = 'Ships Next Business Day';
    }else  
	if (stock > 0){
	  timerDay = $('#cd #shipDay').text();
	  if(timerDay == 'next business day'){
		shippingMessage = '<span>In Stock - Ships Next Business Day</span>';
	  }else{
		shippingMessage = '<span>In Stock - Ships Today</span>';
	  }		
	}else
    {
		shippingMessage = '';
    }
	return shippingMessage;
}


function showPropTable(props){
    itemsHtml = ""; 
	headerRow = "<div class='newGuideResults'><div class='tr'><div class='th thseries'>Series</div><div class='th thpic'>Prop</div><div class='th thpartnum'>Part #</div><div class='th'>Diameter</div><div class='th'>Pitch</div>";
	headerRow += "<div class='th thblades'>Blade</div><div class='th throtation'>Rotation</div><div class='th'>Price</div><div class='th'>&nbsp;</div></div>";
	lastHeader = '';
	counter = 0;
	var blades = new Array();
	var material = new Array();
	var rotation = new Array();
	
	for(var i=0; i < props.length; i++) {
        myitem = props[i];
		var hideRow = '';
		currentHeader = myitem['Header'];
		if (lastHeader != currentHeader){
			//new header section
			materialClass = myitem['Material'];
			sectionHeader = "<div class='sectionBlock " + materialClass + "'><div class='sectionRow'>" + currentHeader + "</div>";
			if(i > 0){
				itemsHtml = itemsHtml + "</div></div>" + sectionHeader + headerRow;
			}else{
				itemsHtml = itemsHtml + sectionHeader + headerRow;
			}
			lastHeader = currentHeader;
			counter = 0; //reset counter
		}				
		
		listPrice = Math.round(Number(myitem['ListPrice'])*100) / 100;
		regPrice = Math.round(Number(myitem['Price'])*100) / 100;
		if(myitem['Hubkit']==''){
			hub = '';
			addtocart = "/cart.php?action=add&amp;product_id=" + myitem['BigCommerceId'];
		}else{
			hub = '<br><span>Hub:</span> ' + removePrefix(myitem['Hubkit']);
			addtocart = '/sierrahandler?product[1]=' + myitem['Sku'] + '&qty[1]=1&product[2]=' + myitem['Hubkit'] + '&qty[2]=1';
		}
		if(counter%2==0){
			rowAlt = ' alt';
		}else{
			rowAlt = '';
		}
		if(myitem['Rotation']=="Counter"){
			hideRow = ' hideRotation';
		}
		myseries = '';
		if(myitem['Series'] != ''){
			myseries = "<a href='#'>" + myitem['Series'] + "</a> (View Details)";
		}
		
        itemsHtml += "<div class='tr" + rowAlt + hideRow + "'> \
			<div class='td tdseries'>" + myseries + "</div> \
			<div class='td tdpic'><img style='height: 60px;' alt='" + myitem['Name'] + "' src='" + myitem['Image'] + "'></div> \
			<div class='td tdpartnum'><span>Prop:</span> " + removePrefix(myitem['Sku']) + hub + " </div> \
			<div class='td'>" + myitem['Diameter'] + " </div> \
			<div class='td'>" + myitem['Pitch'] + " </div> \
			<div class='td tdblades'>" + myitem['Blades'] + " </div> \
			<div class='td tdrotation'>" + myitem['Rotation'] + " </div> \
            <div class='td tdprice'>$" + regPrice.toFixed(2) + "</div> \
            <div class='td tdadd'><a title='Add To Cart' class='btn icon-Add To Cart' href='" + addtocart + "'>Add To Cart</a></div> \
        </div>";

		blades.push(myitem['Blades']);
		rotation.push(myitem['Rotation']);
		material.push(myitem['Material']);
		
		counter += 1;
		if((i-1) == props.length) itemsHtml += "</div>"; // close out section at end of array
    }
    itemsHtml += "</div></div></div>";
	
	topBar = "<div class='fitProps'><h4>Filter By</h4> <ul id='pfilters'> \
	<li class='pmaterial'><span>Material:</span> <select>" + buildOptions(material) + "</select></li> \
	<li class='pblades'><span>Blades:</span> <select>" + buildOptions(blades) + "</select></li> \
	<li class='protation'><span>Rotation:</span> <select>" + buildOptions(rotation) + "</select></li> \
	</ul></div><div class='Content Wide '><div id='CategoryContent' class='Block CategoryContent Moveable Panel'><div class='newGuideResults'>";
		
    return topBar + itemsHtml;	
}

function buildOptions(arr){
	var options = arr.filter( onlyUnique );
	var optiontext = "<option value='all'>All</option>";
	for(var i=0; i < options.length; i++) {
		var opt = options[i];
		var sel = '';
		if(opt=="Standard"){sel = ' selected'}
		optiontext = optiontext + "<option value='" + opt + "'" + sel + ">" + opt + "</option>";
	}
	return optiontext;
}

function buildCoverOptions(arr){
	var options = arr.filter( onlyUnique );
	var optiontext = "<option value='all'>All</option>";
	for(var i=0; i < options.length; i++) {
		var opt = options[i];
		var val = '';
		if(opt=="Exact Fit / Custom Fit"){
			val = 'custom';
		}else if(opt =="Select Fit / Semi-Custom Fit"){
			val = 'semicustom';		
		}else{
			val = opt;
		}
		optiontext = optiontext + "<option value='" + val + "'>" + opt + "</option>";
	}
	return optiontext;
}

function removePrefix(sku){
	if(sku.toLowerCase()=='pressed') return 'Pressed';
	var newsku;
	if( !isNaN(sku.substring(0, 1)) ){
		newsku = sku;
	}else{
		newsku = sku.substring(4,sku.len);
	}	
	return newsku;
}

function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

function getFilteredParts(){
    var partNums = new Array();
    jQuery('#sierraTable tr:visible td a').each(function() {
        if(!jQuery(this).hasClass('noteTip')){
			//add SIE if starts with 18-
			partNum = jQuery(this).text();
			if(partNum.substring(0, 3)=="18-" || partNum.substring(0, 3)=="23-" ){
				partNum = "SIE-" + partNum;
			}
            partNums.push(partNum);
        }
    });
    return partNums;
}

function resetSel(){
	jQuery("#modelSelect").val($("#modelSelect option:first").val()).change();	
	showNormalProducts();
	jQuery("#sierraTable").hide();
	eraseCookie("sierraSelection");
}

function decorateNotes(){
    //parse notes div and split into assoc. array
    var lines = jQuery('.notes').html().split('<br>');
    var notes = [];
    for (var i=0; i < lines.length; i++) {
        line = lines[i];
        letter = line.substring(0, 3);
        letter = letter.replace(/\./g,' ');
        letter = letter.trim();
        note = line.substring(4,line.length);
        notes[letter] = note;
    }
    //locate notes column
    var col = 0; y = 0;
    jQuery("#sierraTable tr th").each(function() {
        if(jQuery(this).text().toLowerCase()=='notes'){
            col = y + 1;//add 1 because of hidden column for filtering model
        }
        y+=1;
    });
    jQuery("#sierraTable tr td:nth-child(" + col + ")").each(function () {
        var n = jQuery(this).text();
        if(n){
            newNote = "<a href='javascript:void(0);' class='noteTip' dataTip='" + notes[n] + "'>" + n + "</a>";
            jQuery(this).html(newNote);
        }
    });


}

function generateTable(data){
    var myHtml = '<table id="sierraTable" style="display:none">';
    var modelValues = new Array();
    var hasSearch = 0;
    var tableData = data['tableData'];
    var tableNotes = "";
	var mfg = "";
	var type = "";
	var searchColumn = 2;

    for(var i=0; i < tableData.length; i++){
        var row = tableData[i];

		if(i==0){ // header row
			myHtml += "<tr class='header'>";
		}else{
			myHtml += "<tr class='row'>";
		}
		
        for(var c=0; c < row.length; c++){
            var dValue = row[c];
            if(i==0){ // header row
                myHtml += "<th class='tc" + c + "'>" + dValue + "</th>";
                if(c==searchColumn && dValue.toLowerCase()=='search'){
                    hasSearch = 1; //has model in header - need to build dropdown for filter
                }
            }else{ 
				if(i==1){
					//first row of data - pull the mfg and type
					mfg = row[0]; 
					type = row[1];				
				}
                if(hasSearch && c==searchColumn){
                    modelValues.push(dValue);
                }
                myHtml += "<td class='tc" + c + "'>" + dValue + "</td>";
				
			}
        }
        myHtml += "</tr>";
    }

    if(hasSearch){
        var filterHtml = '<div class="sierraHeader"><div class=""><span>Parts Selector</span>Find the parts you need fast!</div><ul><li><label>Manufacturer:</label><select disabled="disabled"><option>' + mfg + '</option></select></li><li><label>Part Type:</label><select disabled="disabled"><option>' + type + '</option></select></li><li><div class="filter"><label>Model:</label><select id="modelSelect"><option value="none" selected="selected">Select a Model</option>';
        //cleanup array from dups
        uniqueModels = modelValues.filter(function(item, pos) {
            return modelValues.indexOf(item) == pos;
        })

        for(var m=0; m < uniqueModels.length; m++) {
            var modelItem = uniqueModels[m];
            filterHtml += "<option value='" + modelItem + "'>" + modelItem + '</option>';
        }
        filterHtml += "</select></div></li><li class='find'><a href='#' onclick='filterModel();return false;'>Find</a> <a href='#' id='resetButton' onclick='resetSel();return false;'>Clear</a></li></ul></div>";
    }

    if(typeof data['notes'] !== 'undefined') {
        //notes exist
        tableNotes = "<div class='notes' style='display:none'>" + data['notes'] + "</div>";
    }

    return filterHtml + myHtml + "</table>" + tableNotes;
}




/**** Cookies   ******/
function createCookie(name,value,days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name,"",-1);
}