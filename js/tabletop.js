var canvas = null;
var canvasCtx = null;
var animationRunning = false;
var animatedDiceGroup = null;
var lastDiceAnimation = null;

var simulation = null;

function log(msg) {
	document.getElementById("log").innerHTML += "<p>"+ msg +"</p>";
}

function init(canvasId, configUrl) {
	// Init access to the canvas
	canvas = document.getElementById(canvasId);
	canvasCtx = canvas.getContext("2d");

	// Load the configuration
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function()
	{
		if (xhr.readyState === 4) {
			if (xhr.status === 200) {
				simulation = JSON.parse(xhr.responseText);
				loadImages();
			} else {
				log("Error while loading the configuration : "+ xhr.status);
			}
		}
	};
	xhr.open("GET", configUrl, true);
	xhr.send();
}

function loadImages() {
	var src = simulation.board.img;
	simulation.board.img = new Image();
	simulation.board.img.addEventListener("load", waitLoad, false);
	simulation.board.img.src = src;

	var i;
	for (i = 0; i < simulation.pieces.length; ++i) {
		src = simulation.pieces[i].img;
		simulation.pieces[i].img = new Image();
		simulation.pieces[i].img.addEventListener("load", waitLoad, false);
		simulation.pieces[i].img.src = src;
	}

	for (i = 0; i < simulation.decks.length; ++i) {
		src = simulation.decks[i].img;
		simulation.decks[i].img = new Image();
		simulation.decks[i].img.addEventListener("load", waitLoad, false);
		simulation.decks[i].img.src = src;

		var j;
		for (j = 0; j < simulation.decks[i].composition.length; ++j) {
			src = simulation.decks[i].composition[j].img;
			simulation.decks[i].composition[j].img = new Image();
			simulation.decks[i].composition[j].img.addEventListener("load", waitLoad, false);
			simulation.decks[i].composition[j].img.src = src;
		}
	}

	for (i = 0; i < simulation.diceGroups.length; ++i) {
		src = simulation.diceGroups[i].img;
		simulation.diceGroups[i].img = new Image();
		simulation.diceGroups[i].img.addEventListener("load", waitLoad, false);
		simulation.diceGroups[i].img.src = src;

		var j;
		for (j = 0; j < simulation.diceGroups[i].dices.length; ++j) {
			var h;
			for (h = 0; h < simulation.diceGroups[i].dices[j].values.length; ++h) {
				src = simulation.diceGroups[i].dices[j].values[h].img;
				simulation.diceGroups[i].dices[j].values[h].img = new Image();
				simulation.diceGroups[i].dices[j].values[h].img.addEventListener("load", waitLoad, false);
				simulation.diceGroups[i].dices[j].values[h].img.src = src;
			}
		}
	}
}

function waitLoad() {
	var fullyLoaded = true;

	if (! simulation.board.img.complete) {
		fullyLoaded = false;
	}else {
		simulation.board.img.removeEventListener("load", waitLoad, false);
	}

	var i;
	for (i = 0; i < simulation.pieces.length; ++i) {
		if (! simulation.pieces[i].img.complete) {
			fullyLoaded = false;
		}else {
			simulation.pieces[i].img.removeEventListener("load", waitLoad, false);
		}
	}

	for (i = 0; i < simulation.decks.length; ++i) {
		var d = simulation.decks[i];
		if (! d.img.complete) {
			fullyLoaded = false;
		}else {
			d.img.removeEventListener("load", waitLoad, false);
		}

		var j;
		for (j = 0; j < d.composition.length; ++j) {
			if (! d.composition[j].img.complete) {
				fullyLoaded = false;
			}else {
				d.composition[j].img.removeEventListener("load", waitLoad, false);
			}
		}
	}

	for (i = 0; i < simulation.diceGroups.length; ++i) {
		var g = simulation.diceGroups[i];
		if (! g.img.complete) {
			fullyLoaded = false;
		}else {
			g.img.removeEventListener("load", waitLoad, false);
		}

		var j;
		for (j = 0; j < g.dices.length; ++j) {
			var d = g.dices[j];
			var h;
			for (h = 0; h < d.values.length; ++h) {
				var v = d.values[h];
				if (! v.img.complete) {
					fullyLoaded = false;
				}else {
					v.img.removeEventListener("load", waitLoad, false);
				}
			}
		}
	}

	if (fullyLoaded) {
		loaded();
	}
}

function loaded() {
	// Finish rendering setup
	canvas.width = simulation.board.img.width;
	canvas.height = simulation.board.img.height;
	canvas.addEventListener("mousedown", canvasMouseDown, false);
	canvas.addEventListener("mouseup", canvasMouseUp, false);
	canvas.addEventListener("mousemove", canvasMouseMove, false);

	// Show the initial state
	render();
}

function getCanvasPos() {
	var rect = canvas.getBoundingClientRect();
	return {
		x: event.clientX - rect.left,
		y: event.clientY - rect.top
	};
}

