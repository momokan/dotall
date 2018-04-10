var $ = require('jquery');

Dotall = function() {
    this.canvas = null;
    this.schema = null;
    this.actionState = null;
    this.dotSize = 4;
    this.defaultColor = "rgba(0, 0, 0, 0)";
    this.canvasCss = {
        'position': 'absolute',
        'top':      window.innerHeight / 2 + 'px',
        'left':     window.innerWidth / 2 + 'px',
        'z-index':  1024
    };
};

Dotall.prototype.load = function(schema) {
    this.schema = schema;
    this.prepareCanvas();
    this.action();
};

Dotall.prototype.loadUrl = function(url) {
    var dotall = this;

    $.getJSON(url, function(data) {
        dotall.load(data);
    });
};

Dotall.prototype.prepareCanvas = function() {
    if (this.canvas != null) {
        return;
    }

    var canvasId = 'dotall-canvas-' + Math.floor(Math.random() * (1000000));

    $('body').append('<canvas class="dotall" id="' + canvasId + '"/>');

    this.canvas = $('#' + canvasId);
    this.canvas.css(this.canvasCss);
};

Dotall.prototype.paint = function(imageNumber = 0) {
    var context = this.canvas[0].getContext('2d');
    var pixels = this.getPixelsOf(imageNumber);
    var y = 0;

    // canvas 描画前にリサイズしておく必要がある
    this.resizeCanvas(imageNumber);

    for (var lineNumber in pixels) {
        var line = pixels[lineNumber];
        var x = 0;

        for (var column in line) {
            var colorNumber = line[column];

            if (colorNumber != ' ') {
                context.fillStyle = this.getColorOf(colorNumber);
                context.fillRect(x * this.dotSize, y * this.dotSize, this.dotSize, this.dotSize);
            }

            x = x + 1;
        }

        y = y + 1;
    }
};

Dotall.prototype.resizeCanvas = function(imageNumber = 0) {
    var pixels = this.getPixelsOf(imageNumber);
    var lineLength = 0;

    for (var lineNumber in pixels) {
        if (lineLength < pixels[lineNumber].length) {
            lineLength = pixels[lineNumber].length;
        }
    }

    this.canvas.attr('width', lineLength * this.dotSize);
    this.canvas.attr('height', pixels.length * this.dotSize);
}

Dotall.prototype.getImages = function() {
    if (this.schema == null) {
        console.warn('image data is not loaded.');
        return [];
    }
    
    if (this.schema.images == null) {
        console.warn('image data dose not have "iamges" property.');
        return [];
    }

    return this.schema.images;
}

Dotall.prototype.getPixelsOf = function(imageNumber) {
    var image = this.getImages()[imageNumber];

    if (image == null) {
        console.warn('image data dose not have iamge of index: ' + imageNumber);
        return [];
    }

    if (image.pixels == null) {
        console.warn('image data dose not have "pixels" property.');
        return [];
    }

    return image.pixels;
}

Dotall.prototype.getColorOf = function(colorNumber) {
    if (this.schema == null) {
        console.warn('image data is not loaded.');
        return this.defaultColor;
    }
    
    if (this.schema.colors == null) {
        console.warn('image data dose not have "colors" property.');
        return this.defaultColor;
    }

    if (this.schema.colors[colorNumber] == null) {
        console.warn('image data dose not have color of index: ' + colorNumber);
        return this.defaultColor;
    }

    return this.schema.colors[colorNumber];
}

Dotall.prototype.action = function() {
    var pixelPerSecond = 100;
    var imageRefreshInterval = 1000;
    var currentTime = new Date().getTime();

    if (this.actionState == null) {
        this.actionState = {
            "imageNumber": 0,
            "imageRefreshTime": currentTime,
            "motionStartTime": null,
            "motionStartPoint": {
                "top": parseInt(this.canvas.css('top').replace(/px$/, '')),
                "left": parseInt(this.canvas.css('left').replace(/px$/, ''))
            },
            "motionEndTime": currentTime,
            "motionType": "top",
            "motionValue": 0
        }
    }

    // 表示を更新する
    if (this.actionState.imageRefreshTime <= currentTime) {
        this.paint(this.actionState.imageNumber);
        this.actionState.imageRefreshTime = this.actionState.imageRefreshTime + imageRefreshInterval; 
        this.actionState.imageNumber = (this.actionState.imageNumber + 1) % this.getImages().length;
    }

    // 移動する
    if (this.actionState.motionEndTime <= currentTime) {
        // 現在地を終点に補正する
        this.canvas.css(this.actionState.motionType, this.actionState.motionStartPoint[this.actionState.motionType] + this.actionState.motionValue + "px");

        // 開始点を更新する
        this.actionState.motionStartTime = this.actionState.motionEndTime;
        this.actionState.motionStartPoint = {
            "top": parseInt(this.canvas.css('top').replace(/px$/, '')),
            "left": parseInt(this.canvas.css('left').replace(/px$/, ''))
        };

        // 次の移動時間を決める
        var second = Math.floor(Math.random() * (3));

        // 次の移動量を求める
        this.actionState.motionEndTime =  this.actionState.motionEndTime + (second * 1000);
        if (Math.floor(Math.random() * (100)) % 2 == 0) {
            this.actionState.motionType = "top";
        } else {
            this.actionState.motionType = "left";
        }
        this.actionState.motionValue = second * pixelPerSecond;
        if (Math.floor(Math.random() * (100)) % 2 == 0) {
            this.actionState.motionValue = this.actionState.motionValue * -1;
        }
    } else {
        // 現在地を更新する
        var motionStartValue = this.actionState.motionStartPoint[this.actionState.motionType];
        var motionTime = this.actionState.motionEndTime - this.actionState.motionStartTime;
        var motionCurrentTime = currentTime - this.actionState.motionStartTime;

        this.canvas.css(this.actionState.motionType, motionStartValue + (this.actionState.motionValue * (motionCurrentTime / motionTime)) + "px");
    }

    // 次の更新処理を呼び出す
    var dotall = this;
    setInterval(function() {dotall.action();}, 10);
}



