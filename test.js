var originTime = new Date();

// if you use var, time will be cleared when card is flipped; if you use const or let, the time will persist. BTW?

function showTime() {
    var currentTime = new Date();
    var distance = currentTime - originTime;

//var days = Math.floor(distance / (1000 * 60 * 60 * 24));
//var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);
    var milliseconds = Math.floor((distance % 1000) / 10);

    function addZeroString(num, compensation = 2) {
        var multiplier = compensation - num.toString().length;
        return "0".repeat(multiplier) + num;
    }

    minutes = addZeroString(minutes);
    seconds = addZeroString(seconds);
    milliseconds = addZeroString(milliseconds);

    if (minutes === "00") {
        var timeString = seconds + ":" + milliseconds;
    } else {
        var timeString = minutes + ":" + seconds + ":" + milliseconds;
    }

    document.getElementById("clock").innerText = timeString;
}

setInterval(showTime, 10);

// back template

var transitionTimeFromDimToShow = 1.5, transitionTimeFromShowToDim = 2;
var stayTimeAtDim = 1.5, stayTimeAtShow = 1;

function logger(message) {
    document.getElementById("log").innerHTML += message;
}

function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    elmnt.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

dragElement(document.getElementById("clock"));

var syn = document.getElementById('synonym').innerText;
if (syn === "") {
    document.getElementById("synonym").style.display = "none";
}

var similar_words = document.getElementById('similar_words').innerText;
if (similar_words === "") {
    document.getElementById("similar").style.display = "none";
} else {
    var ifSimilarWordsShowed = false; // We choose to implement the bool in the script rather than in the DOM attribute to save computing power
    var hintTextToShow = "Click to show";

    similar_words_button = document.getElementById("similar_words");
    similar_words_button.innerText = hintTextToShow;

    function showSimilarWords() { // this function also hide similar words when double-clicked.
        if (ifSimilarWordsShowed === false) { // if false is the state before the click
            similar_words_button.innerText = similar_words;
            similar_words_button.removeAttribute("onclick");
            similar_words_button.setAttribute("ondblclick", "showSimilarWords()");
            similar_words_button.setAttribute("title", "Double click to hide");
            similar_words_button.removeAttribute("similarHide");

            ifSimilarWordsShowed = !ifSimilarWordsShowed;
        } else if (ifSimilarWordsShowed === true) {
            window.getSelection().removeAllRanges();

            similar_words_button.innerText = hintTextToShow;
            similar_words_button.removeAttribute("ondblclick");
            similar_words_button.removeAttribute("title");
            similar_words_button.setAttribute("similarHide", ""); // see CSS
            similar_words_button.setAttribute("onclick", "showSimilarWords()");

            ifSimilarWordsShowed = !ifSimilarWordsShowed;
        }
    }

    similar_words_button.setAttribute("showSimilar", "false");
    similar_words_button.setAttribute("onclick", "showSimilarWords()");
}

//Get the button:
mybutton = document.getElementById("myBtn");
topline = document.getElementById("answer");

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function () {
    scrollFunction()
};

function scrollFunction() {
    if (document.body.scrollTop > topline.offsetTop || document.documentElement.scrollTop > topline.offsetTop) {
        mybutton.style.display = "block";
    } else {
        mybutton.style.display = "none";
    }
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
    document.body.scrollTop = topline.offsetTop; // For Safari
    document.documentElement.scrollTop = topline.offsetTop; // For Chrome, Firefox, IE and Opera
}

var clock = document.getElementById("clock");
clock.style.position = "fixed";
clock.style.transform = "translateX(-50%)"; //this is magic
clock.style.left = "50%";
clock.style.bottom = "6px";
clock.style.cursor = "move";
clock.style.margin = "0px";

function directChildString(element) {
    return element.childNodes[0].nodeValue
}

var abortController = null;
var ifTerminated = true;

