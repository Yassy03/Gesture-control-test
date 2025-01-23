let ellipseColor = " #1ED760";
let lastGesture = null;
let isProcessingAction = false; 
let lastVideoTime = -1; 
let results = undefined; 
let lastSkipTime = 0; // Timestamp of the last skip action
const skipCooldown = 4000;
let lastVolumeChangeTime = 0; // Timestamp of the last volume change
const volumeCooldown = 3000; // Cooldown period in milliseconds (5 seconds)
 // Cooldown period in milliseconds (2 seconds)

// Store last detections to reduce flickering
let detections = [];


// Placeholder for gesture recognition results
// Initialize the variable
// Add a flag to track if an action is being processed
const actionDelay = 1000; // 1-second delay
//placeholder name to keep count of the ellipse pulses
let pulsingInterval;

// Select the canvas and its context
//Refers to the HTML canvas element with the ID gestureCanvas also in css
const canvas = document.getElementById("gestureCanvas");
const canvasContext = canvas.getContext("2d");

const faceCanvas = document.getElementById("face_canvas");
const faceCtx = faceCanvas.getContext("2d");


async function loadFaceAPIModels() {
  try {
    console.log("Loading Face-API.js models...");
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    ]);
    console.log("Face-API.js models loaded!");
  } catch (error) {
    console.error("Error loading Face-API.js models:", error);
  }
}

setInterval(async () => {
  if (video.readyState === 4) {
    const options = new faceapi.TinyFaceDetectorOptions();
    const displaySize = { width: video.videoWidth, height: video.videoHeight };

    // Detect faces and scale results to canvas size
    const detectedResults = await faceapi
      .detectAllFaces(video, options)
      .withFaceLandmarks()
      .withFaceExpressions();

    detections = faceapi.resizeResults(detectedResults, displaySize);
  }
}, 100);



// Function to draw face detection results
function drawFaceDetections() {
  // Match faceCanvas size with video size
  faceCanvas.width = video.videoWidth;
  faceCanvas.height = video.videoHeight;

  // Clear the faceCanvas before drawing
  faceCtx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);

  if (detections.length > 0) {
    detections.forEach((detection) => {
      const { x, y, width, height } = detection.detection.box;

      // Draw bounding box
      faceCtx.strokeStyle = "#1ED760";
      faceCtx.lineWidth = 2;
      faceCtx.strokeRect(x, y, width, height);

      // Draw landmarks
      const landmarks = detection.landmarks.positions;
      faceCtx.fillStyle = "rgb(255, 0, 0)";
      landmarks.forEach((point) => {
        faceCtx.beginPath();
        faceCtx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        faceCtx.fill();
      });

      // Display the dominant emotion
      const expressions = detection.expressions;
      const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
      const dominantEmotion = sorted[0][0] || "unknown";
      if (["neutral", "happy", "sad", "surprised"].includes(dominantEmotion)) {
        currentMood = dominantEmotion; // Update current mood
        console.log(`Detected mood: ${currentMood}`);
      }
      

      faceCtx.fillStyle = "white";
      faceCtx.font = "20px Helvetica Neue";
      faceCtx.fillText(`Emotion: ${dominantEmotion}`, x, y - 10);
    });
  }
  requestAnimationFrame(drawFaceDetections);
}

// Load models, start face detection, and drawing
loadFaceAPIModels().then(() => {
  drawFaceDetections();
});


// Function to ensure gestureCanvas is visible and properly sized
function adjustCanvasResolution() {
  const container = document.getElementById("gesture_canvas_wrapper");
  const dpr = window.devicePixelRatio || 1;
  canvas.width = container.offsetWidth * dpr;
  canvas.height = container.offsetHeight * dpr;
  canvasContext.scale(dpr, dpr);
}

// Call this function when enabling the webcam
// window.addEventListener("resize", adjustCanvasResolution);
// adjustCanvasResolution()



// Function to draw an ellipse with adjustable size
function drawEllipseWithSize(color, size) {
  // Clear the canvas
  

  // Set the fill style and draw the ellipse
  canvasContext.fillStyle = color;
  canvasContext.beginPath();
  canvasContext.ellipse(
    canvas.width / (2 * window.devicePixelRatio),
    canvas.height / (2 * window.devicePixelRatio),
    size,
    size,
    0,
    0,
    2 * Math.PI
  );
  canvasContext.fill();
}

// Default ellipse rendering
function drawEllipse() {
  const minSize = Math.min(canvas.width, canvas.height) / 4;
  drawEllipseWithSize(ellipseColor, minSize / window.devicePixelRatio);
}

