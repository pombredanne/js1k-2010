var doc = document;
var style = doc.body.style;
var canvas = doc.getElementById("c");
var width = canvas.width = 300;
var height = canvas.height = innerHeight;

// Paint the canvas opaque black (fillStyle should be "black" by default).
var ctx = canvas.getContext("2d");
ctx.fillRect(0, 0, width, height);

// The original approach was to draw horizontal lines using .fillRect(...).
// Explicitly setting the pixels turned out to be faster in this case.
var image = ctx.getImageData(0, 0, width, height);
var data = image.data;

var cos = Math.cos;
var PI2 = 6.3; // Eh, close enough to Math.PI * 2 ;)
var STEPS = 15;
var iteration = 0;

// Keep track of the min and max painted x coordinate for each
// horizontal line. This allows us to quickly clean up the painted
// pixels remaining from the previous iterations.
var yMin = [];
var yMax = [];
for (var i = 0; i < height;) {
    yMin[i] = width;
    yMax[i++] = 0;
}

style.textAlign = "center";
style.margin = "0px";
style.background = "#000";
style.overflow = "hidden";

// Draw a horizontal line with the first 3 pixels set to black.
function line(x1, x2, y, r, gb) {
    // Using << 2 instead of * 4 allows the minifier to remove the
    // parentheses (<< has lower a precedence than *), saving bytes.
    x1 = (x1 + y * width) << 2;
    x2 = (x2 + y * width) << 2;

    // Reuse y as an iteration counter.
    y = 0;
    while (x1 < x2) {
        // (undefined | 0) -> ToInt32(ToNumber(undefined)) -> 0.
        // Therefore we can call line(x1, x2, y) with the rest of the
        // arguments undefined when we want to draw a black line.
        data[x1] = (y < 3) ? 0 : r | 0;
        data[x1+1] = data[x1+2] = (y++ < 3) ? 0 : gb | 0;
        x1 += 4;
    }
}

function f() {
    iteration += .05;

    for (var y = 0; y < height; y++) {
        var min = width;
        var max = 0;
        var previousX = width;

        var twist = iteration + 4 * cos(iteration) * (y / height);
        for (var step = 0; step <= STEPS; step++) {
            var angle = PI2 * step / STEPS;
            var radius = cos(angle);
            radius = (1 - .4 * radius * radius);

            // (num >> 2) -> (ToInt32(num) >> 2).
            var x = (width + width * cos(angle + twist) * radius) >> 1;

            if (previousX < x) {
                // (num ^ 0) -> (ToInt32(num) ^ 0) -> ToInt32(num).
                var r = (255 * radius) ^ 0;
                line(previousX, x, y, r, (step % 3) ? r : 0);
            }

            previousX = x;
            min = (x < min) ? x : min;
            max = x > max ? x : max;
        }

        // Clear the painted pixels remaining from the previous iteration.
        line(yMin[y], min, y);
        line(max, yMax[y], y);

        yMin[y] = min;
        yMax[y] = max;
    }

    ctx.putImageData(image, 0, 0);
}

setInterval(f, 30);
