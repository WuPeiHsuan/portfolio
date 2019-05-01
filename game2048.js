window.addEventListener("load", function(e){
	var i,j,k,c;
	var aCell = new Array(4);
	var bCell = new Array(16);
	for (i=0; i<4; i++){
		aCell[i] = new Array(4);
	}
	for (i=0; i<4; i++){
		for (j=0; j<4; j++){
			k = document.createElement("div");
			c = document.createElement("p");
			bCell[4*i+j] = " ";
			aCell[i][j] = document.createTextNode(bCell[4*i+j]);
			c.appendChild(aCell[i][j]);
			k.appendChild(c);
			document.getElementById("container").appendChild(k);
		}
	}
	var genRandom = function(){
		var r;
		var num = (Math.random()>0.75)? 4:2;
		var aTmp = bCell.map( function(item) { return item==" ";} );
		var check = aTmp.every( function(item){ return item==false;});
		//console.log(aTmp);
		//aTmp[Math.floor(Math.random()*aTmp.length)] = num;
		
		
		if(check==false){
			r = Math.floor(Math.random()*aTmp.length);
			while(aTmp[r]!=true){
				r = Math.floor(Math.random()*aTmp.length);
			}
			bCell[r] = num;
			for (i=0; i<4; i++){
				for (j=0; j<4; j++){
				aCell[i][j].nodeValue = bCell[4*i+j];
				}
			}
		}
		else{
			alert("YOU LOSE");
		}
		
	}
	
	var check = function(){
		var win = bCell.some( function(item) { return item==2048;} );
		if(win==true){
		alert("YOU WIN!!!")
		}
	}
	
	genRandom();
	genRandom();
	
	
	const KEYBOARDS = {
	UP: 38,
	DOWN: 40,
	LEFT: 37,
	RIGHT: 39
	}
	
	function Move(e){
		var a, b, num;
		
		e = e || window.event;
		ek = e.keyCode;
		
		switch (ek) {
		case KEYBOARDS.LEFT:
				for(j=1; j<4;j++){
					for(i=0; i<4; i++){
						if (aCell[i][j].nodeValue != " "){
							num = aCell[i][j].nodeValue;
							a = j;
							
							do{ 
								a--;
								if(aCell[i][a].nodeValue != " "){ break;}
								
							}while(a>0);
							
							if( aCell[i][a].nodeValue == num){
								aCell[i][a].nodeValue = aCell[i][a].nodeValue*2;
								aCell[i][j].nodeValue = " ";
							}
							else if(aCell[i][a].nodeValue == " "){
								aCell[i][j].nodeValue = " ";
								aCell[i][a].nodeValue = num;
							}
							else {
								aCell[i][j].nodeValue = " ";
								aCell[i][a+1].nodeValue = num;
							}					
						} 		
					}
				}
				for (i=0; i<4; i++){
					for (j=0; j<4; j++){
						bCell[4*i+j] = aCell[i][j].nodeValue;
					}
				}
				//genRandom();
				
			break;
			
		case KEYBOARDS.RIGHT:
			for(j=2; j>=0;j--){
					for(i=0; i<4; i++){
						if (aCell[i][j].nodeValue != " "){
							num = aCell[i][j].nodeValue;
							a = j;
							
							do{ 
								a++;
								if(aCell[i][a].nodeValue != " "){ break;}
								
							}while(a<3);
							
							if( aCell[i][a].nodeValue == num){
								aCell[i][a].nodeValue = aCell[i][a].nodeValue*2;
								aCell[i][j].nodeValue = " ";	
							}
							else if(aCell[i][a].nodeValue == " "){
								aCell[i][j].nodeValue = " ";
								aCell[i][a].nodeValue = num;
							}
							else {
								aCell[i][j].nodeValue = " ";
								aCell[i][a-1].nodeValue = num;
							}		
						} 
					}
				}
				for (i=0; i<4; i++){
					for (j=0; j<4; j++){
						bCell[4*i+j] = aCell[i][j].nodeValue;
					}
				}
				//genRandom();

			break;
			
		case KEYBOARDS.UP:
			for(i=1; i<4;i++){
					for(j=0; j<4; j++){
						if (aCell[i][j].nodeValue != " "){
							num = aCell[i][j].nodeValue;
							a = i;
							
							do{ 
								a--;
								if(aCell[a][j].nodeValue != " "){ break;}
								
							}while(a>0);
							
							if( aCell[a][j].nodeValue == num){
								aCell[a][j].nodeValue = aCell[a][j].nodeValue*2;
								aCell[i][j].nodeValue = " ";
							}
							else if(aCell[a][j].nodeValue == " "){
								aCell[i][j].nodeValue = " ";
								aCell[a][j].nodeValue = num;
							}
							else {
								aCell[i][j].nodeValue = " ";
								aCell[a+1][j].nodeValue = num;
							}		
						} 	
					}
				}
				for (i=0; i<4; i++){
					for (j=0; j<4; j++){
						bCell[4*i+j] = aCell[i][j].nodeValue;
					}
				}
				//genRandom();

			break;
			
		case KEYBOARDS.DOWN:
			for(i=2; i>=0;i--){
					for(j=0; j<4; j++){
						if (aCell[i][j].nodeValue != " "){
							num = aCell[i][j].nodeValue;
							a = i;
							
							do{ 
								a++;
								if(aCell[a][j].nodeValue != " "){ break;}
								
							}while(a<3);
							
							if( aCell[a][j].nodeValue == num){
								aCell[a][j].nodeValue = aCell[a][j].nodeValue*2;
								aCell[i][j].nodeValue = " ";
							}
							else if(aCell[a][j].nodeValue == " "){
								aCell[i][j].nodeValue = " ";
								aCell[a][j].nodeValue = num;
							}
							else {
								aCell[i][j].nodeValue = " ";
								aCell[a-1][j].nodeValue = num;
							}	
						} 
					}
				}
				for (i=0; i<4; i++){
					for (j=0; j<4; j++){
						bCell[4*i+j] = aCell[i][j].nodeValue;
					}
				}
				//genRandom();
				
			break;
		default:
		// ...
		}
		genRandom();
		check();
		
	}
	
	if (window.addEventListener){
		window.addEventListener("keydown", Move);
	}
});


