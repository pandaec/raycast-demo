window.onload = function(){
let canvas = document.getElementById("main_canvas");
let ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
let images = ["assets/player.png","assets/enemy.png"];

let img_loader = new ImageLoader(images,onload);

let background_canvas = document.createElement("canvas");
let background_ctx = background_canvas.getContext("2d");

background_canvas.id = "background_canvas";
background_canvas.width = canvas.width;
background_canvas.height = canvas.height;

let ray_visible = false;

canvas.addEventListener("mousemove",update_mouse_pos);
canvas.addEventListener("mousedown",()=>ray_visible = !ray_visible);

let mouse_pos = {x:400,y:300};
let player = {x:0,y:0};
let rectangles = [
    {x:10,y:10,width:50,height:90},
    {x:110,y:200,width:120,height:120},
    {x:400,y:350,width:200,height:30},
    {x:200,y:500,width:60,height:60}
];
let stage_corners = [
    {x:0,y:0},
    {x:canvas.width,y:0},
    {x:0,y:canvas.height},
    {x:canvas.width,y:canvas.height}
];
let light_points = [];

function onload(images){
    //draw grid background
    for(let i=0;i<canvas.width/32;i++){
        for(let j=0;j<canvas.height/32;j++){
            if((i+j)%2 === 0)
                background_ctx.fillStyle = "#6b6b6b";
            else
                background_ctx.fillStyle = "#646464";
            background_ctx.fillRect(i*32,j*32,32,32);
        }
    }
    player.img = images[0];
    draw();
}

function update(){
    player.x = mouse_pos.x - 16;
    player.y = mouse_pos.y - 16;
    player.cx = player.x+16;
    player.cy = player.y+16;
    
    light_points = [];


    for(let rect of rectangles){
        let ray = null;
        let corners = [
            {x:rect.x+0.1, y:rect.y+0.1},
            {x:rect.x-0.1, y:rect.y-0.1},

            {x:rect.x-0.1 + rect.width, y:rect.y+0.1},
            {x:rect.x+0.1 + rect.width, y:rect.y-0.1},

            {x:rect.x-0.1 + rect.width, y:rect.y-0.1 + rect.height},
            {x:rect.x+0.1 + rect.width, y:rect.y+0.1 + rect.height},

            {x:rect.x+0.1, y:rect.y-0.1 + rect.height},
            {x:rect.x-0.1, y:rect.y+0.1 + rect.height},            
        ];

        for(let c of corners){
            // y = mx + b
            let slope = (c.y-player.cy)/(c.x-player.cx);
            let b = player.cy - slope * player.cx;

            let end = null;

            if(c.x === player.cx){
                // vertical line
                if(c.y <= player.cy){
                    end = {x:player.cx, y:0};
                }else{
                    end = {x:player.cx, y:canvas.height};
                }
            }else if(c.y === player.cy){
                //horizontal line
                if(c.x <= player.cx){
                    end = {x:0,y:player.cy};
                }else{
                    end = {x:canvas.width,y:player.cy};
                }
            }else{
                // find the point where the line cross stage edge
                let left = {x:0,y:b};
                let right = {x:canvas.width,y: slope * canvas.width + b};
                let top = {x:-b/slope, y:0};
                let bottom = {x:(canvas.height-b)/slope ,y:canvas.height};

                if(c.y <= player.cy && c.x >= player.cx){
                    if(inRange(top.x,0,canvas.width)){
                        end = top;
                    }else{
                        end = right;
                    }
                }else if(c.y <= player.cy && c.x <= player.cx){
                    if(inRange(top.x,0,canvas.width)){
                        end = top;
                    }else{
                        end = left;
                    }
                }else if(c.y >= player.cy && c.x >= player.cx){
                    if(inRange(bottom.x,0,canvas.width)){
                        end = bottom;
                    }else{
                        end = right;
                    }
                }else if(c.y >= player.cy && c.x <= player.cx){
                    if(inRange(bottom.x,0,canvas.width)){
                        end = bottom;
                    }else{
                        end = left;
                    }
                }
            }
            ray = {x0:player.cx,y0:player.cy,x1:end.x,y1:end.y};
            
            let intersect = get_rect_intersection(ray);
            if(intersect){
                light_points.push(intersect);
            }else{
                light_points.push(end);
            }
        }

    }

    for(let sc of stage_corners){
        let ray = {x0:player.cx,y0:player.cy,x1:sc.x,y1:sc.y};
        let intersect = get_rect_intersection(ray);
        if(!intersect){
            light_points.push(sc);
        }
    }

    let center = {x:player.cx,y:player.cy};
    //sort light points in anti-clockwise order
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


}

function draw(e){
    update();
    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.drawImage(background_canvas,0,0);
    
    ctx.fillStyle = "lightblue";
    for(let rect of rectangles){
        ctx.fillRect(rect.x,rect.y,rect.width,rect.height);
    }

    if(ray_visible){
        ctx.strokeStyle = "orange";
        ctx.fillStyle = "black"
        ctx.beginPath();
        for(let point of light_points){
            ctx.moveTo(player.cx,player.cy);
            ctx.lineTo(point.x,point.y);
            ctx.stroke();
            ctx.fillRect(point.x-3,point.y-3,6,6);
        }
        ctx.closePath();
    }

    ctx.beginPath();
    ctx.fillStyle = "rgba(255,255,0,0.5)";
    ctx.moveTo(light_points[0].x,light_points[0].y);
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
function get_rect_intersection(ray){
    let dist2_to_wall = Number.POSITIVE_INFINITY;
    let closest_intersection = null;

    for(let rect of rectangles){
        let rlines = [
            {x0:rect.x,y0:rect.y,x1:rect.x+rect.width,y1:rect.y},
            {x0:rect.x,y0:rect.y,x1:rect.x,y1:rect.y+rect.height},
            {x0:rect.x,y0:rect.y+rect.height,x1:rect.x+rect.width,y1:rect.y+rect.height},
            {x0:rect.x+rect.width,y0:rect.y,x1:rect.x+rect.width,y1:rect.y+rect.height},
        ];

        for(let rline of rlines){
            let intersect = segment_intersection(ray,rline,true);
            if(intersect){
                let dist2 = (ray.x0 - intersect.x)*(ray.x0 - intersect.x) + (ray.y0 - intersect.y) * (ray.y0 - intersect.y);
                if(dist2 < dist2_to_wall){
                    dist2_to_wall = dist2;
                    closest_intersection = intersect;
                }
            }
        }
    }
    return closest_intersection;
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