// Function to trigger the pulsing effect
function triggerPulsingEffect() {
  if (pulsingInterval) return; // Prevent multiple intervals

  pulsingInterval = setInterval(() => {
    let ringRadius = 30; // Start radius for the rings

    const pulseAnimation = setInterval(() => {
      canvasContext.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the expanding ring
      canvasContext.beginPath();
      canvasContext.strokeStyle = `rgba(30, 215, 96, ${1 - ringRadius / 100})`; // Fading effect
      canvasContext.lineWidth = 2 * window.devicePixelRatio;
      canvasContext.arc(
        canvas.width / (2 * window.devicePixelRatio),
        canvas.height / (2 * window.devicePixelRatio),
        ringRadius,
        0,
        2 * Math.PI
      );
      canvasContext.stroke();

      ringRadius += 5;

      // Stop the pulse when the ring fades out
      if (ringRadius > 100) {
        clearInterval(pulseAnimation);
      }
    }, 50);
  }, 500); // Pulse every 500ms
}

// Function to stop the pulsing effect
function stopPulsingEffect() {
  if (pulsingInterval) {
    clearInterval(pulsingInterval);
    pulsingInterval = null;
    drawEllipse(); // Restore the default ellipse
  }
}

// Resize and adjust canvas on window resize
function resizeCanvas() {
  adjustCanvasResolution(); // Adjust resolution
  drawEllipse(); // Redraw the default ellipse
}

// Set up the canvas initially
adjustCanvasResolution();
drawEllipse();

// Listen for window resize
window.addEventListener("resize", resizeCanvas);


import { GestureRecognizer, FilesetResolver } from "@mediapipe/tasks-vision";

console.log("MediaPipe Gesture Recognizer initialized");

const demosSection = document.getElementById("demos");
let gestureRecognizer;
let customGestureRecognizer; 
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;
// let lastVideoTime = -1;

const videoHeight = "360px";
const videoWidth = "480px";

// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.


const createGestureRecognizers = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );

  // Load the default gesture model
  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
      delegate: "GPU",
    },
    runningMode: 'VIDEO', // Ensure the runningMode is set to 'VIDEO'
  });

  // Load the custom model
  const customModelPath = "/models/gesture_recognizer_model (1).tflite"; // Path to your custom model
  customGestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: customModelPath,
      delegate: "GPU",
    },
    runningMode: 'VIDEO', // Ensure the runningMode is set to 'VIDEO'
  });

  console.log("Both models loaded successfully!");
};

createGestureRecognizers();
drawEllipse();
loadFaceAPIModels(); // Load Face-API models



/********************************************************************
// Demo 1: Detect hand gestures in images
********************************************************************/

const imageContainers = document.getElementsByClassName("detectOnClick");

for (let i = 0; i < imageContainers.length; i++) {
  imageContainers[i].children[0].addEventListener("click", handleClick);
}

async function handleClick(event) {
  if (!gestureRecognizer) {
    alert("Please wait for gestureRecognizer to load");
    return;
  }

  if (runningMode === "VIDEO") {
    runningMode = "IMAGE";
    await gestureRecognizer.setOptions({ runningMode: "IMAGE" });
  }
  // Remove all previous landmarks
  const allCanvas = event.target.parentNode.getElementsByClassName("canvas");
  for (var i = allCanvas.length - 1; i >= 0; i--) {
    const n = allCanvas[i];
    n.parentNode.removeChild(n);
  }

  const results = gestureRecognizer.recognize(event.target);

  // View results in the console to see their format
  console.log(results);
  if (results.gestures.length > 0) {
    const p = event.target.parentNode.childNodes[3];
    p.setAttribute("class", "info");

    const categoryName = results.gestures[0][0].categoryName;
    const categoryScore = parseFloat(
      results.gestures[0][0].score * 100
    ).toFixed(2);
    const handedness = results.handednesses[0][0].displayName;

    p.innerText = `GestureRecognizer: ${categoryName}\n Confidence: ${categoryScore}%\n Handedness: ${handedness}`;
    p.style =
      "left: 0px;" +
      "top: " +
      event.target.height +
      "px; " +
      "width: " +
      (event.target.width - 10) +
      "px;";

    const canvas = document.createElement("canvas");
    canvas.setAttribute("class", "canvas");
    canvas.setAttribute("width", event.target.naturalWidth + "px");
    canvas.setAttribute("height", event.target.naturalHeight + "px");
    canvas.style =
      "left: 0px;" +
      "top: 0px;" +
      "width: " +
      event.target.width +
      "px;" +
      "height: " +
      event.target.height +
      "px;";

    event.target.parentNode.appendChild(canvas);
    const canvasCtx = canvas.getContext("2d");
    const drawingUtils = new DrawingUtils(canvasCtx);
    for (const landmarks of results.landmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        GestureRecognizer.HAND_CONNECTIONS,
        {
          color: "#00FF00",
          lineWidth: 5,
        }
      );
      drawingUtils.drawLandmarks(landmarks, {
        color: "#FF0000",
        lineWidth: 1,
      });
    }
  }
}

