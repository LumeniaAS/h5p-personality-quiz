var H5P = H5P || {};

H5P.PersonalityQuiz = (function ($) {
    function PersonalityQuiz (params, id) {
        var self = this;

        self.resultAnimation = params.resultScreen.animation;
        self.resultTitle = params.resultScreen.displayTitle;
        self.resultDescription = params.resultScreen.displayDescription;
        self.progressText = params.progressText;
        self.personalities = params.personalities;
        self.numQuestions = params.questions.length;

        self.slides = (2 + self.numQuestions);
        self.slidePercentage = 100 / self.numQuestions;

        self.loadingImages = [];

        var canvas = {
            id: 'wheel',
            width: 300,
            height: 300,
        };

        var body = document.querySelector('body');
        var animation = ((body.style.animationName !== undefined) && params.animation);

        function _getPath (path) {
            return H5P.getPath(path, id);
        }

        function classes () {
            var args = Array.prototype.slice.call(arguments);
            var classNames = 'h5p-personality-quiz';

            args.forEach(function (argument) {
                classNames += ' ' + argument;
            });

            return classNames;
        }

        function interpolate (str, variables) {
            var keys = Object.keys(variables);

            keys.forEach(function (key) {
                str = str.replace('@' + key, variables[key]);
            });

            return str;
        }

        function createButton (type, attributes) {
            var $button = $('<' + type + '>', attributes);
            $button.css('border-left', '5px solid #' + params.buttonColor);
            $button.css('background', 'linear-gradient(to right, #' + params.buttonColor + ' 50%, rgb(233, 239, 247) 50%)');
            $button.css('background-size', '200% 100%');
            $button.css('background-position', '100%');

            return $button;
        }

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
        }

        function buildCanvas () {
            var $wrapper = $('<div>', {
                'class': classes('wheel-container slide')
            });

            var $canvas = $('<canvas>', {
                'class': classes('wheel-canvas'),
                'id': canvas.id
            });

            self.$canvas = $canvas;

            $wrapper.append($canvas);
            $wrapper.hide();

            return $wrapper;
        }

        function buildQuiz (quiz, data) {
            var $container = $('<div>', { 'class': classes('container') });
            var $slides    = $('<div>', { 'class': classes('slides') });
            var $title     = buildTitleCard(quiz, data.titleScreen, data.startText);
            var $bar       = buildProgressbar();

            $slides.append($title);

            data.questions.forEach(function (question) {
                var $question = buildQuestion(quiz, question);

                $slides.append($question);
            });

            if (animation && self.resultAnimation === 'wheel') {
                var $canvas = buildCanvas();

                $slides.append($canvas);
            }

            var $result = buildResult(quiz, data.resultScreen, data.retakeText);

            $result.hide();

            $slides.append($result);
            $container.append($bar, $slides);

            quiz.$progressbar = $bar;
            quiz.$progressText = $bar.children('.progress-text');
            quiz.$wrapper = $container;
            quiz.$slides = $slides.children();
            quiz.$result = $result;

            return $container;
        }

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
        }

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
        }

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

                var deferred = $.Deferred();
                $image.on('load', function () {
                    deferred.resolve();
                });
                self.loadingImages.push(deferred.promise());

                $wrapper.append($image);
            }

            $wrapper.append($text);
            $slide.append($wrapper);

            var images = false;
            question.answers.forEach(function (answer) { images = images || answer.image.file !== undefined; });

            if (images) {
                var $imageAnswer = buildImageAnswer(question.answers, quiz.answerListener);
                $slide.append($imageAnswer);
            } else {
                var $answer = buildAnswer(question.answers, quiz.answerListener);
                $slide.append($answer);
            }

            return $slide;
        }

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
        }

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
        }

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

            self.$resultWrapper = $wrapper;
            $result.append($button);
            $result.append($wrapper);

            return $result;
        }

        function attach ($container) {
            self.loadingImages = [];
            self.reset();

            var $quiz = buildQuiz(self, params);

            $container.append($quiz);

            // NOTE (Emil): Wait for images to load, if there are any.
            // If there aren't any images to wait for this function is called immediately.
            $.when.apply(null, self.loadingImages).done(function () {
                var height = 0;

                self.$slides.each(function () {
                    if (this.clientHeight > height)
                    {
                        height = this.clientHeight;
                    }
                });

                $quiz.height(height);

                if (animation && params.resultScreen.animation === 'wheel') {
                    canvas.width = $container.width() * 0.8;
                    canvas.height = $container.height();

                    self.wheel = new PersonalityQuiz.WheelAnimation(
                        self,
                        self.personalities,
                        canvas.width,
                        canvas.height,
                        _getPath
                    );
                }
            });
        }

        self.attach = function ($container) {
            if (self.$container === undefined) {
                self.$container = $container;

                attach(self.$container);
            }
        };

        self.setResult = function (personality) {
            if (self.$canvas) {
                self.wheel.attach(canvas.id);
                self.wheel.setTarget(personality);
                self.wheel.animate();
            }

            if (personality.image && personality) {
                var path = _getPath(personality.image.file.path);

                self.$result.css('background-image', 'url(' + path + ')');
                self.$result.addClass('background');
            }

            var showResult = self.resultTitle || self.resultDescription;

            if (showResult) {
                var $personality = $('<div>', { 'class': classes('personality') });

                if (self.resultTitle) {
                    var $title = $('<h2>', { 'html': personality.name });
                    $personality.append($title);
                }

                if (self.resultDescription) {
                    var $description = $('<p>', { 'html': personality.description });
                    $personality.append($description);
                }

                self.$resultWrapper.prepend($personality);
            }
        };

        self.calculatePersonality = function () {
            var self = this;

            var max = self.personalities[0].count;
            var index = 0;

            self.personalities.forEach(function (personality, i) {
                if (max < personality.count) {
                    max = personality.count;
                    index = i;
                }
            });

            return self.personalities[index];
        };

        self.updateProgress = function (index) {
            var percentage = 100 - (self.index - 1) * self.slidePercentage;
            self.$progressbar.css('background-position', String(percentage) + '%');

            var text = interpolate(self.progressText, {
                'question': index,
                'total': self.numQuestions
            });

            self.$progressText.html(text);
        };

        self.next = function () {
            self.$slides.eq(self.index).hide();
            self.$slides.eq(self.index + 1).show();

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

                answers.forEach(function (answer) {
                    self.personalities.forEach(function (personality) {
                        if (personality.name === answer) {
                            personality.count++;
                        }
                    });
                });
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
            attach(self.$container);
        });
    }

    PersonalityQuiz.prototype = Object.create(H5P.EventDispatcher.prototype);
    PersonalityQuiz.prototype.constructor = PersonalityQuiz;

    return PersonalityQuiz;
})(H5P.jQuery);
