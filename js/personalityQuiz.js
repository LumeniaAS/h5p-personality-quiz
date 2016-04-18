var H5P = H5P || {};

H5P.PersonalityQuiz = (function ($) {
    // Array.find polyfill
    if (!Array.prototype.find) {
        Array.prototype.find = function(predicate) {
            if (this === null) {
                throw new TypeError('Array.prototype.find called on null or undefined');
            }
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }

            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            var value;

            for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
            }
            return undefined;
        };
    }

    function PersonalityQuiz (params, id) {
        var animation = (
            document.querySelector('body').style.animationName !== undefined
        ) && params.animation;

        function _getPath (path) {
            return H5P.getPath(path, id);
        };

        function classes () {
            classNames = 'h5p-personality-quiz';

            for (var i = 0; i < arguments.length; i++)
            {
                classNames += ' ' + arguments[i];
            }

            return classNames;
        };

        function interpolate (str, variables) {
            for (var property in variables) {
                if (!variables.hasOwnProperty(property)) continue;
                str = str.replace('@' + property, variables[property]);
            }

            return str;
        };

        function createButton (type, attributes) {
            var $button = $('<' + type + '>', attributes);
            $button.css('border-left', '5px solid #' + params.buttonColor);
            $button.css('background', 'linear-gradient(to right, #' + params.buttonColor + ' 50%, rgb(233, 239, 247) 50%)');
            $button.css('background-size', '200% 100%');
            $button.css('background-position', '100%');

            return $button;
        };

        function addButtonListener ($element, listener) {
            if (animation) {
                $element.click(function () {
                    $(this).addClass('button-animate');
                });
                $element.on('animationend', function () {
                    $(this).removeClass('button-animate');
                    listener();
                });
            } else {
                $element.click(function () {
                    listener();
                });
            }
        };

        function buildCanvas () {
            $wrapper = $('<div>', {
                'class': classes('wheel-container slide')
            });

            $canvas = $('<canvas>', {
                'class': classes('wheel-canvas'),
                'id': canvas.id
            });

            self.$canvas = $canvas;

            $wrapper.append($canvas);
            $wrapper.hide();

            return $wrapper;
        };

        function buildQuiz (quiz, data) {
            var $container = $('<div>', { 'class': classes('container') });
            var $slides    = $('<div>', { 'class': classes('slides') });
            var $title     = buildTitleCard(quiz, data.titleScreen, data.startText);
            var $bar       = buildProgressbar();

            $slides.append($title);

            data.questions.forEach(function (question) {
                var $question = buildQuestion(quiz, question);
                $question.hide();

                $slides.append($question);
            });

            if (animation && self.resultAnimation === 'wheel') {
                $canvas = buildCanvas();

                $slides.append($canvas);
            }

            var $result = buildResult(quiz, data.resultScreen, data.retakeText);
            $result.hide();

            $slides.append($result);
            $container.append($bar, $slides);

            quiz.$progressbar = $bar;
            quiz.$progressText = $bar.children('.progress-text');
            quiz.$wrapper = $container;
            quiz.$slides = $slides;
            quiz.$result = $result;

            return $container
        };

        function buildProgressbar () {
            var $bar = $('<div>', { 'class': classes('progressbar') });
            $bar.css('background', 'linear-gradient(to right, #' + params.progressbarColor + ' 50%, rgb(60, 62, 64) 50%)');
            $bar.css('background-size', '200% 100%');
            $bar.css('background-position', '100%');
            $bar.hide();

            var $text = $('<p>', { 'class': classes('progress-text') });

            if (animation) {
                $bar.css('transition', 'background-position 1s');
            }

            $bar.append($text);

            return $bar;
        };

        function buildTitleCard (quiz, data, startText) {
            var $card = $('<div>', { 'class': classes('title-card', 'slide', 'background') });
            var $content = $('<div>', { 'class': classes('title-card-wrapper') });
            var $title = $('<h2>', {
                html: data.title.text,
                'class': classes('title')
            });

            var path = _getPath(data.image.file.path);

            $card.css('background-image', 'url(' + path + ')');

            var $wrapper = $('<div>', { 'class': classes('start-button-wrapper') });
            var $startButton = createButton('button', {
                'class': classes('start-button', 'button'),
                'html': startText
            });
            addButtonListener($startButton, function () {
                quiz.trigger('personality-quiz-start');
            });

            $wrapper.append($startButton);
            $content.append($title, $wrapper);
            $card.append($content);

            return $card;
        };

        function buildQuestion (quiz, question) {
            var $slide = $('<div>', { 'class': classes('quiz', 'slide' ) });
            var $wrapper = $('<div>', { 'class': classes('question') });
            var $text = $('<h2>', {
                'class': classes('question-text'),
                'html': question.text
            });

            if (question.image.file) {
                var path = _getPath(question.image.file.path);

                var $image = $('<img>', {
                    'class': classes('question-image'),
                    'src': path
                });
                $wrapper.append($image);
            }

            $wrapper.append($text);
            $slide.append($wrapper);

            var images = false;
            question.answers.forEach(function (answer) { images = images || answer.image.file !== undefined });

            if (images) {
                var $imageAnswer = buildImageAnswer(question.answers, quiz.answerListener);
                $slide.append($imageAnswer);
            } else {
                var $answer = buildAnswer(question.answers, quiz.answerListener);
                $slide.append($answer);
            }

            return $slide;
        };

        function buildImageAnswer (answers, listener) {
            var $wrapper  = $('<div>', { 'class': classes('answers-wrapper') });
            var $answers  = $('<ul>',  { 'class': classes('answers')         });
            $answers.click(listener);

            answers.forEach(function (answer) {
                var $answer = $('<li>', {
                    'class': classes('answer-container'),
                    'data-personality': answer.personality
                });
                var $button = createButton('div', {
                    'class': classes('button', 'answer-button'),
                    'html': answer.text
                });

                var path = _getPath(answer.image.file.path);
                var $image = $('<div>', {
                    'class': classes('answer-image'),
                });
                $image.css('background-image', 'url(' + path + ')');

                $answer.append($image, $button);
                $answers.append($answer);
            });

            $wrapper.append($answers);

            return $wrapper;
        };

        function buildAnswer (answers, listener) {
            var $wrapper  = $('<div>', { 'class': classes('answers-wrapper') });
            var $answers  = $('<ul>',  { 'class': classes('answers')         });
            $answers.click(listener);

            answers.forEach(function (answer) {
                var $answer = createButton('li', {
                    'data-personality': answer.personality,
                    'class': classes('button', 'answer'),
                    'html': answer.text
                });

                $answers.append($answer);
            });

            $wrapper.append($answers);

            return $wrapper;
        };

        function buildResult (quiz, data, retakeText) {
            var $result = $('<div>', { 'class': classes('result', 'slide') });
            var $wrapper = $('<div>', { 'class': classes('personality-wrapper') });

            var $button = createButton('button', {
                'html': retakeText,
                'class': classes('button', 'retake-button')
            });

            addButtonListener($button, function () {
                quiz.trigger('personality-quiz-restart');
            });

            $wrapper.append($button);
            $result.append($wrapper);

            return $result;
        };

        var self = this;

        self.resultAnimation = params.resultScreen.animation;
        self.resultTitle = params.resultScreen.displayTitle;
        self.resultDescription = params.resultScreen.displayDescription;
        self.progressText = params.progressText;
        self.personalities = params.personalities;
        self.numQuestions = params.questions.length;

        self.slides = (2 + self.numQuestions);
        self.slideWidth = 100 / self.slides;
        self.length = 100 / self.numQuestions;

        var canvas = {
            id: 'wheel',
            size: 300
        };

        self.attach = function ($container) {
            var self = this;

            if (self.$container === undefined) {
                self.$container = $container;

                canvas.size = $container.width() * 0.8;

                if (animation && params.resultScreen.animation === 'wheel') {
                    self.wheel = new PersonalityQuiz.WheelAnimation(self, self.personalities, canvas.size, canvas.size, _getPath);
                }

                var $quiz = buildQuiz(self, params);

                $container.append($quiz);

                self.reset();
            }
        };

        self.setResult = function (personality) {
            if (self.$canvas) {
                var wheel = self.wheel;
                wheel.attach(canvas.id);
                wheel.setTarget(personality);

                self.wheel.animate();
            }

            if (personality.image && personality) {
                var path = _getPath(personality.image.file.path);

                self.$result.css('background-image', 'url(' + path + ')');
                self.$result.addClass('background');
            }

            var showResult = self.resultTitle || self.resultDescription;

            if (showResult) {
                $personality = $('<div>', { 'class': classes('personality') });

                if (self.resultTitle) {
                    $title = $('<h2>', { 'html': personality.name });
                    $personality.append($title);
                }

                if (self.resultDescription) {
                    $description = $('<p>', { 'html': personality.description });
                    $personality.append($description);
                }

                self.$result.prepend($personality);
            }
        }

        self.calculatePersonality = function () {
            var self = this;

            var max = self.personalities[0].count;
            var index = 0;
            for (var i = 1; i < self.personalities.length; i++) {
                if (max < self.personalities[i].count) {
                    max = self.personalities[i].count;
                    index = i;
                }
            }

            return self.personalities[index];
        };

        self.updateProgress = function (index) {
            var percentage = 100 - (self.index - 1) * self.length;
            self.$progressbar.css('background-position', String(percentage) + '%');

            var text = interpolate(self.progressText, {
                'question': index,
                'total': self.numQuestions
            });

            self.$progressText.html(text);
        };

        self.next = function (event) {
            var $slides = self.$slides.children();
            $slides.eq(self.index).hide();
            $slides.eq(self.index + 1).show();

            self.index += 1;

            if (self.index > 0) {
                self.updateProgress(self.index);
            }

            if (self.index === self.numQuestions + 1) {
                self.trigger('personality-quiz-completed');
            }
        };

        self.answerListener = function (event) {
            var $target = $(event.target);
            var container = $target.parent().hasClass('answer-container');

            if (container) {
                $target = $target.parent();
            }

            var $button = container ? $target.children('.answer-button') : $target;
            var personalities = $target.attr('data-personality');

            if (personalities) {
                if (animation) {
                    $button.addClass('button-animate');
                    $button.on('animationend', function () {
                        $(this).removeClass('button-animate');
                        self.trigger('personality-quiz-answer', personalities);
                    });
                } else {
                    self.trigger('personality-quiz-answer', personalities);
                }

                $target.parent('.answers').off('click');
            }
        };

        self.straightToResult = function ($container, parmas) {
            self.$result = buildResult(self, params.resultScreen, params.retakeText);

            self.$wrapper = $('div', { 'class': classes('container') });

            self.$wrapper.append(self.$slides);
            self.$container.append(self.$progressbar, self.$wrapper);
            self.$progressbar = $('<div>');

            self.$container.append(self.$wrapper);

            self.trigger('personality-quiz-completed');
        };

        self.reset = function () {
            self.personalities.map(function (e) { e.count = 0; });
            self.index = 0;
        };

        self.on('personality-quiz-start', function () {
            self.$progressbar.show();
            self.next();
        });

        self.on('personality-quiz-answer', function (event) {
            if (event !== undefined && event.data !== undefined) {
                var answers = event.data.split(', ');

                for (var i = 0; i < answers.length; i++) {
                    self.personalities.forEach(function (element, index) {
                        if (element.name == answers[i]) {
                            element.count++;
                        }
                    });
                }
            }

            self.next();
        });

        self.on('personality-quiz-completed', function () {
            self.$progressbar.hide();

            var personality = self.calculatePersonality();
            self.setResult(personality);

            if (animation && self.resultAnimation === 'fade-in') {
                self.$result.addClass('fade-in');
            }
        });

        self.on('wheel-animation-end', function () {
            setTimeout(function () {
                self.$canvas.addClass('fade-out');
            }, 500);
            self.$canvas.on('animationend', self.next);
        });

        self.on('personality-quiz-restart', function () {
            self.$container.empty();

            var $quiz = buildQuiz(self, params);
            self.$container.append($quiz);

            self.reset();
        });
    };

    PersonalityQuiz.prototype = Object.create(H5P.EventDispatcher.prototype);
    PersonalityQuiz.prototype.constructor = PersonalityQuiz;

    return PersonalityQuiz;
})(H5P.jQuery);
