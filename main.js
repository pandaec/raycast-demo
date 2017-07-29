window.onload = function(){
let canvas = document.getElementById("main_canvas");
let ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

let images = ["assets/player.png","assets/enemy.png"];
let img_loader = new ImageLoader(images,onload);

let background_canvas = document.createElement("canvas");
background_canvas.id = "background_canvas";
background_canvas.width = canvas.width;
background_canvas.height = canvas.height;

let background_ctx = background_canvas.getContext("2d");

canvas.addEventListener("mousemove",update_mouse_pos);

let mouse_pos = {x:400,y:300};
let player = {x:0,y:0};
let rectangles = [
    {x:10,y:10,width:50,height:90},
    {x:110,y:200,width:120,height:120},
    {x:400,y:350,width:200,height:30},
    {x:200,y:500,width:60,height:60}
];
let rect_lines = [];
let border_lines = [
    {x0:0,y0:0,x1:canvas.width,y1:0},
    {x0:0,y0:0,x1:0,y1:canvas.height},
    {x0:canvas.width,y0:0,x1:canvas.width,y0:canvas.height},
    {x0:0,y0:canvas.height,x1:canvas.width,y1:canvas.height}
];


function onload(images){
    //draw grid background
    for(let i=0;i<800/32;i++){
        for(let j=0;j<600/32;j++){
            if((i+j)%2 === 0)
                background_ctx.fillStyle = "#6b6b6b";
            else
                background_ctx.fillStyle = "#646464";
            background_ctx.fillRect(i*32,j*32,32,32);
        }
    }
    player.img = images[0];
    for(rect of rectangles){
        rect_lines.push({x0:rect.x,y0:rect.y,x1:rect.x+rect.width,y1:rect.y});
        rect_lines.push({x0:rect.x,y0:rect.y,x1:rect.x,y1:rect.y+rect.height});
        rect_lines.push({x0:rect.x,y0:rect.y+rect.height,x1:rect.x+rect.width,y1:rect.y+rect.height});
        rect_lines.push({x0:rect.x+rect.width,y0:rect.y,x1:rect.x+rect.width,y1:rect.y+rect.height});
    }
    draw();
}

function update(){
    player.x = mouse_pos.x - 16;
    player.y = mouse_pos.y - 16;
}

function draw(e){
    update();
    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.drawImage(background_canvas,0,0);

    ctx.save();
    
    ctx.fillStyle = "lightblue";
    for(let rect of rectangles){
        ctx.fillRect(rect.x,rect.y,rect.width,rect.height);
    }

    let sight_lines = [
        {x0:player.x+16,y0:player.y+16,x1:0,y1:0},
        {x0:player.x+16,y0:player.y+16,x1:canvas.width,y1:0},
        {x0:player.x+16,y0:player.y+16,x1:0,y1:canvas.height},
        {x0:player.x+16,y0:player.y+16,x1:canvas.width,y1:canvas.height}
    ];
    let light_points = [];

    ctx.strokeStyle = "white";
    for(let rect of rectangles){
        ctx.beginPath();
        sight_lines.push({x0:player.x+16,y0:player.y+16,x1:rect.x,y1:rect.y});
        sight_lines.push({x0:player.x+16,y0:player.y+16,x1:rect.x+rect.width,y1:rect.y});
        sight_lines.push({x0:player.x+16,y0:player.y+16,x1:rect.x,y1:rect.y+rect.height});
        sight_lines.push({x0:player.x+16,y0:player.y+16,x1:rect.x+rect.width,y1:rect.y+rect.height});        

        ctx.stroke();
        ctx.closePath();
    }

    ctx.strokeStyle = "red";
    for(let line of rect_lines){
        ctx.beginPath();
        ctx.moveTo(line.x0,line.y0);
        ctx.lineTo(line.x1,line.y1);
        ctx.stroke();
        ctx.closePath();
    }
    for(let sight of sight_lines){
        let closest_point = null;
        let closest_rect_line = null;
        let closest_dist2 = Number.MAX_SAFE_INTEGER;
        
        for(let rline of rect_lines){
            let intersect = segment_intersection(sight,rline,true);
            if(intersect){
                let dist2 = (player.x+16-intersect.x)*(player.x+16-intersect.x) + (player.y+16-intersect.y)*(player.y+16-intersect.y);
                if(dist2<closest_dist2){
                    closest_dist2 = dist2;
                    closest_point = intersect;
                    closest_rect_line = rline;
                }
            }
        }
        
        if(closest_point){
            //try to connect pointer at corner to nearest border
            //check if it is at corner
            //i.e. original position
            // if(closest_point.x === closest_rect_line.x0 && closest_point.y === closest_rect_line.y0 || closest_point.x === closest_rect_line.x1 && closest_point.y === closest_rect_line.y1){
            //     let sight = {x0:player.x+16,y0:player.y+16,x1:closest_point.x,y1:closest_point.y};
            //     //find the closest border to point
            //     let closest_dist2 = Number.MAX_SAFE_INTEGER;
            //     let border_point = null;
            //     for(let border of border_lines){
            //         let border_intersect = segment_intersection(sight,border,false)
            //         if(border_intersect){
            //             let dist2 = (closest_point.x-border_intersect.x)*(closest_point.x-border_intersect.x) + (closest_point.y-border_intersect.y)*(closest_point.y-border_intersect.y);
            //             if(dist2<closest_dist2){
            //                 closest_dist2 = dist2;
            //                 border_point = border_intersect;
            //             }
            //         }
            //     }
            //     closest_point = border_point;
            // }
            light_points.push(closest_point);

            ctx.beginPath();
            ctx.strokeStyle = "orange";
            ctx.moveTo(player.x+16,player.y+16);
            ctx.lineTo(closest_point.x,closest_point.y);
            ctx.stroke();
            ctx.closePath();
            ctx.fillStyle = "black";
            ctx.fillRect(closest_point.x-3,closest_point.y-3,6,6);
        }
    }
    let center = {x:player.x+16,y:player.y+16};
    light_points = light_points.sort(
        function(a,b){
            if(a.x - center.x >= 0 && b.x - center.x < 0)
                return 1;
            if(a.x - center.x < 0 && b.x - center.x >= 0)
                return -1;
            if(a.x - center.x === 0 && b.x - center.x === 0){
                if(a.y - center.y >= 0 || b.y - center.y >= 0)
                    return 1;
                return -1;
            }

            let det = (a.x - center.x)*(b.y - center.y) - (b.x - center.x) * (a.y - center.y);
            if(det < 0)
                return 1;
            if(det > 0)
                return -1;

            return 1;
        }
    );
    ctx.fillStyle = "rgba(255,255,0,0.45)";
    ctx.beginPath();
    for(let point of light_points){
        ctx.lineTo(point.x,point.y);
    }
    ctx.fill();
    ctx.closePath();
    
    ctx.drawImage(player.img,player.x,player.y);


    requestAnimationFrame(draw);
}

function update_mouse_pos(evt){
    let rect = canvas.getBoundingClientRect();
    mouse_pos.x = evt.clientX - rect.left;
    mouse_pos.y = evt.clientY - rect.top;
}

function segment_intersection(l0,l1,hasLength){
    //code from coding math
    let p0 = {x:l0.x0,y:l0.y0}, p1 = {x:l0.x1,y:l0.y1};
    let p2 = {x:l1.x0,y:l1.y0}, p3 = {x:l1.x1,y:l1.y1};

    let A1 = p1.y - p0.y,
        B1 = p0.x - p1.x,
        C1 = A1 * p0.x + B1 * p0.y,
        A2 = p3.y - p2.y,
        B2 = p2.x - p3.x,
        C2 = A2 * p2.x + B2 * p2.y,
        denominator = A1 * B2 - A2 * B1;
    
    if(denominator === 0){
        return null;
    }
    let intersect_x = (B2 * C1 - B1 * C2) / denominator,
        intersect_y = (A1 * C2 - A2 * C1) / denominator
    if(hasLength){
        let rx0 = (intersect_x - p0.x) / (p1.x - p0.x),
            ry0 = (intersect_y - p0.y) / (p1.y - p0.y),
            rx1 = (intersect_x - p2.x) / (p3.x - p2.x),
            ry1 = (intersect_y - p2.y) / (p3.y - p2.y);

        if((inRange(rx0,0,1)||inRange(ry0,0,1)) && (inRange(rx1,0,1)||inRange(ry1,0,1))){
            return {x:intersect_x,y:intersect_y};
        }else{
            return null;
        }
    }else{
        if(!isNaN(intersect_x) || !isNaN(intersect_y))
            return {x:intersect_x,y:intersect_y};
        else
            return null;
    }
    

}

function inRange(number,min,max){
    return number>=min && number<=max;
}

}
