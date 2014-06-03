var canvas = null;
var canvasCtx = null;

var simulation = {
	board: {
		img: null
	},
	pieces: [
		{
			img: null,
			selected: false,
			position: {
				x: 0,
				y: 0
			}
		},
		{
			img: null,
			selected: false,
			position: {
				x: 200,
				y: 200
			}
		}
	],
	decks: [
		{
			img: null,
			position: {
				x: 400,
				y: 200
			},
			composition: [
				{
					number: 3,
					img: null,
				},
				{
					number: 2,
					img: null,
				}
			]
		}
	]
};

function log(msg) {
	document.getElementById("log").innerHTML += "<p>"+ msg +"</p>";
}

function init(canvasId) {
	// Setup rendering
	canvas = document.getElementById(canvasId);
	canvasCtx = canvas.getContext("2d");

	// Setup simulation
	simulation.board.img = new Image();
	simulation.board.img.addEventListener("load", waitLoad, false);
	simulation.board.img.src = "imgs/board.jpg";

	simulation.pieces[0].img = new Image();
	simulation.pieces[0].img.addEventListener("load", waitLoad, false);
	simulation.pieces[0].img.src = "imgs/piece.png";
	simulation.pieces[1].img = new Image();
	simulation.pieces[1].img.addEventListener("load", waitLoad, false);
	simulation.pieces[1].img.src = "imgs/piece.png";

	simulation.decks[0].img = new Image();
	simulation.decks[0].img.addEventListener("load", waitLoad, false);
	simulation.decks[0].img.src = "imgs/cardback.png";
	simulation.decks[0].composition[0].img = new Image();
	simulation.decks[0].composition[0].img.addEventListener("load", waitLoad, false);
	simulation.decks[0].composition[0].img.src = "imgs/card1.png";
	simulation.decks[0].composition[1].img = new Image();
	simulation.decks[0].composition[1].img.addEventListener("load", waitLoad, false);
	simulation.decks[0].composition[1].img.src = "imgs/card2.png";
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

	//debug
	log("width: "+ canvas.width +" height: "+ canvas.height);

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

function isAt(piece, x, y) {
	log("piece width: "+ piece.img.width +" height: "+ piece.img.height);
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
	log("mouseDown page("+ event.pageX +", "+ event.pageY +") canvas("+ pos.x +", "+ pos.y +")");

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
			}
		}
	}
}

function canvasMouseUp() {
	var i;
	for (i = 0; i < simulation.pieces.length; ++i) {
		simulation.pieces[i].selected = false;
	}
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

	for (i = 0; i < simulation.pieces.length; ++i) {
		var p = simulation.pieces[i];
		canvasCtx.drawImage(p.img, p.position.x, p.position.y);
	}
}

