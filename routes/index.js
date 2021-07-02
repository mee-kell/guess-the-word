var express = require('express');
var router = express.Router();

// Makes it easier to change the message throughout our game's logic
const MessagingResponse = require('twilio').twiml.MessagingResponse;

// Creates a route at /play-game that Twilio will POST to
router.post('/play-game', (req, res) => {
  // Creates a new instance of the MessagingResponse object
  const twiml = new MessagingResponse();

  // Clean data for consistent formatting
  const incomingMsg = req.body.Body.toLowerCase().trim();
  console.log(incomingMsg);

  // Twilio Phone Number: +19729145616

  // 💡 Add a secret word to test this game with!
  const word = 'tig';

  // ✨ Helper functions ✨
    
  const handleNewGame = () => {
    // 💡 Set up a new game
    req.session.wordState = new Array(word.length).fill('_');
    req.session.lives = 5;
    req.session.playing = true;
    twiml.message(`✨ Text back one letter at a time to try and figure out the word. If you know the word, text the entire word! ✨ \n\nYou have ${req.session.lives} lives left. \n\n ${req.session.wordState.join(' ')}`);
  }

  const handleInvalidSMS = () => {
    // 💡 Send an error message
    twiml.message("👋 Welcome to Hangman. Please type 'start' to play.");
  }

  const checkForSuccess = () => {
    // 💡 Check to see if player guessed the full word or a letter in it
    if (incomingMsg == word) { return "win"; }
    if (word.includes(incomingMsg)) { return "match"; }
    return false;
  }

  const handleGameOver = msg => {
    // 💡 Notify the player that the game is over
    twiml.message(msg);
    req.session.destroy();
  }

  const handleBadGuess = () => {
    // 💡 Let the player know if their guess was incorrect
    req.session.lives--;
    if (req.session.lives == 0) {
      handleGameOver("You died. 💀 Please start again!")
    } else {
      twiml.message(`Oops! You have ${req.session.lives} lives remaining.`)
    }
  }

  const handleMatch = () => {
    // 💡 Update hint with correct guesses
    for (let [i, char] of [...word].entries()) {
      if (char == incomingMsg) {
        req.session.wordState[i] = incomingMsg;
      }
    }

    if (req.session.wordState.join('') == word) {
      handleGameOver(`The word was ${word}! You won 🎉`)
    } else {
      twiml.message(`You got a letter! 👍 \n\n${req.session.wordState.join(' ')}`)
    }
  }

  // 🎮 Game Play Logic 🎮

  if (!req.session.playing) {
    // 💡 Set up game logic with the helper functions
    if (incomingMsg == 'start') {
      handleNewGame();
    } else {
      handleInvalidSMS();
    }
  } else {
    // 💡 Logic once you've started playing the game!
    const success = checkForSuccess();
    if (success == "win") {
      handleGameOver(`The word was ${word}! You won 🎉`);
    } else if (success == "match") {
      handleMatch();
    } else {
      handleBadGuess();
    }
  }

  // Sends the response back to the user
  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
});

module.exports = router;