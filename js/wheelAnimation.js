var H5P = H5P || {};

(function ($, PersonalityQuiz) {
    PersonalityQuiz.WheelAnimation = function (quiz, personalities, width, height, _getPath) {
        var self = this;

        // TODO (Emil): Some of these variables should probably be private.
        // NOTE (Emil): Choose the smallest if the dimensions vary, for simplicity.
        var side = Math.min(width, height);
        var min = 320;
        var max = 800;

        self.width = clamp(side, min, max);
        self.height = clamp(side, min, max);

        self.offscreen = document.createElement('canvas');

        self.offscreen.width = Math.max(self.width - 25, 500);
        self.offscreen.height = Math.max(self.height - 25, 500);
        self.offscreen.context = self.offscreen.getContext('2d');

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

            drawOffscreen(self.offscreen.context, self.personalities);
        }

        function clamp (value, low, high) {
            return Math.min(Math.max(low, value), high);
        }


        function reset () {
            self.rotation = 0;
            self.minRotation = 6 * (Math.PI * 2) + ((3 * Math.PI) / 2) - (self.segmentAngle / 2);
        }

        function getPattern (personality, index) {
            if (personality.image.pattern) {
                return personality.image.pattern;
            }

            if (index % 2 === 0) {
                return self.colors.even;
            } else {
                return self.colors.odd;
            }
        }

        function load () {
            self.loadingImages = [];

            self.personalities.forEach(function (personality) {
                var image = new Image();
                var deferred = $.Deferred();

                image.addEventListener('load', function () {
                    personality.image.pattern = self.offscreen.context.createPattern(this, 'no-repeat');
                    deferred.resolve();
                });

                image.src = _getPath(personality.image.file.path);
                self.images.push({ name: personality.name, data: image });
                self.loadingImages.push(deferred);
            });

            // NOTE(Emil): When all the images are loaded we can prerender the offscreen buffer.
            $.when.apply(null, self.loadingImages).done(function () {
                drawOffscreen(self.offscreen.context, self.personalities);
            });
        }

        function drawSegment (context, center, radius, fromAngle, toAngle, fillStyle) {
            context.beginPath();

            context.fillStyle = fillStyle;

            context.moveTo(center.x, center.y);
            context.arc(center.x, center.y, radius, fromAngle, toAngle, false);
            context.lineTo(center.x, center.y);

            context.fill();
            context.stroke();

            context.closePath();
        }

        function drawText (context, text, x, y, maxWidth) {
            context.fillStyle = self.colors.text;
            context.font = '24px Arial';

            context.fillText(text, x, y, maxWidth);
        }

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
        }

        function drawNub (context, center, radius, color) {
            context.fillStyle = color;

            context.beginPath();

            context.moveTo(self.center.x - radius, self.center.y);
            context.lineTo(self.center.x, self.center.y - self.nubArrowSize);
            context.lineTo(self.center.x + radius, self.center.y);
            context.arc(self.center.x, self.center.y, radius, 0, Math.PI * 2, false);

            context.fill();

            context.closePath();
        }

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
                var offset = { x: 0, y: 0 };

                if (personality.image.file) {
                    offset.x = personality.image.file.width / 2;
                    offset.y = (personality.image.file.height - radius) / 2;
                }

                // NOTE (Emil): Assumes that the center of the image is the most interesting.
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

                // NOTE (Emil): Draw the personality name if there are no images.
                if (self.images.length < self.personalities.length) {
                    context.save();

                    context.translate(center.x, center.y);
                    context.rotate(open + halfAngle);
                    context.translate(-center.x, -center.y);

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
        }

        self.attach = function (canvasElement) {
            self.onscreen = canvasElement;
            self.onscreen.width = self.width;
            self.onscreen.height = self.height;
            self.onscreen.context = self.onscreen.getContext('2d');
        };

        self.setTarget = function (targetPersonality) {
            reset();

            var deviation = self.segmentAngle * 0.4;
            var round = Math.floor(Math.random() + 0.5);

            self.personalities.forEach(function (personality, index) {
                if (targetPersonality.name === personality.name) {
                    var angle = index * self.segmentAngle + (round * Math.PI);
                    var min = angle + deviation;
                    var max = angle - deviation;
                    var deviated = Math.random() * (max - min) + min;

                    self.minRotation = self.minRotation - deviated;

                    return;
                }
            });
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

                    self.draw(self.onscreen.context, self.rotation, self.offscreen);

                    window.requestAnimationFrame(_animate);
                } else {
                    quiz.trigger('wheel-animation-end');
                }
            }

            window.requestAnimationFrame(_animate);
        };
    };
})(H5P.jQuery, H5P.PersonalityQuiz);