function clockStyleBreathe() {

    function transferToShow() {
        clock.style.setProperty("transition-duration", transitionTimeFromDimToShow + "s");
        clock.style.background = "rgba(0, 0, 0, 0.75)";
        clock.style.color = "rgba(23, 212, 254, 0.75)";
    }

    function transferToDim() {
        clock.style.setProperty("transition-duration", transitionTimeFromShowToDim + "s");
        clock.style.background = "rgba(0, 0, 0, 0.5)";
        clock.style.color = "rgba(23, 212, 254, 0.5)";
    }

    function transLooper() {
        new Promise(resolve => {
            setTimeout(() => {
                transferToShow();
                resolve();
            }, (transitionTimeFromShowToDim + stayTimeAtDim) * 1000);
        }).then(() => {
            return new Promise(resolve => {
                setTimeout(() => {
                    transferToDim();
                    resolve();
                }, (transitionTimeFromDimToShow + stayTimeAtShow) * 1000);
            })
        }).then(() => {
            transLooper();
        })
    }

    function transLooperTerminable(abortSignal) {

        function constructPromiseWithTimeout(f, time, abortSignal) {
            return new Promise((resolve, reject) => {
                var timeout = setTimeout(() => {
                    f();
                    resolve();
                }, time);

                abortSignal.addEventListener('abort', () => {
                    clearTimeout(timeout);
                    reject(new Error(""));
                })
            })
        }

        return constructPromiseWithTimeout(transferToShow,
            (transitionTimeFromShowToDim + stayTimeAtDim) * 1000,
            abortSignal).then(() => {
            return constructPromiseWithTimeout(transferToDim,
                (transitionTimeFromDimToShow + stayTimeAtShow) * 1000,
                abortSignal)
        })
    }

    async function startTransLooper() {
        if (!abortController) {
            abortController = new AbortController();
        }
        try {
            await transLooperTerminable(abortController.signal);
            await startTransLooper();
        } catch {
            abortController = null;
            ifTerminated = true
        }
    }

    dimClock();
    terminator();

    /*
        The following Promise is necessary because terminator() takes time to call catch {}, and thus abortController = null
        is also delayed; if at this very time there is another call to clockStyleBreathe(), an uncontrollable transLooperTerminable(abortController)
        will be created as the abortController passed to the function is the controller of the old one which is no longer valid.
        Note abortController = new AbortController() will not be executed if abortController is not set to null.

        The racing bug:
        when move the clock to text and then another text and finally to white space by scroll.
        is thus solved.
    */
    new Promise(resolve => {
        function check() {
            if (ifTerminated) {
                resolve();
            }
        }

        setInterval(check, 10);
    }).then(() => {
        startTransLooper();
        ifTerminated = false;
    })
}

function terminator() {
    if (abortController) {
        abortController.abort();
    }
}

function ifCovered() { //TODO optimise this function.
    var rect = clock.getBoundingClientRect();

    var top = rect.top;
    var centerH = (rect.left + rect.right) / 2;
    var centerV = (rect.top + rect.bottom) / 2;
    var bottom = rect.bottom;

    var tolerateDegree = -7; // if it is larger than 0, the tolerable area is larger.

    if (tolerateDegree <= 0) {
        clock.style.setProperty("pointer-events", "none");
    }
    var elementCoveredUp = document.elementFromPoint(centerH, top - tolerateDegree); //(x,y)
    var elementCoveredDown = document.elementFromPoint(centerH, bottom + tolerateDegree);
    var elementCoveredLeft = document.elementFromPoint(rect.left - tolerateDegree, centerV);
    var elementCoveredRight = document.elementFromPoint(rect.right + tolerateDegree, centerV);
    if (tolerateDegree <= 0) {
        clock.style.setProperty("pointer-events", "auto");
    }

    return elementCoveredUp.tagName === "LI" ||
        elementCoveredDown.tagName === "LI" ||
        elementCoveredLeft.tagName === "LI" ||
        elementCoveredRight.tagName === "LI";
}

function checker() {
    if (ifCovered()) {
        clockStyleBreathe();
    } else {
        terminator();
        showClock();
    }
}

var isScrolling;

function scrollStop() {
    clearTimeout(isScrolling);
    isScrolling = setTimeout(checker, 100);
}

window.addEventListener("scroll", scrollStop);

/*
It is important to put the following two statements after the event listener. Because anki will scroll the page down
to <hr id=answer>. If they are put before the listener, if there is breath effect is activated (there is text) before
the scroll and there is no text after the scroll, the clock will mistakenly keep on breathe since there is no listener and
the checker is not called again to update the state.
*/
terminator();
checker();

function mouserOverClock() {
    terminator();
    showClock();
}

function mouserOutClock() {
    checker();
}

function showClock(duration = 1) {
    clock.style.setProperty("transition-duration", duration + "s");
    clock.style.background = "rgba(0, 0, 0, 1)";
    clock.style.color = "rgba(23, 212, 254, 1)";
}

function dimClock(duration = 1) {
    clock.style.setProperty("transition-duration", duration + "s");
    clock.style.background = "rgba(0, 0, 0, 0.5)";
    clock.style.color = "rgba(23, 212, 254, 0.5)";
}

function findExampleSentences() {
    return document.querySelectorAll(".examples > li")
}

function findHighlights() {
    return document.querySelectorAll("span[style*=\"background-color\"]")
}