function startAnimation() {
	animationRunning = true;
	runAnimation();
}

function stopAnimation() {
	animationRunning = false;
}

function runAnimation() {
	if (animationRunning) {
		window.requestAnimationFrame(runAnimation);
		updateAnimation();
		render();
	}
}

function updateAnimation() {
	var now = Date.now();
	if (animatedDiceGroup != null && (lastDiceAnimation == null || now - lastDiceAnimation >= 50)) {
		lastDiceAnimation = now;
		var i;
		for (i = 0; i < animatedDiceGroup.dices.length; ++i) {
			var d = animatedDiceGroup.dices[i];
			var newValue;
			do {
				newValue = Math.floor(Math.random() * d.values.length);
			}while (newValue == d.currentValue);
			d.currentValue = newValue;
		}
	}
}

function isAt(piece, x, y) {
	if (x >= piece.position.x && y >= piece.position.y) {
		if (x <= piece.position.x + piece.img.width && y <= piece.position.y + piece.img.height) {
			return true;
		}
	}
	return false;
}

function isEmpty(deck) {
	var i;
	for (i = 0; i < deck.composition.length; ++i) {
		if (deck.composition[i].number > 0) {
			return false;
		}
	}
	return true;
}

function countCards(deck) {
	var i;
	var total = 0;
	for (i = 0; i < deck.composition.length; ++i) {
		total += deck.composition[i].number;
	}
	return total;
}

function canvasMouseDown() {
	var pos = getCanvasPos();
	var i;

	// Check if we grab a piece (reverse order to grab the one draw on top of others)
	for (i = simulation.pieces.length - 1; i >= 0; --i) {
		if (isAt(simulation.pieces[i], pos.x, pos.y)) {
			simulation.pieces[i].selected = true;
			return;
		}
	}

	// Maybe we grab a card
	for (i = 0; i < simulation.decks.length; ++i) {
		var deck = simulation.decks[i];
		if (isAt(deck, pos.x, pos.y)) {
			if (! isEmpty(deck)) {
				// Select a card to pull from the deck
				var nbCards = countCards(deck);
				var cardIndex = Math.floor((Math.random() * nbCards));
				var currentIndex = 0;
				var cardToPull;
				for (cardToPUll = 0; cardToPUll < deck.composition.length; ++cardToPUll) {
					currentIndex += deck.composition[cardToPUll].number;
					if (deck.composition[cardToPUll].number > 0 && currentIndex >= cardIndex) {
						break;
					}
				}
				if (cardToPull >= deck.composition.length) {
					log("Bug: cardToPull: "+ cardToPull +" deckLength: "+ deck.composition.length);
					return;
				}

				// Pull the card
				deck.composition[cardToPUll].number -= 1;

				// Construct a piece from the card pulled
				img = deck.composition[cardToPUll].img;
				cardPiece = {
					img: img,
					selected: true,
					position: {
						x: pos.x - img.width / 2,
						y: pos.y - img.height / 2
					}
				}
				simulation.pieces.push(cardPiece);
				render();
				return;
			}
		}
	}

	// Maybe we throw dices
	for (i = 0; i < simulation.diceGroups.length; ++i) {
		var diceGroup = simulation.diceGroups[i];
		if (isAt(diceGroup, pos.x, pos.y)) {
			animatedDiceGroup = diceGroup;
			startAnimation();
			return;
		}
	}
}

function canvasMouseUp() {
	var i;
	for (i = 0; i < simulation.pieces.length; ++i) {
		simulation.pieces[i].selected = false;
	}

	animatedDiceGroup = null;
	animationRunning = false;
}

function canvasMouseMove() {
	var pos = getCanvasPos();
	var i;
	for (i = 0; i < simulation.pieces.length; ++i) {
		var p = simulation.pieces[i];
		if (p.selected) {
			p.position.x = pos.x - p.img.width / 2;
			p.position.y = pos.y - p.img.height / 2;
		}
	}
	render();
}

function render() {
	canvasCtx.drawImage(simulation.board.img, 0, 0);
	var i;
	for (i = 0; i < simulation.decks.length; ++i) {
		var d = simulation.decks[i];
		if (! isEmpty(d)) {
			canvasCtx.drawImage(d.img, d.position.x, d.position.y);
		}
	}

	for (i = 0; i < simulation.diceGroups.length; ++i) {
		var g = simulation.diceGroups[i];
		canvasCtx.drawImage(g.img, g.position.x, g.position.y);
		var j;
		for (j = 0; j < g.dices.length; ++ j) {
			var d = g.dices[j];
			canvasCtx.drawImage(d.values[d.currentValue].img, d.position.x + g.position.x, d.position.y + g.position.y);
		}
	}

	for (i = 0; i < simulation.pieces.length; ++i) {
		var p = simulation.pieces[i];
		canvasCtx.drawImage(p.img, p.position.x, p.position.y);
	}
}

