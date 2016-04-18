(function ($, PersonalityQuiz) {
    PersonalityQuiz.WheelAnimation = function (quiz, personalities, width, height, _getPath) {
        var self = this;

        // TODO (Emil): Some of these variables should probably be private.
        // NOTE (Emil): Choose the smallest if the dimensions vary, for simplicity.
        self.width = Math.min(width, height);
        self.height = Math.min(width, height);

        self.offscreen = document.createElement('canvas');

        self.offscreen.width = Math.max(self.width - 25, 500);
        self.offscreen.height = Math.max(self.height - 25, 500);
        self.secondary = self.offscreen.getContext('2d');

        self.nubArrowSize = self.width * 0.1;
        self.nubRadius = self.width * 0.06;

        self.segmentAngle = (Math.PI * 2) / (personalities.length * 2);
        self.minRotation = 6 * (Math.PI * 2) + ((3 * Math.PI) / 2) - (self.segmentAngle / 2);
        self.rotation = 0;
        self.rotationSpeed = Math.PI / 32;

        self.center = { x: self.width / 2, y: self.height / 2 };

        self.personalities = personalities;

        self.colors = {
            even: 'rgb(77, 93, 170)',
            odd:  'rgb(56, 183, 85)',
            text: 'rgb(233, 239, 247)',
            nub:  'rgb(233, 239, 247)',
            overlay: 'rgba(60, 62, 64, 0.5)',
            frame: 'rgb(60, 62, 64)'
        };

        self.images = [];

        // NOTE (Emil): Prerender the wheel.
        if (self.personalities[0].image.file) {
            load();
        } else {
            self.colors = {
                even: 'rgb(233, 239, 247)',
                odd:  'rgb(203, 209, 217)',
                text: 'rgb(60, 62, 64)',
                nub:  'rgb(77, 93, 170)',
                overlay: 'rgba(60, 62, 64, 0.4)',
                frame: 'rgb(255, 255, 255)'
            };

            drawOffscreen(self.secondary, self.personalities);
        }

        function reset () {
            self.rotation = 0;
            self.minRotation = 6 * (Math.PI * 2) + ((3 * Math.PI) / 2) - (self.segmentAngle / 2);
        };

        function getPattern (personality, index) {
            if (personality.image.pattern) {
                return personality.image.pattern;
            }

            if (index % 2 === 0) {
                return self.colors.even;
            } else {
                return self.colors.odd;
            }
        };

        function clamp (value, low, high) {
            return Math.min(Math.max(low, value), high);
        };

        function getScale (t) {
            var t = clamp(t, 0.01, 1);

            if (t < 0.3) {
                return (t / 0.3);
            } else {
                return 1 - (t / 0.3);
            }
        };

        function load () {
            var counter = 0;

            for (var i = 0; i < self.personalities.length; i++) {
                var image = new Image();
                var personality = self.personalities[i];

                image.addEventListener('load', (
                    function (personality) {
                        return function () {
                            personality.image.pattern = self.secondary.createPattern(this, 'no-repeat');
                            counter++;

                            if (counter === self.personalities.length) {
                                drawOffscreen(self.secondary, self.personalities);
                            }
                        }
                    })(personality)
                );
                image.src = _getPath(personality.image.file.path);
                self.images.push({ name: personality.name, data: image});
            }
        };

        function drawSegment (context, center, radius, fromAngle, toAngle, fillStyle) {
            context.beginPath();

            context.fillStyle = fillStyle;

            context.moveTo(center.x, center.y);
            context.arc(center.x, center.y, radius, fromAngle, toAngle, false);
            context.lineTo(center.x, center.y);

            context.fill();
            context.stroke();

            context.closePath();
        };

        function drawText (context, text, x, y, maxWidth) {
            context.fillStyle = self.colors.text;
            context.font = '24px Arial'

            context.fillText(text, x, y, maxWidth);
        };

        function drawWheel (context, rotation, canvas) {
            context.save();

            var scale = {
                x: self.width / self.offscreen.width,
                y: self.width / self.offscreen.height
            };

            context.translate(self.center.x, self.center.y);
            context.rotate(rotation);
            context.scale(scale.x, scale.y);
            context.translate(-self.offscreen.width / 2, -self.offscreen.height / 2);

            context.drawImage(canvas, 0, 0);

            context.restore();
        };

        function drawNub (context, center, radius, color) {
            context.fillStyle = color;

            context.beginPath();

            context.moveTo(self.center.x - radius, self.center.y);
            context.lineTo(self.center.x, self.center.y - self.nubArrowSize);
            context.lineTo(self.center.x + radius, self.center.y);
            context.arc(self.center.x, self.center.y, radius, 0, Math.PI * 2, false);

            context.fill();

            context.closePath();
        };

        function drawOffscreen (context, personalities) {
            context.textBaseline = 'middle';
            context.strokeStyle = self.colors.frame;

            var center = { x: self.offscreen.width / 2, y: self.offscreen.height / 2 };
            var radius = self.offscreen.width / 2 - 2;

            var length = personalities.length * 2;
            var angle = (Math.PI * 2) / length;
            var halfAngle = angle / 2;

            for (var i = 0; i < length; i++) {
                var personality = personalities[i % personalities.length];
                var pattern = getPattern(personality, i);

                var open = i * angle;
                var close = (i + 1) * angle;

                var offset = { x: 0, y: 0 };

                if (personality.image.file) {
                    offset.x = personality.image.file.width / 2;
                    offset.y = (personality.image.file.height - radius) / 2;
                }

                // NOTE (Emil): Assumes that the center of the image is the most interessting.
                context.save();

                context.translate(center.x, center.y);
                context.rotate(open + halfAngle - (Math.PI / 2));
                context.translate(-offset.x, -offset.y);

                drawSegment(
                    context,
                    {x: offset.x, y: offset.y},
                    radius,
                    (Math.PI / 2) - halfAngle,
                    (Math.PI / 2) + halfAngle,
                    pattern
                );

                context.restore();

                if (self.images.length < self.personalities.length) {
                    context.save();

                    context.translate(center.x, center.y);
                    context.rotate(open + halfAngle);
                    context.translate(-center.x, -center.y);

                    var inner = center.x + (self.nubRadius * 2);
                    var outer = center.x + radius;
                    var measure = context.measureText(personality.name);
                    var x = center.x + ((outer - inner) / 2) - (measure.width / 2);

                    drawText(
                        context,
                        personality.name,
                        center.x + (self.nubRadius * 2),
                        center.y,
                        radius - (self.nubRadius * 2.5)
                    );

                    context.restore();
                }
            }
        };

        self.attach = function (id) {
            self.onscreen = document.querySelector('#' + id);
            self.onscreen.width = self.width;
            self.onscreen.height = self.height;
            self.primary = self.onscreen.getContext('2d');
        };

        self.setTarget = function (personality) {
            reset();

            var deviation = self.segmentAngle * 0.4;
            var round = Math.floor(Math.random() + 0.5);

            for (var i = 0; i < self.personalities.length; i++) {
                if (personality.name === self.personalities[i].name) {
                    var angle = i * self.segmentAngle + (round * Math.PI);
                    var min = angle + deviation;
                    var max = angle - deviation;
                    var deviated = Math.random() * (max - min) + min;

                    self.minRotation = self.minRotation - deviated;

                    return;
                }
            }
        };

        self.draw = function (context, rotation, canvas) {
            context.clearRect(0, 0, self.onscreen.width, self.onscreen.height);

            drawWheel(context, rotation, canvas);
            drawNub(context, self.center, self.nubRadius, self.colors.nub);
        };

        self.animate = function () {
            var end, start;
            self.rotation = 0;

            function _animate (timestamp) {
                end = end ? end : timestamp;
                start = timestamp;

                var dt = (start - end) / 1000;
                var scale = 1 - (self.rotation / self.minRotation);
                var rotation = Math.max(scale * dt * self.rotationSpeed, 0.01);

                if (self.rotation < self.minRotation) {
                    self.rotation += Math.min(rotation, self.minRotation - self.rotation);

                    self.draw(self.primary, self.rotation, self.offscreen);

                    window.requestAnimationFrame(_animate);
                } else {
                    quiz.trigger('wheel-animation-end');
                }
            }

            window.requestAnimationFrame(_animate);
        };
    };
})(H5P.jQuery, H5P.PersonalityQuiz);
