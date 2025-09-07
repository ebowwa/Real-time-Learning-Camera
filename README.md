# Local Vision AI: A Real-Time, On-Device Learning Camera

This application is a smart, real-time visual classifier that runs entirely in your web browser. It turns your device's camera into an intelligent system that you can teach to recognize new objects on the fly, without ever sending data to a server.

## ✨ Key Features

-   **100% Client-Side:** All image processing and classification happens locally on your device.
-   **Zero Cost & Zero Latency:** No API calls mean no costs and instant results.
-   **Works Offline:** Once the application is loaded, it can learn and classify objects without an internet connection.
-   **Privacy-Focused:** Your camera images are never sent over the network, ensuring complete privacy.
-   **Teach-on-the-Fly:** Dynamically teach the AI to recognize new objects with a single click.
-   **CPU-Efficient:** A smart motion detection algorithm ensures that the classification logic only runs when there are changes in the camera feed, saving battery and processing power.

---

## 🚀 How It Works: The Tech Behind the Magic

This project demonstrates a powerful yet lightweight approach to on-device computer vision. Instead of relying on expensive, cloud-based machine learning models, it uses a combination of classic, efficient computer vision techniques.

1.  **Motion Detection (The Gatekeeper):**
    -   To avoid constantly running a heavy classification algorithm, the app first checks for motion.
    -   It captures a tiny (32x32 pixel), grayscale version of the camera feed every few moments.
    -   By comparing the pixel data of the current frame to the previous one, it can quickly determine if significant motion has occurred.
    -   The more intensive classification step is only triggered when motion is detected.

2.  **Learning as Feature Extraction (Creating a "Fingerprint"):**
    -   When you teach the AI an object, it doesn't save the whole image.
    -   Instead, it analyzes the image and creates a **color histogram**. This is a mathematical representation of the color distribution in the image, which acts as a unique "fingerprint" for the object.
    -   This fingerprint (a simple array of numbers) is lightweight and efficient to store and compare.

3.  **Recognition as Comparison (Finding the Best Match):**
    -   When motion is detected, the app generates a new color histogram for the current camera frame.
    -   It then uses a high-speed comparison algorithm (**Histogram Intersection**) to measure the similarity between the live fingerprint and the fingerprints of all the objects it has learned.
    -   If the similarity score for a learned object is above a set threshold, the application identifies it as a match.

This hybrid approach provides the best of both worlds: the low-cost, high-speed efficiency of a simple motion-detection algorithm, combined with a fast and effective on-device classification model.

---

## 🕹️ How to Use

1.  **Start the Camera:** Click the "Start Camera" button. You may need to grant your browser permission to access the camera.
2.  **Teach an Object:** Point your camera at an object you want the AI to learn.
3.  **Give it a Name:** Type a name for the object in the input field (e.g., "Coffee Mug").
4.  **Learn:** Click the "Learn Object" button. The app will capture a frame and save the object's color fingerprint to its memory.
5.  **Recognize:** The AI will now instantly recognize the object whenever it's in the camera's view.
6.  **Expand its Brain:** Teach it more objects! It will do its best to distinguish between them in real-time. You can view and manage all learned items in the "Memory" list.
