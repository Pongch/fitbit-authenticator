import * as messaging from "messaging";
import { AuthUI } from "./interface.js";
import { display } from "display";

let ui = new AuthUI();
const ids = [];
const timeout = [];
var groups = 1;

timeout.push("Startup");
checkTimer(); 

display.addEventListener("change", function() {
  if (display.on) {
    wake();
  } else {
    sleep();
  }
});

// Listen for the onopen event
messaging.peerSocket.onopen = function() {
  ui.updateUI("loading");
  messaging.peerSocket.send("Open");
}

// Listen for the onmessage event
messaging.peerSocket.onmessage = function(evt) {
  if (evt.data.hasOwnProperty('color')) {
    ui.updateColors(evt.data.color);
  } else if (evt.data.hasOwnProperty('font')) {
    ui.updateFont(evt.data.font.selected);
    //re-render for font centering
    let epoch = Math.round(new Date().getTime() / 1000.0);
    getTokens(epoch);
  } else if (evt.data.hasOwnProperty('text_toggle')) {
    ui.updateCounter(evt.data.text_toggle);
  } else if (evt.data.hasOwnProperty('groups')) {
    groups = parseInt(evt.data.groups.selected);
    let epoch = Math.round(new Date().getTime() / 1000.0);
    getTokens(epoch);
  } else if (evt.data.hasOwnProperty('display_always')) {
    if (evt.data.display_always === true) {
      display.autoOff = false;
    } else {
      display.autoOff = true;
    }
  } else if (evt.data.hasOwnProperty('totps')) { //receive codes
    timeout = [];
    ui.updateUI("loaded", evt.data.totps, groups);
    if (evt.data.totps.length !== 0) {
      manageTimer("start"); 
    }
  }
}

messaging.peerSocket.onerror = function(err) {
  console.error("Connection error: " + err.code + " - " + err.message);
  ui.updateUI("error");
}

function wake() {
  let epoch = Math.round(new Date().getTime() / 1000.0);
  getTokens(epoch);
  ui.updateUI("loading");
}

function sleep() {
  // Stop animating and asking for tokens
  ui.stopAnimation();
  manageTimer("stop");
  timeout = []; // Don't want to flash error when resuming
}

function getTokens(epoch) {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send({
      tokenRequest: epoch
    });
  } else {
    ui.updateUI("error");
  }
  timeout.push(epoch);
}

function checkTimer() {
  setTimeout(function() {
    if (timeout.length !== 0) {
      //No msg received in 33s (token refresh + latency)
      ui.updateUI("error");
    } 
  }, 33000);   
}

function manageTimer(arg) {
  if (arg === "stop") {
    ui.stopAnimation();
    for (let i of ids) {
      clearInterval(i);
    } 
    checkTimer();   
    ids = []; //empty array
  } else if (arg === "start") {
    if (ids.length === 0) { //don't double start animation
      ui.resumeTimer();
      let id = setInterval(timer, 1000);
      ids.push(id);  
    }
  } else {
    console.error("Invalid timer management argument.")
  }
}

function timer() {
  // Update tokens every 30s
  let epoch = Math.round(new Date().getTime() / 1000.0);
  let countDown = 30 - (epoch % 30);
  if (epoch % 30 == 0) {
    ui.updateTextTimer("loading");
    getTokens(epoch);
    manageTimer("stop");
  } else {
    ui.updateTextTimer(countDown);
  }
}

//Test Codes
//ZVZG5UZU4D7MY4DH
//test:ZVZG 5UZU 4D7M Y4DH ZVZG ZVZG AB
//JBSWY3DPEHPK3PXP