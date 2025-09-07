# Gemini Vision AI: A Real-Time, On-Device Learning Camera

This application is a smart, real-time visual classifier that runs in your web browser. It turns your device's camera into an intelligent system that you can teach to recognize new objects on the fly by leveraging the power of Google's Gemini API.

## ✨ Key Features

-   **Gemini-Powered Vision:** Utilizes Google's advanced multimodal AI for highly accurate object recognition.
-   **Interactive Learning:** Teach the AI what to look for by simply showing it an object and giving it a name.
-   **Real-time Feedback:** Get instant visual feedback as the AI identifies objects in the camera feed.
-   **CPU-Efficient:** A smart motion detection algorithm ensures that the powerful Gemini API is only called when there are changes in the camera feed, saving cost and processing power.
-   **Privacy Note:** For classification, camera frames are sent to Google's servers for analysis. Captured thumbnails for learned items are stored locally in your browser.

---

## 🚀 How It Works: The Tech Behind the Magic

This project leverages the powerful Google Gemini API to provide real-time object recognition. It combines efficient on-device motion detection with a state-of-the-art, cloud-based vision model.

1.  **Motion Detection (The Gatekeeper):**
    -   To avoid constantly running expensive API calls, the app first checks for motion.
    -   It captures a tiny (32x32 pixel), grayscale version of the camera feed every few moments.
    -   By comparing the pixel data of the current frame to the previous one, it can quickly determine if significant motion has occurred.
    -   The more intensive classification step is only triggered when motion is detected.

2.  **Learning as Context-Setting:**
    -   When you teach the AI an object, you are providing it with a label to look for. The app maintains a list of these "learned" object names.
    -   This list is used to give the AI context, focusing its analysis on only the items you care about. A thumbnail is captured and stored locally in your browser to represent the learned item.

3.  **Recognition via Gemini Vision:**
    -   When motion is detected, the app sends the current camera frame to the Gemini model along with the list of learned object names.
    -   It asks the model, "Which of these objects is in the image?"
    -   Gemini's powerful vision capabilities allow it to accurately identify objects, far surpassing the capabilities of simple on-device techniques.

This hybrid approach provides the best of both worlds: the low-cost, high-speed efficiency of a simple motion-detection algorithm, combined with a powerful and accurate cloud-based AI model.

---

## 🕹️ How to Use

1.  **Start the Camera:** Click the "Start Camera" button. You may need to grant your browser permission to access the camera.
2.  **Teach an Object:** Point your camera at an object you want the AI to learn.
3.  **Give it a Name:** Type a name for the object in the input field (e.g., "Coffee Mug").
4.  **Learn:** Click the "Learn Object" button. The app will capture a frame and save the object to its memory.
5.  **Recognize:** The AI will now attempt to recognize the object whenever it's in the camera's view and there is motion.
6.  **Expand its Brain:** Teach it more objects! It will do its best to distinguish between them in real-time. You can view and manage all learned items in the "Memory" list.