function getRandomInt(max, min = 0) {
    min = Math.ceil(min);
    max = Math.floor(max) + 1;
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

function randomSelect(list, size = 1) {
    return list[getRandomInt(list.length - 1)]
}

function isScrollbarVisible(element) {
    return element.scrollHeight > element.clientHeight;
}

// random example sentences
var exampleSentences = findExampleSentences()
if (exampleSentences.length > 0) {
    randomExampleSentence = randomSelect(findExampleSentences())
    randomExampleSentence.style.boxDecorationBreak = "clone"
    randomExampleSentence.style.webkitBoxDecorationBreak = "clone"
    randomExampleSentence.style.lineHeight = "1.2"
    randomExampleSentence.style.background = "#f28482"
    randomExampleSentence.style.borderRadius = "8px"
    randomExampleSentence.style.textShadow = "none"
    randomExampleSentence.style.color = "black"

    if (isScrollbarVisible(document.documentElement)) {
        jumpToExampleButton = document.createElement("div")
        jumpToExampleButton.style.display = "inline-block"
        jumpToExampleButton.style.borderRadius = "100%"
        jumpToExampleButton.style.cursor = "pointer"
        jumpToExampleButton.style.padding = "0.6rem"
        jumpToExampleButton.style.backgroundColor = "#f28482"
        jumpToExampleButton.style.position = "fixed"
        jumpToExampleButton.style.right = "5px"
        jumpToExampleButton.style.top = "10%"

        var position = randomExampleSentence.getBoundingClientRect()
        if (randomExampleSentence.querySelectorAll("img").length > 0) {
            if (position.top < 0) {
                setTimeout(() => {
                    randomExampleSentence.scrollIntoView({block: "start", inline: "nearest", behavior: "smooth"})
                }, 100)
            }

            jumpToExampleButton.addEventListener("click", () => {
                randomExampleSentence.scrollIntoView({block: "start", inline: "nearest", behavior: "smooth"})
            })
        } else {
            if (position.top < 0 || position.bottom > window.innerHeight) {
                setTimeout(() => {
                    randomExampleSentence.scrollIntoView({block: "center", inline: "nearest", behavior: "smooth"})
                }, 100)
            }

            jumpToExampleButton.addEventListener("click", () => {
                randomExampleSentence.scrollIntoView({block: "center", inline: "nearest", behavior: "smooth"})
            })
        }

        mybutton.parentNode.insertBefore(jumpToExampleButton, mybutton)
    }
}

// navigator
if (isScrollbarVisible(document.documentElement)) {
    highLights = findHighlights()
    if (highLights.length > 1) {
        var index = 0

        navigatorButton = document.createElement("div")
        navigatorButton.style.position = "fixed"
        navigatorButton.style.left = "5px"
        navigatorButton.style.bottom = "50%"
        navigatorButton.style.display = "flex"
        navigatorButton.style.flexDirection = "column"

        upArrow = document.createElement("div")
        upArrow.style.backgroundColor = "rgb(255, 170, 0)"
        upArrow.style.borderRadius = "100%"
        upArrow.style.display = "inline-block"
        upArrow.style.cursor = "pointer"
        upArrow.style.marginBottom = "3px"
        upArrow.style.padding = "0.6rem"

        upArrow.addEventListener("click", () => {
            highLights[index].scrollIntoView({block: "center", inline: "nearest", behavior: "smooth"})
            index--
            if (index < 0) {
                index = highLights.length - 1
            }
        })

        downArrow = document.createElement("div")
        downArrow.style.backgroundColor = "rgb(255, 170, 0)"
        downArrow.style.borderRadius = "100%"
        downArrow.style.display = "inline-block"
        downArrow.style.cursor = "pointer"
        downArrow.style.padding = "0.6rem"

        downArrow.addEventListener("click", () => {
            highLights[index].scrollIntoView({block: "center", inline: "nearest", behavior: "smooth"})
            index++
            if (index > highLights.length - 1) {
                index = 0
            }
        })

        navigatorButton.insertBefore(upArrow, null)
        navigatorButton.insertBefore(downArrow, null)
        mybutton.parentNode.insertBefore(navigatorButton, mybutton)
    } else if (highLights.length === 1) {
        navigatorButton = document.createElement("div")

        navigatorButton.style.display = "inline-block"
        navigatorButton.style.position = "fixed"
        navigatorButton.style.left = "5px"
        navigatorButton.style.bottom = "50%"
        navigatorButton.style.cursor = "pointer"
        navigatorButton.style.padding = "0.6rem"

        navigatorButton.style.backgroundColor = "rgb(255, 170, 0)"
        navigatorButton.style.borderRadius = "100%"

        navigatorButton.addEventListener("click", () => {
            highLights[0].scrollIntoView({block: "center", inline: "nearest"})
        })

        mybutton.parentNode.insertBefore(navigatorButton, mybutton)
    }
}