/********************************************************************
// Demo 2: Continuously grab image from webcam stream and detect it.
********************************************************************/

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("gesture_canvas", "face_canvas");
const canvasCtx = canvasElement.getContext("2d");
const gestureOutput = document.getElementById("gesture_output");
const faceOutput = document.getElementById("face_output");





// Check if webcam access is supported.
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton");
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}



function enableCam(event) {
  if (!gestureRecognizer) {
    alert("Please wait for gestureRecognizer to load");
    return;
  }

  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButton.innerText = "Enable Predictions";
  } else {
    webcamRunning = true;
    enableWebcamButton.innerText = "Disable Predictions";
  }

  const constraints = { video: true };

  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    video.srcObject = stream;

    video.addEventListener("loadeddata", () => {
      // Adjust resolution only for face and gesture detection canvases, not gestureCanvas
      adjustCanvasResolution(faceCanvas, faceCtx, video.videoWidth, video.videoHeight);
      adjustCanvasResolution(canvasElement, canvasCtx, video.videoWidth, video.videoHeight);
      
      predictWebcam();
    });
  });
}






let lastFrameTime = 0; // Variable to track the time of the last frame
let isProcessingFrame = false; // Flag to prevent multiple frames from being processed at once

async function predictWebcam() {
  const webcamElement = document.getElementById("webcam");

  // Ensure that both gesture recognizers are set to 'VIDEO' mode
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await gestureRecognizer.setOptions({ runningMode: "VIDEO" });
    await customGestureRecognizer.setOptions({ runningMode: "VIDEO" });
  }

  // Skip processing if a frame is already being processed
  if (isProcessingFrame) return;

  isProcessingFrame = true; // Set flag to indicate frame processing

  const nowInMs = Date.now();
  const timeDiff = nowInMs - lastFrameTime;

  // Limit frame processing rate to avoid excessive API calls (every 100ms)
  if (timeDiff < 100) {
    setTimeout(() => {
      window.requestAnimationFrame(predictWebcam);
    }, 100 - timeDiff);
    isProcessingFrame = false;
    return;
  }

  lastFrameTime = nowInMs; // Update timestamp of last processed frame

  // Perform gesture recognition if video time has changed
  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    results = gestureRecognizer.recognizeForVideo(video, nowInMs); // Recognize gestures with default model
  }

  // Clear and prepare canvas for drawing
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  const drawingUtils = new DrawingUtils(canvasCtx);

  

  // Draw landmarks if they are detected
  if (results.landmarks) {
    for (const landmarks of results.landmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        GestureRecognizer.HAND_CONNECTIONS,
        { color: "#00FF00", lineWidth: 2 }
      );
      drawingUtils.drawLandmarks(landmarks, { color: "#FF0000", radius: 3 });
    }
  }

  canvasCtx.restore(); // Restore canvas state


  
  // **Default model gesture processing**
  if (results.gestures && results.gestures.length > 0) {
    const defaultCategoryName = results.gestures[0][0]?.categoryName || "Unknown";
    const defaultCategoryScore = parseFloat(results.gestures[0][0]?.score * 100 || 0).toFixed(2);
  
    // // Update gesture output display with detected gesture
    // gestureOutput.style.display = "block";
    // gestureOutput.style.width = videoWidth;
    
    function updateGestureOutputText(text) {
      const gestureOutputText = document.getElementById("gesture_output_text");
      gestureOutputText.innerText = text;
    }
    
    document.getElementById("gesture_text").innerText = `Default Gesture: ${defaultCategoryName}\nConfidence: ${defaultCategoryScore}%`;
  
    if (results.handednesses && results.handednesses[0]) {
      const handedness = results.handednesses[0][0]?.displayName || "Unknown";
      document.getElementById("gesture_text").innerText += `\nHandedness: ${handedness}`;
    }

    // Trigger actions for specific default gestures
    if (defaultCategoryName === "Open_Palm" && !isProcessingAction) {
      triggerPulsingEffect();
      console.log("Playing playlist...");
      await playPlaylist();
      isProcessingAction = true;
    } else if (defaultCategoryName === "Closed_Fist" && !isProcessingAction) {
      stopPulsingEffect();
      drawEllipseWithSize("#1ED760", 30); // Draw paused indicator
      console.log("Pausing playlist...");
      await pausePlaylist();
      isProcessingAction = true;
    } else if (defaultCategoryName === "Pointing_Up" && !isProcessingAction) {
      const now = Date.now();
      // Check if cooldown has passed for volume change
      if (now - lastVolumeChangeTime > volumeCooldown) {
        if (currentVolume < 100) {
          currentVolume = Math.min(currentVolume + 20, 100); // Increase volume, ensure it doesn't exceed 100%
          await setVolume(currentVolume); // Call the function to update Spotify volume
          console.log("Increasing volume to:", currentVolume);
          lastVolumeChangeTime = now;
        } else {
          console.log("Volume is already at the maximum.");
        }
      } else {
        console.log("Volume change on cooldown. Please wait...");
      }

    }
  } else {

    // gestureOutput.style.display = "block"; // Keep gestureOutput visible
    gestureOutput.style.width = videoWidth;
    document.getElementById("gesture_text").innerText = "No gesture detected";
    // No gestures detected: reset UI
    stopPulsingEffect();
    ellipseColor = "#1ED760";
    drawEllipse();
    // gestureOutput.style.display = "none";
    lastGesture = null;
  }

  // **Custom model gesture processing**
  const customResults = customGestureRecognizer.recognizeForVideo(video, nowInMs);
  if (customResults.gestures && customResults.gestures.length > 0) {
    const customCategoryName = customResults.gestures[0][0]?.categoryName || "Unknown";
    const customCategoryScore = parseFloat(customResults.gestures[0][0]?.score * 100 || 0).toFixed(2);

    // Append custom model output to the gestureOutput
    document.getElementById("gesture_text").innerText += `\nCustom Gesture: ${customCategoryName}\nConfidence: ${customCategoryScore}%`;

    // Trigger actions for specific custom gestures
    if (customCategoryName.toLowerCase() === "palm_right" && !isProcessingAction) {
      const now = Date.now();
      if (now - lastSkipTime > skipCooldown) {
        console.log("Detected palm_right gesture. Skipping to next track...");
        await skipToNextTrack();
        lastSkipTime = now;
        isProcessingAction = true;
      } else {
        console.log("Skip action on cooldown. Please wait...");
      }
    } else if (customCategoryName.toLowerCase() === "pointing_down" && !isProcessingAction) {
        const now = Date.now();
        // Check if cooldown has passed for volume change
        if (now - lastVolumeChangeTime > volumeCooldown) {
          if (currentVolume > 0) {
            currentVolume = Math.max(currentVolume - 20, 0); // Decrease volume, ensure it doesn't go below 0%
            await setVolume(currentVolume);
            console.log("Decreasing volume to:", currentVolume);
            lastVolumeChangeTime = now;
          } else {
            console.log("Volume is already at the minimum.");
          }
        } else {
          console.log("Volume change on cooldown. Please wait...");
        }
    }
  }


 
  // Reset the action flag after a delay to allow the next action
  setTimeout(() => {
    isProcessingAction = false;
  }, actionDelay);

  isProcessingFrame = false; // Reset frame processing flag
  if (webcamRunning) {
    window.requestAnimationFrame(predictWebcam); // Continue prediction loop
  }
}


window.addEventListener("resize", () => {
  adjustCanvasResolution(faceCanvas, faceCtx);
  adjustCanvasResolution(canvasElement, canvasCtx);
});

function positionGestureOutput() {
  const videoContainer = document.getElementById('video-container');
  const gestureOutput = document.getElementById('gesture_output');

  // Get the position and width of video-container
  const videoRect = videoContainer.getBoundingClientRect();

  // Set the left position of gesture_output 6px to the right of video-container
  gestureOutput.style.left = `${videoRect.right + 6 }px`;
  gestureOutput.style.top = `${videoRect.top}px`; // Align the top with video-container
}

// Call the function on load and on window resize
window.addEventListener('load', positionGestureOutput);
window.addEventListener('resize', positionGestureOutput);


// Set up an interval for face detection (every 500ms)

