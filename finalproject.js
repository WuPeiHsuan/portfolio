window.addEventListener("load", function(e){
    
    var canvas = document.getElementById("viewport");
    var context = canvas.getContext("2d");
    
    
    var lastframe = 0;   //影格率
    var fpstime = 0;
    var framecount = 0;
    var fps = 0;

    var drag = false;
      
    var level = {
        x: 250,        
        y: 113,        
        columns: 8,     //遊戲行列數設定
        rows: 8,        
        tilewidth: 40,  //tile設定
        tileheight: 40, 
        tiles: [],      
        selectedtile: { selected: false, column: 0, row: 0 }
    };
    
    var tilecolors = [[255, 128, 128],  
                      [128, 255, 128],
                      [128, 128, 255],
                      [255, 255, 128],
                      [255, 128, 255],
                      [128, 255, 255],
                      [255, 255, 255]];
    
    
    var clusters = [];  // { column, row, length, horizontal }
    var moves = [];     // { column1, row1, column2, row2 }
   
    var currentmove = { column1: 0, row1: 0, column2: 0, row2: 0 };
     
	var gamestates = { init: 0, ready: 1, resolve: 2 };//ready:該玩家進行動作 resolve:遊戲正在執行
    var gamestate = gamestates.init;
      
    var score = 0;
    var sec = 15; //倒數秒數
    
    // 動畫變數設定
    var animationstate = 0;
    var animationtime = 0;
    var animationtimetotal = 0.3;
    
    //提示
    var showmoves = false;
    var hint = 3;

    var gameover = false;
    
    var buttons = [ { x: 30, y: 300, width: 150, height: 50, text: "Restart"},
                    { x: 30, y: 360, width: 150, height: 50, text: "Get Hints"}];
                    
                      
    function init() {
        
        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mouseup", onMouseUp);
        canvas.addEventListener("mouseout", onMouseOut);
              
        for (var i=0; i<level.columns; i++) {
            level.tiles[i] = [];
            for (var j=0; j<level.rows; j++) {
                level.tiles[i][j] = { type: 0, shift:0 }  //type:顏色 shift:要下移的數目
            }
        }
        
        newGame();
        countdown();   
            
        //main loop
        main(0);
    }
    
    //倒數計時
    function countdown(){
    	if(sec==0){
    		gameover = true;
    		return;
    	}
    	sec -= 1; 
  		setTimeout(countdown,1000);      
  		      
	}
  
     // Main loop
    function main(tframe) {
        //產生動畫要求
        window.requestAnimationFrame(main);
        
        //更新產生遊戲
        update(tframe);
        render();
    }
    
    //更新遊戲狀態
    function update(tframe) {
        var dt = (tframe - lastframe) / 1000;
        lastframe = tframe;
        
        // Update fps 
        updateFps(dt);
        
        if (gamestate == gamestates.ready) {

            if (moves.length <= 0) {
                gameover = true;
            }
        } else if (gamestate == gamestates.resolve) {

            animationtime += dt;
            
            if (animationstate == 0) {
                // 要找Clusters並消除
                if (animationtime > animationtimetotal) {
                    
                    findClusters();
                    
                    if (clusters.length > 0) {
                    	sec = 15; //重新倒數
                        //加分
                        for (var i=0; i<clusters.length; i++) {
                            //三個以上多一個加100
                            
                            score += 100 * (clusters[i].length - 2);;
                        }
                    
                        removeClusters();
                    
                        animationstate = 1;
                    } else {
                        //沒有cluster 玩家繼續動作
                        gamestate = gamestates.ready;
                    }
                    animationtime = 0;
                }
            } else if (animationstate == 1) {
                // 移動Tiles
                if (animationtime > animationtimetotal) {
  
                    shiftTiles();
                    
                    //換回找cluster狀態
                    animationstate = 0;
                    animationtime = 0;
                    
                    findClusters();
                    if (clusters.length <= 0) {
                        //玩家繼續動作
                        gamestate = gamestates.ready;
                    }
                }
            } else if (animationstate == 2) {
                //交換tiles
                if (animationtime > animationtimetotal) {
                
                    swap(currentmove.column1, currentmove.row1, currentmove.column2, currentmove.row2);
                    // 檢查有沒有新cluster
                    findClusters();
                    if (clusters.length > 0) {

                        animationstate = 0;
                        animationtime = 0;
                        gamestate = gamestates.resolve;
                    } else {
                        //無效交換 要換回來
                        animationstate = 3;
                        animationtime = 0;
                    }
                     // Update moves and clusters
                    findMoves();
                    findClusters();
                }
            } else if (animationstate == 3) {
                //換回來
                if (animationtime > animationtimetotal) {

                    swap(currentmove.column1, currentmove.row1, currentmove.column2, currentmove.row2);
                    //玩家繼續動作
                    gamestate = gamestates.ready;
                }
            }
            

            findMoves();
            findClusters();
        }
    }
    
    
    function updateFps(dt) {
        if (fpstime > 0.25) {
            // Calculate fps
            fps = Math.round(framecount / fpstime);
            
            // Reset time and framecount
            fpstime = 0;
            framecount = 0;
        }
        
        // Increase time and framecount
        fpstime += dt;
        framecount++;
    }
    

	 //置中文字
    function drawCenterText(text, x, y, width) {
        var textdim = context.measureText(text);
        context.fillText(text, x + (width-textdim.width)/2, y);
    }
    
    
    // 產生遊戲畫面
    function render() {

        drawFrame();  
        //score
        context.fillStyle = "#0c3864";
        context.font = "24px Aclonica";
        drawCenterText("SCORE", 30, level.y+30, 150);
        drawCenterText(score, 30, level.y+60, 150);
        //countdown
        context.fillStyle = "#c94c4c";
        drawCenterText(sec, 30, level.y+150, 150);
        context.font = "20px Aclonica";
        drawCenterText("COUNTDOWN", 30, level.y+120, 150);
        //buttons
        drawButtons(); 
        //Hint
        context.fillStyle = "#c94c4c";
        context.font = "18px Averia Libre";
        drawCenterText(hint+" Left", 30, level.y+320, 150);           
        //level background
        var levelwidth = level.columns * level.tilewidth;
        var levelheight = level.rows * level.tileheight;
        context.fillStyle = "#0c3864";
        context.fillRect(level.x - 4, level.y - 4, levelwidth + 8, levelheight + 8);     
        //tiles
        renderTiles();     
        
        
        //Show hints
        if (showmoves && clusters.length <= 0 && gamestate == gamestates.ready) {
            renderMoves();
        }     
        // Game Over 
        if (gameover) {
            context.fillStyle = "rgba(0, 0, 0, 0.8)";
            context.fillRect(level.x, level.y, levelwidth, levelheight);
            
            context.fillStyle = "#ffffff";
            context.font = "24px Audiowide";
            drawCenterText("Game Over", level.x, level.y + levelheight / 2 + 10, levelwidth);
        }
    }
    
  	
    function drawFrame() {
        //background       
        context.fillStyle = "#fefbd8";
        context.fillRect(1, 1, canvas.width-2, canvas.height-2);    
        //header
        context.fillStyle = "#618685";
        context.fillRect(0, 0, canvas.width, 65); 
        //title
        context.fillStyle = "#ffffff";
        context.font = "28px Aclonica";
        drawCenterText("JavaScript Project - Match3 Game",235, 40, 150);      
    }


    function drawButtons() {
        for (var i=0; i<buttons.length; i++) {
            //button
            context.fillStyle = "#454140";
            context.fillRect(buttons[i].x, buttons[i].y, buttons[i].width, buttons[i].height);       
            //button text
            context.fillStyle = "#ffffff";
            context.font = "20px Averia Libre";
            var textdim = context.measureText(buttons[i].text);
            context.fillText(buttons[i].text, buttons[i].x + (buttons[i].width-textdim.width)/2, buttons[i].y+30);
        }
    }
    
    
    function renderTiles() {
        for (var i=0; i<level.columns; i++) {
            for (var j=0; j<level.rows; j++) {
                
                var shift = level.tiles[i][j].shift;  
                //取得tile座標
                var coord = getTileCoordinate(i, j, 0, (animationtime / animationtimetotal) * shift);
                
                // 檢查是否有tile
                if (level.tiles[i][j].type >= 0) {
                    //取得顏色
                    var col = tilecolors[level.tiles[i][j].type];    
                    //生成tile
                    drawTile(coord.tilex, coord.tiley, col[0], col[1], col[2]);
                }                
                // 將選取的tile畫成紅色
                if (level.selectedtile.selected) {
                    if (level.selectedtile.column == i && level.selectedtile.row == j) {
                        drawTile(coord.tilex, coord.tiley, 255, 0, 0);
                    }
                }
            }
        }
        
        //交換動畫
        if (gamestate == gamestates.resolve && (animationstate == 2 || animationstate == 3)) {
            // 算移動距離
            var shiftx = currentmove.column2 - currentmove.column1;
            var shifty = currentmove.row2 - currentmove.row1;

            //取得第一個tile的資訊
            var coord1 = getTileCoordinate(currentmove.column1, currentmove.row1, 0, 0);
            var coord1shift = getTileCoordinate(currentmove.column1, currentmove.row1, (animationtime / animationtimetotal) * shiftx, (animationtime / animationtimetotal) * shifty);
            var col1 = tilecolors[level.tiles[currentmove.column1][currentmove.row1].type];
            
            //取得第二個tile的資訊
            var coord2 = getTileCoordinate(currentmove.column2, currentmove.row2, 0, 0);
            var coord2shift = getTileCoordinate(currentmove.column2, currentmove.row2, (animationtime / animationtimetotal) * -shiftx, (animationtime / animationtimetotal) * -shifty);
            var col2 = tilecolors[level.tiles[currentmove.column2][currentmove.row2].type];
            
            //畫空的黑底
            drawTile(coord1.tilex, coord1.tiley, 0, 0, 0);
            drawTile(coord2.tilex, coord2.tiley, 0, 0, 0);
            
            // 交換位置
            if (animationstate == 2) {
                drawTile(coord1shift.tilex, coord1shift.tiley, col1[0], col1[1], col1[2]);
                drawTile(coord2shift.tilex, coord2shift.tiley, col2[0], col2[1], col2[2]);
            } else {
                //換回來
                drawTile(coord2shift.tilex, coord2shift.tiley, col2[0], col2[1], col2[2]);
                drawTile(coord1shift.tilex, coord1shift.tiley, col1[0], col1[1], col1[2]);
            }
        }
    }
    
    // 拿到tile座標
    function getTileCoordinate(column, row, columnoffset, rowoffset) {
        var tilex = level.x + (column + columnoffset) * level.tilewidth;
        var tiley = level.y + (row + rowoffset) * level.tileheight;
        return { tilex: tilex, tiley: tiley};
    }
    
    //將tile填入顏色
    function drawTile(x, y, r, g, b) {
        context.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
        context.fillRect(x + 2, y + 2, level.tilewidth - 4, level.tileheight - 4);
    }
    
    // 畫出提示
    function renderMoves() {
        for (var i=0; i<moves.length; i++) {
            //取得位置
            var coord1 = getTileCoordinate(moves[i].column1, moves[i].row1, 0, 0);
            var coord2 = getTileCoordinate(moves[i].column2, moves[i].row2, 0, 0);
            
            //畫紅線標記
            context.strokeStyle = "#c94c4c";
            context.beginPath();
            context.moveTo(coord1.tilex + level.tilewidth/2, coord1.tiley + level.tileheight/2);
            context.lineTo(coord2.tilex + level.tilewidth/2, coord2.tiley + level.tileheight/2);
            context.stroke();
        }
    }
    
    // Restart
    function newGame() {
        // Reset    
        if(gameover!=true){
        	score = 0;
        	hint = 3;
        	sec = 15;
    		gamestate = gamestates.ready;

        	createLevel();       
			
        	findMoves();
        	findClusters();
         
        }else{
        	gameover = false;
        	init();
        }
    }
    
    
    //隨機生成關卡
    function createLevel() {
        var done = false;
        
        while (!done) {
            // 隨機生成
            for (var i=0; i<level.columns; i++) {
                for (var j=0; j<level.rows; j++) {
                    level.tiles[i][j].type = getRandomTile();
                }
            }       
            //消除clusters
            resolveClusters(); 
            //找move
            findMoves();
            //有可移動move才算生成成功
            if (moves.length > 0) {
                done = true;
            }
        }
    }
    
    
    //隨機挑tile顏色
    function getRandomTile() {
        return Math.floor(Math.random() * tilecolors.length);
    }
    
    //resolving
    function resolveClusters() {
       
        findClusters();
        //找到還有未消除clusters
        while (clusters.length > 0) {
            //消除clusters
            removeClusters();
            //移動剩下的
            shiftTiles(); 
            //再找一次
            findClusters();
        }
    }
    
    //找Cluster
    function findClusters() {
        clusters = []
              
        //找水平
        for (var j=0; j<level.rows; j++) {

            var matchlength = 1;
            for (var i=0; i<level.columns; i++) {
                var checkcluster = false;
                
                if (i == level.columns-1) {
                    //檢查完畢
                    checkcluster = true;
                } else {
                    //檢查他的下一個是否一樣顏色
                    if (level.tiles[i][j].type == level.tiles[i+1][j].type &&
                        level.tiles[i][j].type != -1) {
                        
                        matchlength += 1;
                    } else {
                        checkcluster = true;
                    }
                }                
                if (checkcluster) {
                    if (matchlength >= 3) {
                        //加入Cluster陣列
                        clusters.push({ column: i+1-matchlength, row:j,
                                        length: matchlength, horizontal: true });
                    }
                    
                    matchlength = 1;
                }
            }
        }
        
        //找垂直
        for (var i=0; i<level.columns; i++) {

            var matchlength = 1;
            for (var j=0; j<level.rows; j++) {
                var checkcluster = false;
                
                if (j == level.rows-1) {
                    checkcluster = true;
                } else {
                    if (level.tiles[i][j].type == level.tiles[i][j+1].type &&
                        level.tiles[i][j].type != -1) {

                        matchlength += 1;
                    } else {
                        checkcluster = true;
                    }
                }         
                if (checkcluster) {
                    if (matchlength >= 3) {
                        clusters.push({ column: i, row:j+1-matchlength,
                                        length: matchlength, horizontal: false });
                    }
                    
                    matchlength = 1;
                }
            }
        }
    }
    
    
    //找可移動的tile
    function findMoves() {

        moves = []
        //找水平
        for (var j=0; j<level.rows; j++) {
            for (var i=0; i<level.columns-1; i++) {
                //交換後找cluster再換回來
                swap(i, j, i+1, j);
                findClusters();
                swap(i, j, i+1, j);
                
                //交換後有cluster則找到move
                if (clusters.length > 0) {
					//加入move
                    moves.push({column1: i, row1: j, column2: i+1, row2: j});
                }
            }
        }
        
        //找垂直
        for (var i=0; i<level.columns; i++) {
            for (var j=0; j<level.rows-1; j++) {
                swap(i, j, i, j+1);
                findClusters();
                swap(i, j, i, j+1);
                
                if (clusters.length > 0) {
                    moves.push({column1: i, row1: j, column2: i, row2: j+1});
                }
            }
        }
        clusters = []
    }
    
     //cluster迴圈
    function loopClusters(func) {
        for (var i=0; i<clusters.length; i++) {
            //  { column, row, length, horizontal }
            var cluster = clusters[i];
            var coffset = 0;
            var roffset = 0;
            for (var j=0; j<cluster.length; j++) {
                func(i, cluster.column+coffset, cluster.row+roffset, cluster);
                
                if (cluster.horizontal) {
                    coffset++;
                } else {
                    roffset++;
                }
            }
        }
    }
    
     //消除cluster
    function removeClusters() {
        //移除的tile type設為1
        loopClusters(function(index, column, row, cluster) { level.tiles[column][row].type = -1; });

        //算幾個tile要往下移
        for (var i=0; i<level.columns; i++) {
            var shift = 0;
            for (var j=level.rows-1; j>=0; j--) {

                if (level.tiles[i][j].type == -1) {
                    //要移除的 shift增加
                    shift++;
                    level.tiles[i][j].shift = 0;
                } else {
                    // Set the shift
                    level.tiles[i][j].shift = shift;
                }
            }
        }
    }
    
	//下移tile並填補新tile
    function shiftTiles() {

        for (var i=0; i<level.columns; i++) {
            for (var j=level.rows-1; j>=0; j--) {

                if (level.tiles[i][j].type == -1) {
                    //填補
                    level.tiles[i][j].type = getRandomTile();
                } else {
                    //下移
                    var shift = level.tiles[i][j].shift;
                    if (shift > 0) {
                        swap(i, j, i, j+shift)
                    }
                }             
             
                level.tiles[i][j].shift = 0;
            }
        }
    }
    
    //到滑鼠按的tile
    function getMouseTile(pos) {
        
        var tx = Math.floor((pos.x - level.x) / level.tilewidth);
        var ty = Math.floor((pos.y - level.y) / level.tileheight);
        
        // 是否存在
        if (tx >= 0 && tx < level.columns && ty >= 0 && ty < level.rows) {
            
            return {
                valid: true,
                x: tx,
                y: ty
            };
        }
          
        return {
            valid: false,
            x: 0,
            y: 0
        };
    }
    
    // 可不可以交換
    function canSwap(x1, y1, x2, y2) {
        // 相鄰才可以換
        if ((Math.abs(x1 - x2) == 1 && y1 == y2) ||
            (Math.abs(y1 - y2) == 1 && x1 == x2)) {
            return true;
        }       
        return false;
    }
    
    //交換
    function swap(x1, y1, x2, y2) {
        var typeswap = level.tiles[x1][y1].type;
        level.tiles[x1][y1].type = level.tiles[x2][y2].type;
        level.tiles[x2][y2].type = typeswap;
    }
    
    //玩家swap
    function mouseSwap(c1, r1, c2, r2) {
        currentmove = {column1: c1, row1: r1, column2: c2, row2: r2};
    
        level.selectedtile.selected = false;
              
        animationstate = 2;
        animationtime = 0;
        gamestate = gamestates.resolve;
    }
    
    
    function onMouseMove(e) {

        var pos = getMousePos(canvas, e);
        
        // 檢查是否要移動選取tile
        if (drag && level.selectedtile.selected) {
        
            mt = getMouseTile(pos);
            if (mt.valid) {
                // Valid tile
                
                // 檢查是否可以交換
                if (canSwap(mt.x, mt.y, level.selectedtile.column, level.selectedtile.row)){
                   
                    mouseSwap(mt.x, mt.y, level.selectedtile.column, level.selectedtile.row);
                }
            }
        }
    }
    
    
	function onMouseDown(e) {
        
        var pos = getMousePos(canvas, e);           
        
        if (!drag) {
            // 找到滑鼠按的Tile
            mt = getMouseTile(pos);
            
            if (mt.valid) {
                
                var swapped = false;
                if (level.selectedtile.selected) {
                    if (mt.x == level.selectedtile.column && mt.y == level.selectedtile.row) {
                        //按相同的即取消選取
                        level.selectedtile.selected = false;
                        drag = true;
                        return;
                    } else if (canSwap(mt.x, mt.y, level.selectedtile.column, level.selectedtile.row)){
                        //交換
                        mouseSwap(mt.x, mt.y, level.selectedtile.column, level.selectedtile.row);
                        swapped = true;
                    }
                }
                
                if (!swapped) {
                    //如果不能交換即選取為新的tile
                    level.selectedtile.column = mt.x;
                    level.selectedtile.row = mt.y;
                    level.selectedtile.selected = true;
                }
            } else {
                //取消選取
                level.selectedtile.selected = false;
            }

            // Start dragging
            drag = true;
        }
              
        for (var i=0; i<buttons.length; i++) {
            if (pos.x >= buttons[i].x && pos.x < buttons[i].x+buttons[i].width &&
                pos.y >= buttons[i].y && pos.y < buttons[i].y+buttons[i].height) {              
                
                if (i == 0) {// New Game
                    newGame();
                } 
                else if (i == 1) {// Hint
                	
                	if(hint!=0){
                		hint--;
                   		showmoves = !showmoves;
                    	setTimeout(function(){showmoves = !showmoves;}, 3000); //提示三秒
                    }
                }             
            }
        }  
    }
    
    function onMouseUp(e) {       
        drag = false;
    }
    
    function onMouseOut(e) {        
        drag = false;
    }
    
    //取得游標位置
    function getMousePos(canvas, e) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((e.clientX - rect.left)/(rect.right - rect.left)*canvas.width),
            y: Math.round((e.clientY - rect.top)/(rect.bottom - rect.top)*canvas.height)
        };
    }
    
    // start the game
    init();
});
        