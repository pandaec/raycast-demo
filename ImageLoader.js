let ImageLoader = function(arr,callback){
    this.image_count = arr.length;
    this.loaded_count = 0;
    this.error_count = 0;
    this.callback = callback;
    this.images = [];
    for(let i=0;i<this.image_count;i++){
        this.images[i] = new Image();
        this.images[i].onload = this.onload.bind(this);
        this.images[i].onerror = this.onerror.bind(this);
        this.images[i].src = arr[i];
    }
}

ImageLoader.prototype.onload = function(){
    console.log("load success!!");
    this.loaded_count += 1;
    this.check_all_loaded();
}

ImageLoader.prototype.onerror = function(){
    console.log("load error!!");
    this.error_count += 1;
    this.check_all_loaded();
}
ImageLoader.prototype.check_all_loaded = function(){
    if(this.loaded_count + this.error_count === this.image_count){
        console.log("all image loaded!!");
        this.callback(this.images);
    }
}
