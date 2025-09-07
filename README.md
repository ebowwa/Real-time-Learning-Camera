# Real-Time, On-Device Learning Camera

This application is a smart, real-time visual classifier that runs entirely in your web browser. It turns your device's camera into an intelligent system that you can teach to recognize new objects on the fly, with no server-side processing or external API calls required.

## ✨ Key Features

-   **On-Device AI:** All processing happens directly in your browser. No camera data is ever sent to a server, ensuring 100% privacy.
-   **Interactive Learning:** Teach the classifier by showing it an object and giving it a name.
-   **Real-time Classification:** Uses a sophisticated fingerprinting method analyzing both color and shape to instantly identify learned objects.
-   **Tunable Classifier:** A scalable control panel allows you to adjust the weight of each classification feature (e.g., Color, Shape) independently.
-   **CPU-Efficient:** A smart motion detection algorithm ensures classification only runs when needed, saving battery and processing power.
-   **Zero Dependencies:** No need for API keys or server-side components. It just works.

---

## 🚀 How It Works: The Tech Behind the Magic

This project uses a combination of efficient on-device motion detection and a multi-faceted computer vision technique for robust object recognition.

1.  **Motion Detection (The Gatekeeper):**
    -   To avoid constantly running expensive calculations, the app first checks for motion.
    -   It captures a tiny (32x32 pixel), grayscale version of the camera feed every few moments.
    -   By comparing the pixel data of the current frame to the previous one, it can quickly determine if significant motion has occurred.
    -   The more intensive classification step is only triggered when motion is detected.

2.  **Learning with Fingerprinting Features:**
    -   When you "learn" an object, the app analyzes the captured image to create a sophisticated "fingerprint" composed of multiple feature vectors:
        -   **Color Histogram:** This captures the overall color distribution of the object, creating a profile of its colors.
        -   **Histogram of Oriented Gradients (HOG):** This analyzes the object's texture and shape in a more sophisticated way. Instead of just looking at edge strength, it analyzes the *direction* of edges (e.g., horizontal, vertical, diagonal). This creates a much more detailed and robust fingerprint of the object's structure.
    -   This combined fingerprint, along with the label you provide, is stored locally in the browser.

3.  **Recognition via Comparison:**
    -   When motion is detected, the app generates a new two-part fingerprint for the current camera view in real-time.
    -   It then compares this new fingerprint to the saved fingerprints of all the objects it has learned.
    -   It calculates a weighted similarity score based on both color and shape matches. The weighting is controlled by the "Feature Weights" sliders. The system automatically normalizes these weights, so you can intuitively adjust the influence of each feature on the final decision.
    -   If the combined score is high enough, the app concludes it has found the object and displays its name.

This dual-analysis approach provides a fast, private, and surprisingly robust method for real-time object recognition directly on a user's device.

---

## 🕹️ How to Use

1.  **Start the Camera:** Click the "Start Camera" button. You may need to grant your browser permission to access the camera.
2.  **Teach an Object:** Point your camera at an object you want the classifier to learn.
3.  **Give it a Name:** Type a name for the object in the input field (e.g., "Coffee Mug").
4.  **Learn:** Click the "Learn Object" button. The app will capture a frame and save the object's unique fingerprint to its memory.
5.  **Fine-Tune (Optional):** Use the sliders in the "Feature Weights" section to adjust the importance of each feature. For an object with a unique shape but common color, increase the "Shape" weight. For an object with a distinct color, increase the "Color" weight. The percentages show the real-time influence of each feature.
6.  **Recognize:** The classifier will now attempt to recognize the object whenever it's in the camera's view and there is motion.
7.  **Expand its Brain:** Teach it more objects! It will do its best to distinguish between them in real-time. You can view and manage all learned items in the "Memory" list.

---

## 🧠 Future Enhancements

The current architecture is designed to be extensible. Here are some potential new "fingerprinting features" that could be added to make the classifier even more powerful:

### A. Texture Analysis: Local Binary Patterns (LBP)
-   **What it is:** LBP is a very powerful and efficient texture descriptor. It works by looking at the immediate neighborhood of each pixel and creating a "binary code" based on whether the neighbors are brighter or darker than the central pixel. A histogram of these codes creates a robust fingerprint of the object's surface texture.
-   **Why it's useful:** This would allow the classifier to distinguish between objects that have similar colors and shapes but different surface patterns. For example:
    -   An orange vs. a similarly colored tennis ball.
    -   A wooden block vs. a block of brushed metal.
    -   A book cover with text vs. a plain colored notebook.

### B. Keypoint Descriptors for Robustness (e.g., ORB)
-   **What it is:** This is a more advanced technique used in professional computer vision. Instead of analyzing the whole image, it finds a few dozen "interesting" or unique points (keypoints), like corners or distinct patterns. It then creates a small digital descriptor for the area around each keypoint. Classification is done by matching the keypoints between the live view and the learned object.
-   **Why it's useful:** This method is incredibly robust against changes in:
    -   **Rotation:** It doesn't matter if you hold the object upside down.
    -   **Scale:** It can recognize the object whether it's close to the camera or far away.
    -   **Occlusion:** It can still recognize the object even if part of it is covered.
